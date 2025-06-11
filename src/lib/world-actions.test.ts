import { addToWorld, removeFromWorld } from "./world-actions";
import { beforeEach, describe, expect, it } from "vitest";

import type { WorldInstance } from "../types";
import { createSymbolicObject } from "./object-factory";

describe("world-actions", () => {
  let world: WorldInstance;

  beforeEach(() => {
    world = {
      tick: 0,
      step: 0,
      pipelineId: "test",
      runId: "test-run",
      artifacts: new Map(),
      context: {},
      metadata: {},
    };
  });

  it("adds a single symbolic object to world.artifacts", () => {
    const obj = createSymbolicObject("Note", { id: "n1", label: "hello" });
    addToWorld(world, obj);
    expect(world.artifacts.get("n1")).toEqual(obj);
  });

  it("adds multiple symbolic objects to world.artifacts", () => {
    const a = createSymbolicObject("Note", { id: "a", label: "a" });
    const b = createSymbolicObject("Note", { id: "b", label: "b" });
    addToWorld(world, [a, b]);
    expect(world.artifacts.size).toBe(2);
    expect(world.artifacts.get("a")).toEqual(a);
    expect(world.artifacts.get("b")).toEqual(b);
  });

  it("removes a symbolic object by id", () => {
    const obj = createSymbolicObject("Note", { id: "n1", label: "hello" });
    addToWorld(world, obj);
    removeFromWorld(world, "n1");
    expect(world.artifacts.has("n1")).toBe(false);
  });

  it("removes multiple symbolic objects by object reference", () => {
    const a = createSymbolicObject("Note", { id: "a", label: "a" });
    const b = createSymbolicObject("Note", { id: "b", label: "b" });
    addToWorld(world, [a, b]);
    removeFromWorld(world, [a, b]);
    expect(world.artifacts.size).toBe(0);
  });

  
});
