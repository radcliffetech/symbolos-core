import type { WorldFrame } from "../types";

export type WorldStore = {
  saveFrame(frame: WorldFrame): Promise<void>;
  getFrame(
    pipelineId: string,
    runId: string,
    tick: number
  ): Promise<WorldFrame | null>;
  listFrames(pipelineId: string, runId: string): Promise<string[]>;
  getLatestFrame(pipelineId: string, runId: string): Promise<WorldFrame | null>;
  deleteRun(pipelineId: string, runId: string): Promise<void>;
  listRuns(pipelineId: string): Promise<string[]>;
  listPipelines(): Promise<string[]>;
  indexRun(pipelineId: string, runId: string): Promise<void>;
};
