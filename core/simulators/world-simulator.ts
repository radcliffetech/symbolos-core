import type {
  FunctorStep,
  PipelineArgs,
  SymbolicAction,
  SymbolicObject,
  WorldInstance,
} from '@core/types';
import { SymbolicWorldFrame, storeWorldArchive, storeWorldFrame } from '../lib/utils/world-utils';

import chalk from 'chalk';
import crypto from 'node:crypto';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = 'sandbox/worlds';

export type WorldSimulatorConfig = {
  verbose?: boolean;
};

interface RecordSymbolicActionParams {
  context: Record<string, any>;
  entry: SymbolicObject;
  transformationId: string; //
  instrumentId: string;
  purpose: string;
  tick: number;
  stepPrefix?: string;
  chainDir?: string;
  storeFiles?: boolean;
}

function addToArtifacts(context: Record<string, any>, obj: any) {
  if (!obj?.id) return;
  context._artifactsById.set(obj.id, obj);
}

function getArtifacts(context: Record<string, any>): any[] {
  return Array.from(context._artifactsById.values());
}

function flattenSymbolicObjects(obj: any): SymbolicObject[] {
  const results: SymbolicObject[] = [];
  const seen = new Set<string>();
  const stack: any[] = [obj];

  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;

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
  simulationTick: number,
  params?: Record<string, any>
): Promise<{ output: any[]; newId: string }> {
  const { functor, resolveInput } = step;

  // Optimize input mapping: avoid full clone and skip unnecessary await
  let mappedInput: any;
  if (resolveInput) {
    const result = resolveInput(input, context);
    mappedInput = result instanceof Promise ? await result : result;
  } else {
    mappedInput = input;
  }
  const stepLabel = `🔁 [${simulationTick}] Step ${index + 1}: ${functor.inputType} ➝ ${
    functor.outputType
  }`;
  console.log(chalk.cyan.bold(`[runPipeline] ${stepLabel}`));
  if (verbose) {
    console.log(
      chalk.yellow(`[runPipeline] Mapped input for step ${index + 1}: ${step.id}`, mappedInput)
    );
  }
  const inputItems = Array.isArray(mappedInput) ? mappedInput : [mappedInput];
  if (verbose) {
    console.log(
      chalk.gray(`[runPipeline] Number of input items for step ${index + 1}: ${inputItems.length}`)
    );
  }
  let output: SymbolicObject[] = [];
  for (const [itemIndex, item] of inputItems.entries()) {
    const fullInput = { ...item };
    if (verbose) {
      console.log(
        chalk.yellow(
          `[runPipeline] Applying functor ${functor.method} to input item ${itemIndex + 1}:`
        )
      );
    }
    const functorOutput = await functor.apply(fullInput, context);
    const transformation: Record<string, any> = {
      id: `tx-${crypto.randomUUID()}`,
      type: 'Transformation',
      method: functor.method,
      createdAt: new Date().toISOString(),
      tick: simulationTick,
      inputId: fullInput.id,
      outputId: Array.isArray(functorOutput)
        ? functorOutput.map((o: any) => o?.id).filter(Boolean)
        : functorOutput?.id,
    };

    if (verbose) {
      console.log(
        chalk.gray(`[runPipeline] Functor ${functor.method} completed for item ${itemIndex + 1}.`)
      );
    }

    const flattened = flattenSymbolicObjects(functorOutput);
    for (const obj of flattened) {
      if (obj && typeof obj === 'object' && !('tick' in obj)) {
        obj.tick = simulationTick;
      }
    }
    if (transformation && !('tick' in transformation)) {
      transformation.tick = simulationTick;
    }

    addToArtifacts(context, transformation);
    flattened.forEach((obj) => addToArtifacts(context, obj));

    output.push(...flattened);
  }

  if (output.length === 0) {
    if (verbose)
      console.log(
        chalk.red(`[runPipeline] ⚠️ No output returned by step ${index + 1}: ${step.id}`)
      );
  } else {
    if (verbose) {
      console.log(
        chalk.green(
          `\n[runPipeline] ✅ Step Output: ${
            output.length > 1
              ? output.map((o) => `${o.type} (${o.id})`).join(', ')
              : `${output[0].type} (${output[0].id})`
          }\n`
        )
      );
    }
  }

  return { output, newId: output.length === 1 ? output[0].id : id };
}

const recordSymbolicAction = async ({
  entry,
  transformationId,
  context,
  instrumentId,
  purpose,
  tick,
}: RecordSymbolicActionParams): Promise<void> => {
  const action: SymbolicAction = {
    id: `action-${crypto.randomUUID()}`,
    type: 'SymbolicAction',
    label: `${entry.type} Action`,

    transformationId,
    actorId: context.subjectiveFrame?.id ?? 'unknown-actor',
    contextId: context.contextualFrame?.id ?? 'unknown-context',
    criteriaId: context.selectionCriteria?.id ?? 'unknown-criteria',
    instrumentId: instrumentId ?? context.instrumentId ?? 'default-instrument', // Use provided instrumentId or default
    purpose: purpose ?? context.purpose ?? 'default-purpose', // Use provided purpose or default
    inputId: entry.id,
    outputId: entry.id,

    rootId: 'action-root', // all actions are linked to a root action
    status: 'completed',

    timestamp: new Date().toISOString(),
    tick,
    createdAt: new Date().toISOString(),
  };

  // Add the action to context._artifacts, replacing if already present
  addToArtifacts(context, action);
};

interface CreateWorldFromFrameParams {
  frame: SymbolicWorldFrame;
  pipelineId: string;
  runId: string;
}
export function createWorldFromFrame({
  frame,
  pipelineId,
  runId,
}: CreateWorldFromFrameParams): WorldInstance {
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

export function makeNewWorld(pipelineId: string): WorldInstance {
  return {
    tick: 0,
    step: 0,
    runId: new Date().toISOString().replace(/[:.]/g, '-'),
    pipelineId,
    artifacts: new Map<string, SymbolicObject>(),
    context: {},
  };
}

/**
 * Run a world pipeline using a SymbolicWorld as the stateful model.
 * @param world - The SymbolicWorld instance (mutable, stateful)
 * @param userArgs - PipelineArgs object (contains input parameters and config)
 * @param steps - Array of FunctorStep pipeline steps
 * @param config - Optional run config
 * @returns The mutated SymbolicWorld after running all steps
 */
export async function runWorldPipeline({
  world,
  userArgs,
  steps,
  config,
}: {
  world: WorldInstance;
  userArgs: PipelineArgs;
  steps: FunctorStep[];
  config: WorldSimulatorConfig;
}) {
  const { verbose } = config;

  const runId = world.runId;
  const pipelineId = world.pipelineId;

  console.log(chalk.blueBright(`🔧 Running pipeline: ${pipelineId} with runId: ${runId}`));
  console.log(config);

  let input: any = userArgs;
  let id = pipelineId;

  world.context.pipelineId = pipelineId;
  world.context.runId = runId;
  world.context._artifactsById = world.artifacts;

  addToArtifacts(world.context, userArgs);

  for (const [index, step] of steps.entries()) {
    if (step.tickAdvance !== false) {
      world.tick += 1;
    }

    const { output, newId } = await executeCycleStep(
      step,
      index,
      input,
      id,
      world.context,
      verbose ?? false,
      world.tick,
      userArgs.params
    );

    input = output;
    id = newId;

    if (step.storeOutputAs) {
      world.context[step.storeOutputAs] = output.length === 1 ? output[0] : output;
    }

    // --- Collect output entries for later batched store/write ---
    if (!world.context._batchedEntries) world.context._batchedEntries = [];
    for (const entry of output) {
      world.context._batchedEntries.push({
        entry,
        transformationId: id,
        instrumentId: step.functor.id,
        purpose: step.purpose,
        tick: world.tick,
        chainDir: `sandbox/${pipelineId}/${runId}`,
        stepPrefix: String(index + 1).padStart(3, '0'),
      });
    }

    await storeWorldFrame({
      context: world.context,
      pipelineId,
      runId,
      config,
      tick: world.tick,
      step: index,
      getArtifacts,
    });

    if (verbose) {
      console.log(chalk.gray(`[runWorldPipeline] Saved frame t${world.tick}-s${index}`));
    }
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
        chainDir: batched.chainDir,
        stepPrefix: batched.stepPrefix,
        tick: batched.tick,
      });
    }
  }

  const { filePath: archivePath } = await storeWorldArchive({
    context: world.context,
    pipelineId,
    runId,
    config,
    getArtifacts,
  });

  const frontendPath = path.join(OUTPUT_DIR, `${pipelineId}.world.json.gz`);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.copyFile(archivePath, frontendPath);

  const pipelineRun = {
    type: 'PipelineRun',
    id: `pipeline-run-${crypto.randomUUID()}`,
    label: world.context.forkedFromRunId
      ? `Forked Run from ${world.context.forkedFromRunId}`
      : 'Pipeline Run',
    pipelineId,
    runId,
    tickCount: world.tick,
    stepCount: steps.length,
    createdAt: new Date().toISOString(),
    status: 'completed',
    ...(world.context.forkedFromRunId && { forkedFromRunId: world.context.forkedFromRunId }),
  };
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
    runId: 'forked-' + crypto.randomUUID(),
    pipelineId: sourceWorld.pipelineId,
    artifacts,
    context: {
      _artifactsById: artifacts,
      ...sourceWorld.context,
      forkedFromRunId: sourceWorld.runId,
      ...(newParams ? { userArgs: { params: newParams } } : {}),
    },
  };
}
