it("records the correct outputId from a returned outputObject", async () => {
  const world = createNewWorldInstance("test-output-id");
  const pipelineArgs = createSymbolicObject<PipelineArgs>("PipelineArgs", {
    params: {},
  });

  const steps: FunctorStep[] = [
    {
      id: "step-choice",
      purpose: "test output object tracking",
      functor: {
        id: "choice-functor",
        name: "ChoiceFunctor",
        method: "choose",
        inputType: "PipelineArgs",
        outputType: "WorldInstance",
        apply: async () => {
          const choice = createSymbolicObject("Choice", {
            id: "choice-1",
            rootId: "agent-123",
            tick: 1,
          });
          world.artifacts.set("choice-1", choice);
          return {
            world,
            outputObject: choice,
            output: [choice],
          };
        },
        describeProvenance: () => ({ reason: "unit-test" }),
      },
      tickAdvance: false,
    },
  ];

  const result = await runGen2WorldSimulation({
    world,
    pipelineArgs,
    steps,
    simulatorConfig: { verbose: false },
  });

  const actions = Array.from(result.artifacts.values()).filter(
    (o) => o.type === "SymbolicAction"
  ) as SymbolicAction[];

  expect(actions.length).toBe(1);

  const action = actions[0];
  expect(action.inputId).toBe("agent-123");
  expect(action.outputId).toBe("choice-1");
  expect(action.actorId).toBe("agent-123");
  expect(action.transformationId).toBe("step-choice");
  expect(action.instrumentId).toBe("choice-functor");
  expect(action.purpose).toBe("test output object tracking");
  expect(action.tick).toBe(0);
});

import type {
  FunctorStep,
  PipelineArgs,
  PipelineRun,
  SymbolicAction,
  SymbolicObject,
  WorldFrame,
  WorldSimulatorConfig,
} from "../types";
import {
  createNewWorldInstance,
  createWorldInstanceFromFrame,
  runGen2WorldSimulation,
} from "./world-simulator";
import { describe, expect, it } from "vitest";

import { createSymbolicObject } from "../lib/object-factory";
import { forkWorld } from "./world-simulator";

it("forks a world and retains aonst pipelineArgs: Prtifacts and context", () => {
  const original = createNewWorldInstance("fire-spread");
  const obj: SymbolicObject = {
    id: "x",
    type: "Thing",
    createdAt: new Date().toISOString(),
    status: "active",
  };
  original.artifacts.set("x", obj);

  const forked = forkWorld(original, { firebreak: true });

  expect(forked.runId).not.toBe(original.runId);
  expect(forked.pipelineId).toBe("fire-spread");
  expect(forked.artifacts.has("x")).toBe(true);
  expect(forked.context.forkedFromRunId).toBe(original.runId);
  expect(forked.context.pipelineArgs.params.firebreak).toBe(true);
});

describe("world-simulator", () => {
  it("creates a new world with correct structure", () => {
    const world = createNewWorldInstance("test-pipeline");
    expect(world.tick).toBe(0);
    expect(world.pipelineId).toBe("test-pipeline");
    expect(world.artifacts).toBeInstanceOf(Map);
  });

  it("creates a world from frame with correct artifacts", () => {
    const mockFrame: WorldFrame = {
      id: "frame-1",
      tick: 3,
      step: 2,
      runId: "abc",
      type: "WorldFrame",
      pipelineId: "mock-pipeline",
      createdAt: new Date().toISOString(),
      status: "active",
      members: [createSymbolicObject("MockObject", { id: "x", label: "X" })],
    };
    const world = createWorldInstanceFromFrame({
      frame: mockFrame,
      pipelineId: mockFrame.pipelineId,
      runId: mockFrame.runId,
    });
    expect(world.tick).toBe(3);
    expect(world.artifacts.get("x")).toBeDefined();
    expect(world.pipelineId).toBe("mock-pipeline");
  });

  it("runs a pipeline and stores output in artifacts", async () => {
    const world = createNewWorldInstance("test");
    const pipelineArgs = createSymbolicObject<PipelineArgs>("PipelineArgs", {
      params: {},
    });

    const steps: FunctorStep[] = [
      {
        id: "step-1",
        purpose: "test-step",
        functor: {
          id: "mock-functor",
          name: "MockFunctor",
          method: "mock",
          inputType: "PipelineArgs",
          outputType: "MockResult",
          apply: async () => ({
            id: "obj-1",
            type: "MockResult",
            createdAt: new Date().toISOString(),
          }),
          describeProvenance: () => ({ source: "test" }),
        },
      },
    ];

    const result = await runGen2WorldSimulation({
      world,
      pipelineArgs,
      steps,
      simulatorConfig: { verbose: false } as WorldSimulatorConfig,
    });

    expect(result.tick).toBeGreaterThan(0);
    expect(result.artifacts.has("obj-1")).toBe(true);
  });
});

it("stores step output in context under expected key", async () => {
  const world = createNewWorldInstance("test");

  const pipelineArgs = createSymbolicObject<PipelineArgs>("PipelineArgs", {
    params: {},
  });

  const steps: FunctorStep[] = [
    {
      id: "step-1",
      purpose: "store-context-test",
      functor: {
        id: "mock-store",
        name: "MockStoreFunctor",
        method: "mock-store",
        inputType: "PipelineArgs",
        outputType: "MockResult",
        apply: async () => ({
          id: "mock-result",
          type: "MockResult",
          createdAt: new Date().toISOString(),
        }),
        describeProvenance: () => ({ source: "test" }),
      },
      storeOutputAs: "Frame_t0",
      tickAdvance: false,
    },
  ];

  const result = await runGen2WorldSimulation({
    world,
    pipelineArgs,
    steps,
    simulatorConfig: { verbose: false },
  });
  expect(result.context.Frame_t0).toBeDefined();
  expect(result.context.Frame_t0).toMatchObject({ id: "mock-result" });
});

it("initializes tick, step, and artifacts correctly from frame", () => {
  const mockFrame: WorldFrame = {
    id: "frame-x",
    tick: 7,
    step: 3,
    runId: "run-x",
    pipelineId: "pipeline-x",
    type: "WorldFrame",
    status: "active",
    createdAt: new Date().toISOString(),
    members: [
      createSymbolicObject("TestObject", { id: "alpha" }),
      createSymbolicObject("TestObject", { id: "beta" }),
    ],
  };

  const world = createWorldInstanceFromFrame({
    frame: mockFrame,
    pipelineId: mockFrame.pipelineId,
    runId: mockFrame.runId,
  });

  expect(world.tick).toBe(7);
  expect(world.step).toBe(3);
  expect(world.artifacts.size).toBe(2);
  expect(world.artifacts.get("alpha")?.type).toBe("TestObject");
  expect(world.pipelineId).toBe("pipeline-x");
});

it("forks a world from a frame and retains pipelineId and forkedFromRunId", () => {
  const mockFrame: WorldFrame = {
    id: "frame-a",
    tick: 5,
    step: 4,
    runId: "original-run",
    pipelineId: "mock-pipeline",
    type: "WorldFrame",
    status: "active",
    createdAt: new Date().toISOString(),
    members: [
      createSymbolicObject("Thing", { id: "a" }),
      createSymbolicObject("Thing", { id: "b" }),
    ],
  };

  const baseWorld = createWorldInstanceFromFrame({
    frame: mockFrame,
    pipelineId: mockFrame.pipelineId,
    runId: mockFrame.runId,
  });

  const forked = forkWorld(baseWorld, { firebreak: true });

  expect(forked.pipelineId).toBe("mock-pipeline");
  expect(forked.context.forkedFromRunId).toBe("original-run");
  expect(forked.artifacts.has("a")).toBe(true);
  expect(forked.artifacts.has("b")).toBe(true);
});

it("runs a different pipeline after forking and generates a distinct PipelineRun", async () => {
  const baseFrame: WorldFrame = {
    id: "base-frame",
    tick: 2,
    step: 2,
    runId: "base-run",
    pipelineId: "starter-pipeline",
    type: "WorldFrame",
    status: "active",
    createdAt: new Date().toISOString(),
    members: [createSymbolicObject("BaseObject", { id: "x" })],
  };
  const baseWorld = createWorldInstanceFromFrame({
    frame: baseFrame,
    pipelineId: baseFrame.pipelineId,
    runId: baseFrame.runId,
  });

  const forked = forkWorld(baseWorld, { alt: true });

  const pipelineArgs = createSymbolicObject<PipelineArgs>("PipelineArgs", {
    params: {
      alt: true,
    },
  });

  const steps: FunctorStep[] = [
    {
      id: "alt-step",
      purpose: "altered path",
      functor: {
        id: "alt-fn",
        name: "AltFunctor",
        method: "alt-method",
        inputType: "PipelineArgs",
        outputType: "AlteredResult",
        apply: async () => ({
          id: "alt-result",
          type: "AlteredResult",
          createdAt: new Date().toISOString(),
        }),
        describeProvenance: () => ({ source: "fork-test" }),
      },
      storeOutputAs: "AlteredOutput",
    },
  ];

  const result = await runGen2WorldSimulation({
    world: forked,
    pipelineArgs,
    steps,
    simulatorConfig: { verbose: false },
  });

  const pipelineRuns = Array.from(result.artifacts.values()).filter(
    (o) => o.type === "PipelineRun"
  );

  expect(pipelineRuns.length).toBe(1);
  expect((pipelineRuns[0] as PipelineRun).pipelineId).toBe("starter-pipeline");
  expect(pipelineRuns[0].label).toMatch(/Forked Run/);
});

it("creates multiple forks from a base world and runs separate pipelines", async () => {
  const baseFrame: WorldFrame = {
    id: "frame-base",
    tick: 1,
    step: 1,
    runId: "original-run",
    pipelineId: "base-pipeline",
    type: "WorldFrame",
    status: "active",
    createdAt: new Date().toISOString(),
    members: [
      createSymbolicObject("Symbol", { id: "a" }),
      createSymbolicObject("Symbol", { id: "b" }),
    ],
  };

  const baseWorld = createWorldInstanceFromFrame({
    frame: baseFrame,
    pipelineId: baseFrame.pipelineId,
    runId: baseFrame.runId,
  });

  const results = await Promise.all(
    ["fork-A", "fork-B", "fork-C"].map(async (label, index) => {
      const forked = forkWorld(baseWorld, { branch: label });

      const pipelineArgs = createSymbolicObject<PipelineArgs>("PipelineArgs", {
        params: { branch: label },
      });

      const steps: FunctorStep[] = [
        {
          id: `step-${label}`,
          purpose: `test fork ${label}`,
          functor: {
            id: `functor-${label}`,
            name: `Functor ${label}`,
            method: `method-${label}`,
            inputType: "PipelineArgs",
            outputType: "BranchResult",
            apply: async () => ({
              id: `result-${label}`,
              type: "BranchResult",
              createdAt: new Date().toISOString(),
            }),
            describeProvenance: () => ({ source: `fork-${label}` }),
          },
          storeOutputAs: `BranchOutput_${label}`,
        },
      ];

      const result = await runGen2WorldSimulation({
        world: forked,
        pipelineArgs,
        steps,
        simulatorConfig: { verbose: false },
      });

      return result;
    })
  );

  expect(results.length).toBe(3);
  results.forEach((world, i) => {
    const branchResult = world.artifacts.get(
      `result-fork-${String.fromCharCode(65 + i)}`
    );
    expect(branchResult).toBeDefined();
    expect(world.pipelineId).toBe("base-pipeline");
    expect(world.context.forkedFromRunId).toBe("original-run");
  });
});
