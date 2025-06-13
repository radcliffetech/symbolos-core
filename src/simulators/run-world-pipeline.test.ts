import type { FunctorStep, PipelineArgs } from "../types";
import { describe, expect, it } from "vitest";

import { World } from "../lib/world-context";
import { runPipeline } from "./run-world-pipeline";

describe("runPipeline", () => {
  it("logs symbolic actions with correct actorId, inputId, and outputId", async () => {
    const world = World.createWorld("gen3-test");
    const agent = World.createObject("Agent", {
      id: "agent-1",
    });
    world.artifacts.set(agent.id, agent);

    const pipelineArgs: PipelineArgs = World.createObject("PipelineArgs", {
      id: "args-1",
      params: {},
    });

    const steps: FunctorStep[] = [
      {
        id: "step-1",
        functor: {
          id: "functor-choice",
          method: "decide",
          name: "ChoiceFunctor",
          async apply({ world }) {
            const choice = World.createObject("Choice", {
              id: "choice-1",
              tick: world.tick,
              rootId: "agent-1",
            });
            world.artifacts.set(choice.id, choice);
            return {
              world,
              output: [choice],
              outputObject: choice,
            };
          },
        },
        purpose: "symbolic-decision",
        tickAdvance: true,
      },
    ];

    const result = await runPipeline({
      world,
      steps,
      pipelineArgs,
    });

    const actions = result.actions;

    expect(actions.length).toBe(1);
    const action = actions[0];
    expect(action.actorId).toBe("agent-1");
    expect(action.inputId).toBe("agent-1");
    expect(action.outputId).toBe("choice-1");
    expect(action.transformationId).toBe("step-1");
    expect(action.instrumentId).toBe("functor-choice");
    expect(action.purpose).toBe("symbolic-decision");
  });
});
