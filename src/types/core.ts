import type { BaseSymbolicObject, IdentifiableObject } from "./base";

// Represents any basic symbolic entity in the system
export type SymbolicObject = BaseSymbolicObject;

// Describes an action performed symbolically within the system
export type SymbolicAction = BaseSymbolicObject & {
  type: "SymbolicAction";
  /** ID of the acting agent */
  actorId: string;
  /** ID of the transformation applied */
  transformationId: string;
  /** ID of the instrument or tool used */
  instrumentId?: string;
  /** ID of the input object */
  inputId: string;
  /** ID of the output object */
  outputId: string;
  /** ID of the context in which the action occurs */
  contextId: string;
  /** Purpose or intent of the action */
  purpose?: string;
  /** ISO timestamp when the action occurred */
  timestamp: string;
  /** Optional notes about the action */
  notes?: string;
};

// Represents a stored collection of symbolic objects forming a world archive
export type WorldArchive = BaseSymbolicObject & {
  type: "WorldArchive";
  name: string;
  memberIds: string[]; // IDs of all included SymbolicObjects
  members: BaseSymbolicObject[]; // All included objects, for easy retrieval
  filePath?: string; // Path to the .world.json.gz archive
  metadata?: Record<string, any>;
};

// Captures the current runtime state of the symbolic world during execution
export type WorldInstance = IdentifiableObject & {
  tick: number;
  step: number;
  runId: string;
  pipelineId: string;
  artifacts: Map<string, BaseSymbolicObject>;
  context: Record<string, any>;
  metadata?: Record<string, any>;
};

// Defines a snapshot of the symbolic world at a specific point in time
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

// Holds the parameters and initial state for a pipeline execution
export type PipelineArgs = SymbolicObject & {
  type: "PipelineArgs";
  params: Record<string, any>;
  metadata?: Record<string, any>;
  storePipelineRun?: boolean; // Whether to store the pipeline run in the world
};

/** Represents a full symbolic execution of a pipeline */
// Tracks the lifecycle and metadata of a pipeline run
export type PipelineRun = SymbolicObject & {
  type: "PipelineRun";
  pipelineId: string;
  runId: string;
  pipelineArgsId: string;
  stepIds: string[];
  tickCount: number;
  stepCount: number;
  artifactIds?: string[];
  startedAt: string;
  completedAt?: string;
  status: "pending" | "running" | "completed" | "failed";
  metadata?: Record<string, any>;
};

// Represents the full result of running a symbolic pipeline
export interface PipelineResult {
  world: WorldInstance;
  actions: SymbolicAction[];
  tickCount: number;
  pipelineRun?: PipelineRun;
  /** Duration in milliseconds */
  duration: number;
}

// Defines a functional unit that operates on a WorldInstance to produce a new state
export interface Functor extends IdentifiableObject {
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

// Represents a single step in a pipeline, linking to a Functor and its execution details
export type FunctorStep = IdentifiableObject & {
  description?: string;
  functor: Functor;
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

// Represents an agent capable of generating symbolic outputs within a world context
export interface BaseAgent extends IdentifiableObject {
  name: string;
  generate(
    this: this,
    world: WorldInstance
  ): Promise<{ world: WorldInstance; output?: BaseSymbolicObject[] }>;
}

// Describes the structure and metadata of a symbolic pipeline definition
export interface PipelineDefinition extends IdentifiableObject {
  label: string;
  description: string;
  steps: FunctorStep[];
  version: 3;
}

// Defines a system composed of multiple pipelines and associated types
export interface SystemDefinition extends IdentifiableObject {
  label: string;
  description: string;
  pipelines: PipelineDefinition[];
  types?: string[];
}
