import type {
  FunctorStep,
  PipelineArgs,
  PipelineRun,
  SymbolicAction,
  SymbolicObject,
  WorldFrame,
  WorldInstance,
  WorldSimulatorConfig,
} from "../types";

import chalk from "chalk";
import { createSymbolicObject } from "../lib/object-factory";
import crypto from "node:crypto";

function createPipelineRunObject(
  pipelineId: string,
  runId: string,
  tick: number,
  stepCount: number,
  forkedFromRunId?: string
) {
  return createSymbolicObject<PipelineRun>("PipelineRun", {
    id: `pipeline-run-${crypto.randomUUID()}`,
    label: forkedFromRunId
      ? `Forked Run from ${forkedFromRunId}`
      : "Pipeline Run",
    pipelineId,
    runId,
    tickCount: tick,
    stepCount,
    status: "completed",
    ...(forkedFromRunId && { forkedFromRunId }),
  });
}

interface RecordSymbolicActionParams {
  context: Record<string, any>;
  entry: SymbolicObject;
  transformationId: string; //
  instrumentId: string;
  purpose: string;
  tick: number;
  stepPrefix?: string;
  outputObject?: SymbolicObject | null;
}

function addToArtifacts(context: Record<string, any>, obj: any) {
  if (!obj?.id) return;
  context._artifactsById.set(obj.id, obj);
}

function flattenSymbolicObjects(obj: any): SymbolicObject[] {
  const results: SymbolicObject[] = [];
  const seen = new Set<string>();
  const stack: any[] = [obj];

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;

    if (current.id && current.type && !seen.has(current.id)) {
      seen.add(current.id);
      results.push(current as SymbolicObject);
    }

    for (const val of Object.values(current)) {
      stack.push(val);
    }
  }

  return results;
}

async function executeCycleStep(
  step: FunctorStep,
  index: number,
  input: any,
  id: string,
  context: Record<string, any>,
  verbose: boolean,
  simulationTick: number
): Promise<{
  output: any[];
  newId: string;
  outputObject: SymbolicObject | null;
}> {
  const { functor, resolveInput } = step;

  let mappedInput: any;
  if (resolveInput) {
    const result = resolveInput(input, context);
    mappedInput = result instanceof Promise ? await result : result;
  } else {
    mappedInput = input;
  }
  const stepLabel = `🔁 [${simulationTick}] Step ${index + 1}: ${
    functor.inputType
  } ➝ ${functor.outputType}`;
  if (verbose) {
    console.log(chalk.cyan.bold(`[symbolos] ${stepLabel}`));
    console.log(
      chalk.blue(
        `[symbolos] Mapped input for step ${index + 1}: ${step.id}`,
        mappedInput
      )
    );
  }
  const inputItems = Array.isArray(mappedInput) ? mappedInput : [mappedInput];
  if (verbose) {
    console.log(
      chalk.blue(
        `[symbolos] Number of input items for step ${index + 1}: ${
          inputItems.length
        }`
      )
    );
  }
  let output: SymbolicObject[] = [];
  let outputObject: SymbolicObject | null = null;
  for (const [itemIndex, item] of Object.entries(inputItems)) {
    const fullInput = { ...item };
    if (verbose) {
      console.log(
        chalk.yellow(
          `\n[symbolos] Applying functor ${functor.method} to input item ${
            itemIndex + 1
          }:\n`
        )
      );
    }
    const functorResult = await functor.apply(fullInput, context);
    const outputWorld = functorResult?.world ?? functorResult;
    outputObject = functorResult?.outputObject ?? null;
    const transformation: Record<string, any> = {
      id: `tx-${crypto.randomUUID()}`,
      type: "Transformation",
      method: functor.method,
      createdAt: new Date().toISOString(),
      tick: simulationTick,
      inputId: fullInput.id,
      outputId: Array.isArray(outputWorld)
        ? outputWorld.map((o: any) => o?.id).filter(Boolean)
        : outputWorld?.id,
    };

    if (verbose) {
      console.log(
        chalk.greenBright(
          `[symbolos] Functor ${functor.method} completed for item ${
            itemIndex + 1
          }.`
        )
      );
    }

    const flattened = flattenSymbolicObjects(outputWorld);
    for (const obj of flattened) {
      if (obj && typeof obj === "object" && !("tick" in obj)) {
        obj.tick = simulationTick;
      }
    }
    if (transformation && !("tick" in transformation)) {
      transformation.tick = simulationTick;
    }

    addToArtifacts(context, transformation);
    flattened.forEach((obj) => addToArtifacts(context, obj));

    output.push(...flattened);
  }

  if (output.length === 0 && outputObject) {
    output.push(outputObject);
  }

  if (output.length === 0) {
    if (verbose)
      console.log(
        chalk.red(
          `[symbolos] ⚠️ No output returned by step ${index + 1}: ${step.id}`
        )
      );
  } else {
    if (verbose) {
      // group the output by type and  count them
      const typeCounts: Record<string, number> = {};
      for (const obj of output) {
        if (obj.type) {
          typeCounts[obj.type] = (typeCounts[obj.type] || 0) + 1;
        }
      }
      console.log(
        chalk.green(`\n[symbolos] ✅ Step Output: ${output.length} item(s)`)
      );
      console.log(
        chalk.green(
          `[symbolos] Output types: ${Object.entries(typeCounts)
            .map(([type, count]) => `${type}: ${count}`)
            .join(", ")}\n`
        )
      );
    }
  }

  return {
    output,
    newId: output.length === 1 ? output[0].id : id,
    outputObject,
  };
}

const recordSymbolicAction = async ({
  entry,
  transformationId,
  context,
  instrumentId,
  purpose,
  tick,
  stepPrefix,
  outputObject,
}: RecordSymbolicActionParams): Promise<void> => {
  const action = createSymbolicObject<SymbolicAction>("SymbolicAction", {
    id: `action-${crypto.randomUUID()}`,
    label: `${entry.type} Action`,
    transformationId,
    actorId:
      outputObject?.rootId ??
      context.subjectiveFrame?.id ??
      entry.rootId ??
      "unknown-actor",
    contextId: context.contextualFrame?.id ?? "unknown-context",
    instrumentId: instrumentId ?? context.instrumentId ?? "default-instrument", // Use provided instrumentId or default
    purpose: purpose ?? context.purpose ?? "default-purpose", // Use provided purpose or default
    inputId: outputObject?.rootId ?? entry.rootId ?? entry.id,
    outputId: outputObject?.id ?? entry.id,
    rootId: "action-root", // all actions are linked to a root action
    status: "completed",
    tick,
  });

  addToArtifacts(context, action);
};

interface createWorldInstanceFromFrameParams {
  frame: WorldFrame;
  pipelineId: string;
  runId: string;
}
export function createWorldInstanceFromFrame({
  frame,
  pipelineId,
  runId,
}: createWorldInstanceFromFrameParams): WorldInstance {
  const artifacts = new Map<string, SymbolicObject>();
  for (const obj of frame.members) {
    artifacts.set(obj.id, obj);
  }
  return {
    tick: frame.tick ?? 0,
    step: frame.step ?? 0,
    runId,
    pipelineId,
    artifacts,
    context: {},
  };
}

export function createNewWorldInstance(
  pipelineId: string,
  runId?: string
): WorldInstance {
  return {
    tick: 0,
    step: 0,
    runId: runId || new Date().toISOString().replace(/[:.]/g, "-"),
    pipelineId,
    artifacts: new Map<string, SymbolicObject>(),
    context: {},
  };
}

export async function runGen2WorldSimulation({
  world,
  pipelineArgs,
  steps,
  simulatorConfig,
  frameHandler = () => {},
}: {
  world: WorldInstance;
  pipelineArgs: PipelineArgs;
  steps: FunctorStep[];
  simulatorConfig: WorldSimulatorConfig;
  frameHandler?: (world: WorldInstance) => void; // on each new world frame
}): Promise<WorldInstance> {
  const { verbose } = simulatorConfig;

  const runId = world.runId;
  const pipelineId = world.pipelineId;

  console.log(
    chalk.blueBright(
      `[symbolos] 🔧 Running pipeline: ${pipelineId} with runId: ${runId}`
    )
  );

  let input: any = pipelineArgs; // initial input to the pipeline
  let id = pipelineId;

  world.context.pipelineId = pipelineId;
  world.context.runId = runId;
  world.context._artifactsById = world.artifacts;

  addToArtifacts(world.context, pipelineArgs);

  for (const [index, step] of Object.entries(steps)) {
    if (step.tickAdvance !== false) {
      world.tick += 1;
    }

    const { output, newId, outputObject } = await executeCycleStep(
      step,
      Number(index),
      input,
      id,
      world.context,
      verbose ?? false,
      world.tick
    );

    input = output;
    id = newId;

    if (step.storeOutputAs) {
      world.context[step.storeOutputAs] =
        output.length === 1 ? output[0] : output;
    }

    if (!world.context._batchedEntries) world.context._batchedEntries = [];
    for (const entry of output) {
      world.context._batchedEntries.push({
        entry,
        transformationId: step.id,
        instrumentId: step.functor.id,
        purpose: step.purpose,
        tick: world.tick,
        stepPrefix: String(Number(index) + 1).padStart(3, "0"),
        outputObject,
      });
    }

    world.context._lastOutputObject = outputObject;

    await frameHandler(world);
  }

  if (
    world.context._batchedEntries &&
    Array.isArray(world.context._batchedEntries) &&
    world.context._batchedEntries.length > 0
  ) {
    for (const batched of world.context._batchedEntries) {
      recordSymbolicAction({
        entry: batched.entry,
        transformationId: batched.transformationId,
        instrumentId: batched.instrumentId,
        purpose: batched.purpose,
        context: world.context,
        stepPrefix: batched.stepPrefix,
        tick: batched.tick,
        outputObject: batched.outputObject,
      });
    }

    // clear the batched entries after processing
    world.context._batchedEntries = [];
  }

  const pipelineRun = createPipelineRunObject(
    pipelineId,
    runId,
    world.tick,
    steps.length,
    world.context.forkedFromRunId
  );
  addToArtifacts(world.context, pipelineRun);

  return world;
}

export function forkWorld(
  sourceWorld: WorldInstance,
  newParams?: Record<string, any>
): WorldInstance {
  const artifacts = new Map<string, SymbolicObject>();
  for (const [id, obj] of sourceWorld.artifacts.entries()) {
    artifacts.set(id, obj);
  }

  return {
    tick: sourceWorld.tick,
    step: sourceWorld.step,
    runId: "forked-" + crypto.randomUUID(),
    pipelineId: sourceWorld.pipelineId,
    artifacts,
    context: {
      _artifactsById: artifacts,
      ...sourceWorld.context,
      forkedFromRunId: sourceWorld.runId,
      ...(newParams ? { pipelineArgs: { params: newParams } } : {}),
    },
  };
}
