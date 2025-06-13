import type {
  FunctorStep,
  PipelineArgs,
  PipelineResult,
  PipelineRun,
  SymbolicAction,
  WorldInstance,
} from "../types";
import {
  addToArtifacts,
  createPipelineRunObject,
  flattenSymbolicObjects,
  recordSymbolicAction,
} from "../lib/pipeline-helpers";

import { World } from "../lib/world-context";

/**
 * Executes a sequence of symbolic functor steps on a WorldInstance.
 * Handles tick advancement, symbolic output batching, and provenance tracking.
 *
 * @param world - The mutable symbolic runtime.
 * @param steps - Ordered list of functor steps.
 * @param pipelineArgs - Optional parameter object.
 * @param frameHandler - Optional post-step hook.
 * @returns An object containing the updated world, actions, tickCount, optional pipelineRun, and duration in milliseconds.
 */
export async function runPipeline({
  world,
  steps,
  pipelineArgs,
  frameHandler = (world) => world,
}: {
  world: WorldInstance;
  steps: FunctorStep[];
  pipelineArgs?: PipelineArgs;
  frameHandler?: (world: WorldInstance) => WorldInstance;
}): Promise<PipelineResult> {
  const start = performance.now();

  if (!world.context) world.context = {};
  if (!world.artifacts) world.artifacts = new Map();

  world.context._artifactsById = world.artifacts;
  if (!pipelineArgs) {
    pipelineArgs = World.createObject<PipelineArgs>("PipelineArgs", {
      id: "pipeline-args-" + crypto.randomUUID(),
      params: {},
    });
  }
  world.context.pipelineArgs = pipelineArgs;
  world.context.pipelineId = world.pipelineId;
  world.context.runId = world.runId;

  const symbolicActions: SymbolicAction[] = [];
  let pipelineRun: PipelineRun | undefined;

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
    const action = await recordSymbolicAction({
      entry: batched.entry,
      transformationId: batched.transformationId,
      instrumentId: batched.instrumentId,
      purpose: batched.purpose,
      context: world.context,
      stepPrefix: batched.stepPrefix,
      tick: batched.tick,
      outputObject: batched.outputObject,
    });
    symbolicActions.push(action);
  }

  world.context._batchedEntries = [];
  if (pipelineArgs.storePipelineRun !== false) {
    pipelineRun = createPipelineRunObject(
      world.pipelineId,
      world.runId,
      world.tick,
      steps.length,
      world.context.forkedFromRunId
    );

    addToArtifacts(world.context, pipelineRun);
  }

  const duration = performance.now() - start;

  return {
    world,
    actions: symbolicActions,
    tickCount: world.tick,
    pipelineRun,
    duration,
  };
}
