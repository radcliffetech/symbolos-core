import { BaseSymbolicObject } from "./base";

export type ConwayCell = BaseSymbolicObject & {
  type: 'ConwayCell';
  position: [number, number]; // x, y grid coordinates
  tick: number; // generation number
  status: 'alive' | 'dead';
  generatedFrom?: {
    priorId: string; // cell at previous tick
    transformationId?: string;
  };
};
