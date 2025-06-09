import { SymbolicObject } from "./object";

/** A single executed step in a pipeline */
export type PipelineStep = SymbolicObject & {
  type: "PipelineStep";
  id: string;
  pipelineId: string;
  runId: string;
  stepId: string;
  functor: string;
  inputRefIds: string[];
  outputRefIds: string[];
  params?: Record<string, any>;
  startedAt?: string;
  completedAt?: string;
  status?: "pending" | "running" | "completed" | "failed";
  metadata?: Record<string, any>;
};

/** Represents a full symbolic execution of a pipeline */
export type PipelineRun = SymbolicObject & {
  type: "PipelineRun";
  id: string;
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
/** Captures the initial configuration of a pipeline run */
export type PipelineArgs = SymbolicObject & {
  type: "PipelineArgs";
  id: string;
  params: Record<string, any>;
  createdAt: string;
  metadata?: Record<string, any>;
};
/** Configuration for a world simulator */
export type WorldSimulatorConfig = {
  verbose?: boolean;
  outputRoot?: string;
  archiveDirName?: string;
  compress?: boolean;
};
