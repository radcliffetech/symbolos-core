import type { SymbolicObject, WorldFrame, WorldInstance } from "../types";
import {
  createObject,
  createWorld,
  forkWorld,
  toWorldFrame,
} from "./world-actions";

/**
 * Symbolic interface for manipulating and querying a WorldInstance.
 * Provides utility methods for adding, retrieving, and managing symbolic objects,
 * as well as forking, ticking, and converting world state representations.
 */
export class World {
  /**
   * Creates a new World interface for the given WorldInstance.
   * @param instance The underlying WorldInstance to manipulate.
   */
  constructor(private instance: WorldInstance) {}

  /** Reference to the object creation utility. */
  static createObject = createObject;
  /** Converts a WorldInstance to a WorldFrame. */
  static toWorldFrame = toWorldFrame;
  /** Reference to the world creation utility. */
  static createWorld = createWorld;

  /**
   * Adds one or more symbolic objects to the world.
   * Invalid or malformed objects are skipped.
   * @param objects A single SymbolicObject or an array of SymbolicObjects to add.
   * @returns This World instance, for chaining.
   */
  add(objects: SymbolicObject | SymbolicObject[]): this {
    const list = Array.isArray(objects) ? objects : [objects];
    for (const obj of list) {
      if (!obj || typeof obj !== "object" || !obj.id || !obj.type) {
        console.warn("[World.add] Skipping invalid object:", obj);
        continue;
      }
      if (!obj.createdAt) obj.createdAt = new Date().toISOString();
      this.instance.artifacts.set(obj.id, obj);
    }
    return this;
  }

  /**
   * Retrieves a symbolic object by its unique ID.
   * @param id The ID of the object to retrieve.
   * @returns The object with the given ID, or undefined if not found.
   */
  getById<T extends SymbolicObject>(id: string): T | undefined {
    return this.instance.artifacts.get(id) as T | undefined;
  }

  /**
   * Returns all symbolic objects in the world.
   * @returns An array of all SymbolicObjects.
   */
  getAll(): SymbolicObject[] {
    return Array.from(this.instance.artifacts.values());
  }

  /**
   * Returns all objects of the specified type.
   * @param type The symbolic type to filter by.
   * @returns An array of objects matching the type.
   */
  getByType<T extends SymbolicObject>(type: string): T[] {
    return Array.from(this.instance.artifacts.values()).filter(
      (o) => o.type === type
    ) as T[];
  }

  /**
   * Forks the current world, producing a new World instance with copied state.
   * @returns A new World instance representing the forked world.
   */
  fork(): World {
    const forked = forkWorld(this.instance);
    return new World(forked);
  }

  /**
   * Advances the world's tick counter by one.
   * @returns This World instance, for chaining.
   */
  tickForward(): this {
    this.instance.tick += 1;
    return this;
  }

  /**
   * Converts the current world state to a WorldFrame.
   * @returns A WorldFrame representing the current state.
   */
  toFrame(): WorldFrame {
    return toWorldFrame(this.instance);
  }

  /**
   * Returns the underlying WorldInstance for this World.
   * @returns The backing WorldInstance object.
   */
  toInstance(): WorldInstance {
    return this.instance;
  }

  /**
   * Returns the most recently created object of the given type, based on tick.
   * @param type The symbolic type to filter by.
   * @returns The latest object of the specified type, or undefined.
   */
  getLatestOfType<T extends SymbolicObject>(type: string): T | undefined {
    return Array.from(this.instance.artifacts.values())
      .filter((o) => o.type === type)
      .sort((a, b) => (b.tick ?? 0) - (a.tick ?? 0))[0] as T | undefined;
  }
}
