import { BaseSymbolicObject } from "./base";

/**
 * Represents the live, tick-by-tick state of a symbolic world.
 * Not stored as a symbolic object — used during execution only.
 */
export type WorldInstance = {
  id: string;
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
  apply: (input: { world: WorldInstance }) => Promise<{
    world: WorldInstance;
    output?: BaseSymbolicObject[];
  }>;
  requiresTickAdvance?: boolean;
}

export type WorldFunctorStep = {
  id: string;
  description?: string;
  functor: WorldFunctor;
  purpose: string;
  role?: string;
  resolveInput?: (
    input: WorldInstance,
    context: Record<string, any>
  ) => Promise<{ world: WorldInstance }>;
  storeOutputAs?: string;
  tickAdvance?: boolean;
  tickType?: string;
};

export interface WorldSystem<A = BaseAgent, C = Record<string, any>> {
  id: string;
  agents: A[];
  pipeline: WorldFunctorStep[];
  config?: C;
}

export interface WorldPipelineDefinition {
  id: string;
  label: string;
  description: string;
  steps: WorldFunctorStep[];
  version: 3;
}

export interface WorldSystemDefinition {
  id: string;
  label: string;
  description: string;
  pipelines: WorldPipelineDefinition[];
  types?: string[];
}

export interface BaseAgent {
  id: string;
  name: string;
  generate(
    this: this,
    world: WorldInstance
  ): Promise<{ world: WorldInstance; output?: BaseSymbolicObject[] }>;
}
