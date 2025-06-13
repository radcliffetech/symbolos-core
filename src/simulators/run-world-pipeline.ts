import type {
  PipelineArgs,
  PipelineRun,
  SymbolicAction,
  SymbolicObject,
  WorldFrame,
  WorldFunctorStep,
  WorldInstance,
  WorldSimulatorConfig,
} from "../types";

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

const recordSymbolicAction = async ({
  entry,
  transformationId,
  context,
  instrumentId,
  purpose,
  tick,
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
    id: frame.id || `world-${frame.tick}`,
    tick: frame.tick ?? 0,
    step: frame.step ?? 0,
    runId,
    pipelineId,
    artifacts,
    context: {},
  };
}

export function createWorld(worldId?: string, runId?: string): WorldInstance {
  const id = worldId || "world-" + crypto.randomUUID();
  return {
    id,
    tick: 0,
    step: 0,
    runId: runId || new Date().toISOString().replace(/[:.]/g, "-"),
    pipelineId: worldId || "world-" + crypto.randomUUID(),
    artifacts: new Map<string, SymbolicObject>(),
    context: {},
  };
}

// Dedicated Gen3 pipeline runner for WorldInstance-only functors
export async function runWorldPipeline({
  world,
  steps,
  pipelineArgs,
  frameHandler = (world) => world,
}: {
  world: WorldInstance;
  steps: WorldFunctorStep[];
  pipelineArgs?: PipelineArgs;
  frameHandler?: (world: WorldInstance) => WorldInstance;
}): Promise<WorldInstance> {
  if (!world.context) world.context = {};
  if (!world.artifacts) world.artifacts = new Map();

  world.context._artifactsById = world.artifacts;
  if (!pipelineArgs) {
    pipelineArgs = createSymbolicObject<PipelineArgs>("PipelineArgs", {
      id: "pipeline-args-" + crypto.randomUUID(),
      params: {},
    });
  }
  world.context.pipelineArgs = pipelineArgs;
  world.context.pipelineId = world.pipelineId;
  world.context.runId = world.runId;

  for (const [index, step] of Object.entries(steps)) {
    if (step.tickAdvance !== false) {
      world.tick += 1;
    }

    const result = await step.functor.apply({ world });

    if (!result.world.context) result.world.context = {};
    if (!result.world.artifacts) result.world.artifacts = new Map();
    result.world.context._artifactsById = result.world.artifacts;

    if (!result.world.context._batchedEntries)
      result.world.context._batchedEntries = [];

    const outputList = result.output
      ? flattenSymbolicObjects(result.output)
      : [];
    for (const entry of outputList) {
      result.world.context._batchedEntries.push({
        entry,
        transformationId: step.id,
        instrumentId: step.functor.id,
        purpose: step.purpose,
        tick: world.tick,
        stepPrefix: String(Number(index) + 1).padStart(3, "0"),
      });
    }

    world = frameHandler(world);
  }

  for (const batched of world.context._batchedEntries ?? []) {
    await recordSymbolicAction({
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

  world.context._batchedEntries = [];

  // const pipelineRun = createPipelineRunObject(
  //   world.pipelineId,
  //   world.runId,
  //   world.tick,
  //   steps.length,
  //   world.context.forkedFromRunId
  // );

  // addToArtifacts(world.context, pipelineRun);

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
  const newId = "forked-" + crypto.randomUUID();
  return {
    id: newId,
    tick: sourceWorld.tick,
    step: sourceWorld.step,
    runId: newId,
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
