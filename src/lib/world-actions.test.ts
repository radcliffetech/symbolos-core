import {
  addToWorld,
  createObject,
  forkWorld,
  removeFromWorld,
} from "./world-actions";
import { beforeEach, describe, expect, it } from "vitest";

import type { WorldInstance } from "../types";

describe("world-actions", () => {
  let world: WorldInstance;

  beforeEach(() => {
    world = {
      id: "test-world",
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
    const obj = createObject("Note", { id: "n1", label: "hello" });
    addToWorld(world, obj);
    expect(world.artifacts.get("n1")).toEqual(obj);
  });

  it("adds multiple symbolic objects to world.artifacts", () => {
    const a = createObject("Note", { id: "a", label: "a" });
    const b = createObject("Note", { id: "b", label: "b" });
    addToWorld(world, [a, b]);
    expect(world.artifacts.size).toBe(2);
    expect(world.artifacts.get("a")).toEqual(a);
    expect(world.artifacts.get("b")).toEqual(b);
  });

  it("removes a symbolic object by id", () => {
    const obj = createObject("Note", { id: "n1", label: "hello" });
    addToWorld(world, obj);
    removeFromWorld(world, "n1");
    expect(world.artifacts.has("n1")).toBe(false);
  });

  it("removes multiple symbolic objects by object reference", () => {
    const a = createObject("Note", { id: "a", label: "a" });
    const b = createObject("Note", { id: "b", label: "b" });
    addToWorld(world, [a, b]);
    removeFromWorld(world, [a, b]);
    expect(world.artifacts.size).toBe(0);
  });

  it("creates a forked world with the same artifacts but new ID and runId", () => {
    const obj = createObject("Note", { id: "n1", label: "hello" });
    addToWorld(world, obj);

    const forked = forkWorld(world);

    expect(forked.id).not.toBe(world.id);
    expect(forked.runId).not.toBe(world.runId);
    expect(forked.tick).toBe(world.tick);
    expect(forked.artifacts.get("n1")).toEqual(obj);
    expect(forked.context.forkedFromRunId).toBe(world.runId);
  });
});

describe("createObject", () => {
  it("generates id, createdAt, and updatedAt if not provided", () => {
    const result = createObject("TestType", { label: "Generated" });

    expect(result.id).toMatch(/^test-type-/); // updated to match slugified ID
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.type).toBe("TestType");
    expect(result.label).toBe("Generated");
  });

  it("respects provided id and createdAt", () => {
    const result = createObject("TestType", {
      id: "custom-id",
      label: "With values",
    });

    expect(result.id).toBe("custom-id");
    expect(result.createdAt).toBeDefined();
    expect(result.label).toBe("With values");
  });
});
