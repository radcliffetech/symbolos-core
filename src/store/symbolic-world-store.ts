import type {
  SymbolicObject,
  SymbolicWorldStore,
  WorldInstance,
} from "../types";

export const getSymbolicWorldStore = (
  world: WorldInstance
): SymbolicWorldStore => {
  const artifacts = Array.from(world.artifacts.values());

  return {
    getByType<T>(type: string): T[] {
      return artifacts.filter((o) => o.type === type) as T[];
    },
    getById<T>(id: string): T | undefined {
      return world.artifacts.get(id) as T | undefined;
    },
    getByIds<T>(ids: string[]): T[] {
      return ids
        .map((id) => world.artifacts.get(id) as T | undefined)
        .filter((o): o is T => o !== undefined);
    },
    getLatestOfType<T>(type: string): T | undefined {
      return artifacts
        .filter((o) => o.type === type)
        .sort((a, b) => (b.tick ?? 0) - (a.tick ?? 0))[0] as T | undefined;
    },
    getAll(): SymbolicObject[] {
      return artifacts;
    },
    getWorld(): WorldInstance {
      return {...world};
    }
  };
};
