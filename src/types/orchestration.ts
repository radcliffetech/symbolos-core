import type { SymbolicObject } from "./object";
import type { WorldInstance } from "./execution";

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

export type SymbolicWorldStore = {
  getByType<T extends SymbolicObject>(type: string): T[];
  getById<T extends SymbolicObject>(id: string): T | undefined;
  getByIds<T extends SymbolicObject>(ids: string[]): T[];
  getLatestOfType<T extends SymbolicObject>(type: string): T | undefined;
  getAll(): SymbolicObject[];
  getWorld(): WorldInstance;
};
