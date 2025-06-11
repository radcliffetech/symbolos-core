import {
  type SymbolicObject,
  type WorldFrame,
  type WorldInstance,
} from "../types";
import { createSymbolicObject } from "./object-factory";
import chalk from "chalk";

/**
 *
 * Converts a WorldInstance to a WorldFrame symbolic object.
 * This is useful for archiving or storing the world state.
 */
export function toWorldFrame(world: WorldInstance): WorldFrame {
  return createSymbolicObject("WorldFrame", {
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
 * Removes an object or objects from the world by their ID(s).
 * If the object is not found, a warning is logged.
 *
 * @param world - The WorldInstance from which to remove the object(s).
 * @param id - The ID(s) of the object(s) to remove. Can be a single ID, an array of IDs,
 *             or SymbolicObject(s) whose IDs will be extracted.
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


export function hasType(world: WorldInstance, type: string): boolean {
  return Array.from(world.artifacts.values()).some((o) => o.type === type);
}
export function getFromWorldByType<T extends SymbolicObject>(
  world: WorldInstance,
  type: string
): T[] {
  return Array.from(world.artifacts.values()).filter(
    (o)=> o.type === type
  ) as T[];
}

export function getFromWorldById<T extends SymbolicObject>(
  world: WorldInstance,
  id: string
): T | undefined {
  return world.artifacts.get(id) as T | undefined;
}
export function getFromWorldByIds<T extends SymbolicObject>(
  world: WorldInstance,
  ids: string[]
): T[] {
  return ids
    .map((id) => world.artifacts.get(id) as T | undefined)
    .filter((o): o is T => o !== undefined);
}

