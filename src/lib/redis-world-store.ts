import {
  deleteWorldRun,
  getCompressedWorldFrameFromRedis,
  getLatestCompressedFrameForRun,
  indexWorldRun,
  listFramesForRun,
  listWorldPipelines,
  listWorldRuns,
  storeCompressedWorldFrameToRedis,
} from "./redis-utils";

import { WorldStore } from "../store/world-store";

export function createRedisWorldStore(redisClient: any): WorldStore {
  return {
    async saveFrame(frame) {
      await storeCompressedWorldFrameToRedis({ redisClient, world: frame });
    },
    async getFrame(pipelineId, runId, tick) {
      return await getCompressedWorldFrameFromRedis({
        redisClient,
        pipelineId,
        runId,
        tick,
      });
    },
    async listFrames(pipelineId, runId) {
      return await listFramesForRun(redisClient, pipelineId, runId);
    },
    async getLatestFrame(pipelineId, runId) {
      return await getLatestCompressedFrameForRun(
        redisClient,
        pipelineId,
        runId
      );
    },
    async deleteRun(pipelineId, runId) {
      return await deleteWorldRun(redisClient, pipelineId, runId);
    },
    async listRuns(pipelineId) {
      return await listWorldRuns(redisClient, pipelineId);
    },
    async listPipelines() {
      return await listWorldPipelines(redisClient);
    },
    async indexRun(pipelineId, runId) {
      return await indexWorldRun(redisClient, pipelineId, runId);
    },
  };
}
