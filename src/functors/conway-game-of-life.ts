import type { Constellation, ConwayCell, Functor } from "../types";

import { createSymbolicObject } from "../lib/object-factory";

interface TransformationInput {
  width: number;
  height: number;
  seedPattern: "glider" | "blinker" | "beacon" | "toad";
}

export const InitializeConwayCells: Functor<
  TransformationInput,
  Constellation<ConwayCell>
> = {
  id: "functor-init-conway-cells",
  inputType: "Conway",
  outputType: "Constellation<ConwayCell>",
  method: "llm-gpt-4o",
  name: "InitializeConwayCells",
  description: "Generates a SymbolicMorphogen from a prompt using GPT-4.5",
  params: [],
  group: "SeedGenerators",
  async apply(input) {
    const { seedPattern } = input;

    const now = new Date().toISOString();
    const id = "constellation-conway-t0";
    const constellation: Constellation<ConwayCell> = {
      id,
      type: "Constellation",

      createdAt: now,
      updatedAt: now,
      source: "openai",
      status: "candidate",
      rootId: id,
      revisionNumber: 1,
      generatedFrom: {
        timestamp: now,
      },
      objects: [] as ConwayCell[],
    };

    const { width, height } = input;

    const patterns: Record<string, [number, number][]> = {
      glider: [
        [1, 0],
        [2, 1],
        [0, 2],
        [1, 2],
        [2, 2],
      ],
      blinker: [
        [1, 0],
        [1, 1],
        [1, 2],
      ],
      beacon: [
        [0, 0],
        [1, 0],
        [0, 1],
        [2, 2],
        [3, 2],
        [3, 3],
      ],
      toad: [
        [1, 1],
        [2, 1],
        [3, 1],
        [0, 2],
        [1, 2],
        [2, 2],
      ],
    };

    const seed = patterns[seedPattern] || patterns["glider"];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alive = seed.some(([gx, gy]) => gx === x && gy === y);
        constellation.objects.push(
          createSymbolicObject<ConwayCell>("ConwayCell", {
            position: [x, y],
            tick: 0,
            status: alive ? "alive" : "dead",
            rootId: id,
            id: `cell-${x}-${y}-t0`,
          })
        );
      }
    }

    return constellation;
  },
  describeProvenance(input, output) {
    return {
      seedPattern: input.seedPattern,
      width: input.width,
      height: input.height,
      timestamp: output.createdAt ?? new Date().toISOString(),
    };
  },
};

interface TransformationInputStepConway {
  constellation: Constellation<ConwayCell>;
  step: number;
}

export const StepConwayCells: Functor<
  TransformationInputStepConway,
  Constellation<ConwayCell>
> = {
  id: "functor-step-conway-cells",
  inputType: "Constellation<ConwayCell>",
  outputType: "Constellation<ConwayCell>",
  method: "step-conway",
  name: "StepConway",
  description: "Applies Conway update rules to ConwayCell constellation",
  params: [],
  group: "Simulation",

  async apply({ constellation, step }) {
    const now = new Date().toISOString();
    const next: Constellation<ConwayCell> = {
      id: `constellation-conway-t${step}`,
      type: "Constellation",
      createdAt: now,
      updatedAt: now,
      source: "symbolos",
      status: "candidate",
      rootId: constellation.rootId,
      revisionNumber: step,
      generatedFrom: {
        timestamp: now,
      },
      objects: [],
    };

    const grid = new Map<string, ConwayCell>();
    constellation.objects.forEach((cell) => {
      const key = `${cell.position[0]},${cell.position[1]}`;
      grid.set(key, cell);
    });

    const directions = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ];

    const [minX, maxX, minY, maxY] = constellation.objects.reduce(
      ([minX, maxX, minY, maxY], cell) => {
        const [x, y] = cell.position;
        return [
          Math.min(minX, x),
          Math.max(maxX, x),
          Math.min(minY, y),
          Math.max(maxY, y),
        ];
      },
      [Infinity, -Infinity, Infinity, -Infinity]
    );

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        let aliveNeighbors = 0;
        for (const [dx, dy] of directions) {
          const nx = x + dx;
          const ny = y + dy;
          const neighbor = grid.get(`${nx},${ny}`);
          if (neighbor && neighbor.status === "alive") {
            aliveNeighbors++;
          }
        }

        const prev = grid.get(`${x},${y}`);
        const wasAlive = prev?.status === "alive";
        const shouldLive =
          (wasAlive && (aliveNeighbors === 2 || aliveNeighbors === 3)) ||
          (!wasAlive && aliveNeighbors === 3);

        next.objects.push(
          createSymbolicObject<ConwayCell>("ConwayCell", {
            position: [x, y],
            tick: step,
            status: shouldLive ? "alive" : "dead",
            rootId: constellation.rootId,
            generatedFrom: {
              priorId: prev?.id ?? "",
            },
            id: `cell-${x}-${y}-t${step}`,
          })
        );
      }
    }

    return next;
  },

  describeProvenance(input, output) {
    return {
      tick: input.step,
      from: input.constellation.id,
      timestamp: output.createdAt ?? new Date().toISOString(),
    };
  },
};
