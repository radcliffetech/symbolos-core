import type { PipelineArgs, SymbolicAction, WorldFunctorStep } from "../types";
import { createNewWorldInstance, runWorldPipeline } from "./world-pipeline";
import { describe, expect, it } from "vitest";

import { createSymbolicObject } from "../lib/object-factory";

describe("runWorldPipeline", () => {
  it("logs symbolic actions with correct actorId, inputId, and outputId", async () => {
    const world = createNewWorldInstance("gen3-test");
    const agent = createSymbolicObject("Agent", {
      id: "agent-1",
    });
    world.artifacts.set(agent.id, agent);

    const pipelineArgs: PipelineArgs = createSymbolicObject("PipelineArgs", {
      id: "args-1",
      params: {},
    });

    const steps: WorldFunctorStep[] = [
      {
        id: "step-1",
        functor: {
          id: "functor-choice",
          method: "decide",
          name: "ChoiceFunctor",
          inputType: "WorldInstance",
          outputType: "WorldInstance",
          async apply({ world }) {
            const choice = createSymbolicObject("Choice", {
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

    const result = await runWorldPipeline({
      world,
      steps,
      pipelineArgs,
      simulatorConfig: { verbose: false },
    });

    const actions = Array.from(result.artifacts.values()).filter(
      (o): o is SymbolicAction => o.type === "SymbolicAction"
    );

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
