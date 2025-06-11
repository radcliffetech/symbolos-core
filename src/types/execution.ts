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
  version?: number;
}

export interface WorldPipelineDefinition {
  id: string;
  label: string;
  description: string;
  args: {
    required: string[];
    optional?: string[];
    defaults?: Record<string, any>;
  };
  getSteps: (args: PipelineArgs) => WorldFunctorStep[];
  version: 3;
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
  metadata?: Record<string, any>;
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

export interface WorldFunctor {
  id: string;
  name: string;
  description?: string;
  method: string;
  group?: string;
  inputType: "WorldInstance";
  outputType: "WorldInstance";
  apply: (input: { world: WorldInstance }) => Promise<{
    world: WorldInstance;
    outputObject?: BaseSymbolicObject;
    output?: BaseSymbolicObject[];
  }>;
  describeProvenance?: (
    input: { world: WorldInstance },
    output: WorldInstance
  ) => Record<string, any>;
  requiresTickAdvance?: boolean;
}
export type WorldFunctorStep = {
  id: string;
  functor: WorldFunctor;
  purpose: string;
  description?: string;
  role?: string;
  resolveInput?: (
    input: WorldInstance,
    context: Record<string, any>
  ) => Promise<{ world: WorldInstance }>;
  storeOutputAs?: string;
  tickAdvance?: boolean;
  tickType?: string;
};
