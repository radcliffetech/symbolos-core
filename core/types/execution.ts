import { BaseSymbolicObject } from './base';
import { FunctorStep } from './transformation';
import { PipelineArgs } from './orchestration';

/** Describes a pipeline's structure and parameters */
export interface PipelineDefinition {
  id: string;
  label: string;
  description: string;
  args: {
    required: string[];
    optional?: string[];
    defaults?: Record<string, any>;
  };
  steps: (args: PipelineArgs) => FunctorStep[];
}

/**
 * Represents the live, tick-by-tick state of a symbolic world.
 * Not stored as a symbolic object — used during execution only.
 */
export type WorldInstance = {
  tick: number;
  step: number;
  runId: string;
  pipelineId: string;
  artifacts: Map<string, BaseSymbolicObject>;
  context: Record<string, any>;
};
