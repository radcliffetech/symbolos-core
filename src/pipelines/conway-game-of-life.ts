import {
  InitializeConwayCells,
  StepConwayCells,
} from "../functors/conway-game-of-life";
import type { PipelineArgs, PipelineDefinition } from "../types";

import { LinkSymbols } from "../functors/common";

export const conwayGame: PipelineDefinition = {
  id: "conway-game-of-life",
  label: "Conway's Game of Life",
  description:
    "Run Conway's Game of Life simulation over a fixed number of iterations.",
  args: {
    required: ["steps"],
    optional: ["seedPattern", "width", "height"],
    defaults: {
      steps: 20,
      seedPattern: "glider",
      width: 9,
      height: 9,
    },
  },
  getSteps: (args: PipelineArgs) => [
    {
      id: "initialize-conway",
      functor: InitializeConwayCells,
      purpose: "initialize-conway-cells",
      resolveInput: async () => ({
        width: args.params.width || 9,
        height: args.params.height || 9,
        seedPattern: args.params.seedPattern || "glider",
      }),
      storeOutputAs: "Conway_t0",
      tickAdvance: false,
    },
    ...Array(args.params.steps)
      .fill(null)
      .flatMap((_, i) => [
        {
          id: `step-conway-${i + 1}`,
          functor: StepConwayCells,
          purpose: "step-conway-cells",
          resolveInput: async (_: any, ctx: any) => ({
            step: i + 1,
            constellation: ctx[`Conway_t${i}`][0],
          }),
          storeOutputAs: `Conway_t${i + 1}`,
          tickAdvance: true,
        },
        {
          id: "link-conway-frames",
          functor: LinkSymbols,
          purpose: "link-conway-frames",
          resolveInput: async (_: any, ctx: any) => ({
            from: ctx[`Conway_t${i}`][0],
            to: ctx[`Conway_t${i + 1}`][0],
            relationship: "next",
            label: "Next Generation",
          }),
          storeOutputAs: `ConwayLink_t${i + 1}`,
          tickAdvance: false,
        },
      ]),
  ],
};
