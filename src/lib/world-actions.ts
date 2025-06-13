import {
  type SymbolicObject,
  type WorldFrame,
  type WorldInstance,
} from "../types";

import chalk from "chalk";

/**
 * Converts a WorldInstance into a WorldFrame representation.
 * @param world - The WorldInstance to convert.
 * @returns A WorldFrame object representing the world state.
 */
export function toWorldFrame(world: WorldInstance): WorldFrame {
  return createObject("WorldFrame", {
    description: `World frame for tick ${world.tick}`,
    id: `frame-${world.tick}`,
    tick: world.tick,
    step: world.step,
    runId: world.runId,
    pipelineId: world.pipelineId,
    members: Array.from(world.artifacts.values()),
    metadata: {
      artifactCount: world.artifacts.size,
    },
  });
}

/**
 * Converts a WorldFrame back into a WorldInstance.
 * @param frame - The WorldFrame to convert.
 * @returns A WorldInstance reconstructed from the frame.
 */
export function toWorldInstance(frame: WorldFrame): WorldInstance {
  return {
    id: frame.id || `world-${frame.tick}`,
    tick: frame.tick,
    step: frame.step,
    runId: frame.runId,
    pipelineId: frame.pipelineId,
    artifacts: new Map(
      frame.members.map((m) => [m.id, m] as [string, SymbolicObject])
    ),
    context: new Map(),
  };
}

/**
 * Adds one or more SymbolicObjects to the world's artifacts.
 * @param world - The WorldInstance to add objects to.
 * @param obj - A single SymbolicObject or an array of SymbolicObjects to add.
 */
export function addToWorld(
  world: WorldInstance,
  obj: SymbolicObject | SymbolicObject[]
) {
  const list = Array.isArray(obj) ? obj : [obj];
  for (const o of list) {
    if (!o.createdAt) o.createdAt = new Date().toISOString();
    world.artifacts.set(o.id, o);
  }
}

/**
 * Removes one or more objects from the world's artifacts by ID or object reference.
 * @param world - The WorldInstance to remove objects from.
 * @param id - A string ID, an array of IDs, a SymbolicObject, or an array of SymbolicObjects to remove.
 */
export function removeFromWorld(
  world: WorldInstance,
  id: string | string[] | SymbolicObject | SymbolicObject[]
) {
  const ids = Array.isArray(id)
    ? id.map((i) => (typeof i === "string" ? i : i.id))
    : [typeof id === "string" ? id : id.id];

  for (const objId of ids) {
    if (world.artifacts.has(objId)) {
      world.artifacts.delete(objId);
    } else {
      console.warn(
        chalk.yellow(
          `[symbolos] Warning: Object with ID ${objId} not found in world.`
        )
      );
    }
  }
}

/**
 * Creates a forked copy of a WorldInstance with optional new parameters.
 * @param sourceWorld - The original WorldInstance to fork.
 * @param newParams - Optional parameters to include in the forked world's context.
 * @returns A new WorldInstance forked from the source.
 */
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

/**
 * Creates a new WorldInstance with optional IDs.
 * @param worldId - Optional ID for the world.
 * @param runId - Optional run ID for the world.
 * @returns A new WorldInstance object.
 */
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

/**
 * Creates a new SymbolicObject of a specified type with given data.
 * @param type - The type of the object to create.
 * @param data - Partial data to initialize the object with, excluding type and timestamps.
 * @returns A new SymbolicObject of the specified type.
 */
export function createObject<T extends SymbolicObject = SymbolicObject>(
  type: T["type"],
  data: Omit<Partial<T>, "type" | "createdAt" | "updatedAt">
): T {
  const id =
    data.id ??
    `${type
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .toLowerCase()}-${crypto.randomUUID()}`;
  return {
    ...data,
    id,
    type,
    rootId: data.rootId ?? id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as T;
}
