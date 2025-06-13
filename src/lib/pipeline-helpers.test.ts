import type { PipelineRun, SymbolicObject } from "../types";
import {
  addToArtifacts,
  createPipelineRunObject,
  flattenSymbolicObjects,
  recordSymbolicAction,
} from "./pipeline-helpers";
import { describe, expect, it } from "vitest";

import { World } from "./world-context";

describe("pipeline-helpers", () => {
  it("creates a PipelineRun object", () => {
    const run = createPipelineRunObject("test-pipeline", "run-001", 5, 3);
    expect(run).toMatchObject({
      type: "PipelineRun",
      pipelineId: "test-pipeline",
      runId: "run-001",
      tickCount: 5,
      stepCount: 3,
      status: "completed",
    });
    expect(run.id).toMatch(/^pipeline-run-/);
  });

  it("flattens nested symbolic objects", () => {
    const nested = {
      a: {
        id: "a",
        type: "Note",
        inner: {
          id: "b",
          type: "Note",
        },
      },
      array: [
        {
          id: "c",
          type: "Note",
        },
      ],
    };

    const result = flattenSymbolicObjects(nested);
    const ids = result.map((o) => o.id).sort();
    expect(ids).toEqual(["a", "b", "c"]);
  });

  it("creates a SymbolicAction and adds to artifacts", async () => {
    const context: any = {
      _artifactsById: new Map(),
      subjectiveFrame: { id: "agent-1" },
      contextualFrame: { id: "frame-1" },
    };
    const entry: SymbolicObject = World.createObject("Note", {
      id: "note-1",
      rootId: "root-1",
    });

    const action = await recordSymbolicAction({
      entry,
      transformationId: "step-123",
      context,
      instrumentId: "functor-abc",
      purpose: "test",
      tick: 3,
    });

    expect(action.type).toBe("SymbolicAction");
    expect(action.transformationId).toBe("step-123");
    expect(action.actorId).toBe("agent-1");
    expect(context._artifactsById.get(action.id)).toEqual(action);
  });

  it("adds an object to context artifacts", () => {
    const context: any = { _artifactsById: new Map() };
    const obj = { id: "x1", type: "Test" };
    addToArtifacts(context, obj);
    expect(context._artifactsById.get("x1")).toBe(obj);
  });
});
