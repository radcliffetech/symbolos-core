import { BaseSymbolicObject } from "./base";
import { FunctorStep } from "./transformation";
import { PipelineArgs } from "./orchestration";

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
  getSteps: (args: PipelineArgs) => FunctorStep[];
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

/**
 * Represents a symbolic world snapshot frame, suitable for archival.
 */
export type WorldFrame = BaseSymbolicObject & {
  type: "WorldFrame";
  tick: number;
  step: number;
  pipelineId: string;
  runId: string;
  memberIds?: string[];
  members: BaseSymbolicObject[];
  metadata?: Record<string, any>;
};
