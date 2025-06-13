import type { PipelineRun, SymbolicAction, SymbolicObject } from "../types";

import { World } from "../lib/world-context";

/**
 * Creates a PipelineRun object with the given pipeline identifiers and run metadata.
 * @param pipelineId - The ID of the pipeline.
 * @param runId - The unique identifier for this run.
 * @param tick - The tick count for this run.
 * @param stepCount - The number of steps executed in this run.
 * @param forkedFromRunId - (Optional) The runId from which this run was forked.
 * @returns A new PipelineRun object.
 */
export function createPipelineRunObject(
  pipelineId: string,
  runId: string,
  tick: number,
  stepCount: number,
  forkedFromRunId?: string
) {
  return World.createObject<PipelineRun>("PipelineRun", {
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

/**
 * Records a SymbolicAction in the provided context's artifact store.
 * Creates a SymbolicAction object based on the given parameters and adds it to the context.
 * @param params - An object containing entry, transformationId, context, instrumentId, purpose, tick, and optionally outputObject.
 * @returns A Promise that resolves to the created SymbolicAction object.
 */
export const recordSymbolicAction = async ({
  entry,
  transformationId,
  context,
  instrumentId,
  purpose,
  tick,
  outputObject,
}: RecordSymbolicActionParams): Promise<SymbolicAction> => {
  const action = World.createObject<SymbolicAction>("SymbolicAction", {
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
  return action;
};

/**
 * Adds an object to the context's artifact map using the object's id as the key.
 * @param context - The context object containing an _artifactsById Map.
 * @param obj - The object to add; must have an 'id' property.
 */
export function addToArtifacts(context: Record<string, any>, obj: any) {
  if (!obj?.id) return;
  context._artifactsById.set(obj.id, obj);
}

/**
 * Recursively flattens a nested structure of symbolic objects into a flat array.
 * Only objects with both 'id' and 'type' properties are included.
 * @param obj - The root object or collection to flatten.
 * @returns An array of SymbolicObject instances found in the structure.
 */
export function flattenSymbolicObjects(obj: any): SymbolicObject[] {
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
