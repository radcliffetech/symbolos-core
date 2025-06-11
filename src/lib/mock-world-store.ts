import { WorldFrame } from "../types";
import { WorldStore } from "../store/world-store";
export function createMockWorldStore(
  initialFrames: WorldFrame[] = []
): WorldStore {
  const store = new Map<string, WorldFrame>();

  for (const frame of initialFrames) {
    const key = `${frame.pipelineId}:${frame.runId}:${frame.tick}`;
    store.set(key, frame);
  }

  return {
    async saveFrame(frame) {
      const key = `${frame.pipelineId}:${frame.runId}:${frame.tick}`;
      store.set(key, frame);
    },
    async getFrame(pipelineId, runId, tick) {
      return store.get(`${pipelineId}:${runId}:${tick}`) ?? null;
    },
    async listFrames(pipelineId, runId) {
      return [...store.keys()]
        .filter((k) => k.startsWith(`${pipelineId}:${runId}:`))
        .sort();
    },
    async getLatestFrame(pipelineId, runId) {
      const ticks = await this.listFrames(pipelineId, runId);
      const latest = ticks.at(-1);
      return latest ? store.get(latest) ?? null : null;
    },
    async deleteRun(pipelineId, runId) {
      for (const key of store.keys()) {
        if (key.startsWith(`${pipelineId}:${runId}:`)) store.delete(key);
      }
    },
    async listRuns(pipelineId) {
      const runs = new Set<string>();
      for (const key of store.keys()) {
        const [p, r] = key.split(":");
        if (p === pipelineId) runs.add(r);
      }
      return [...runs].sort();
    },
    async listPipelines() {
      const pipes = new Set<string>();
      for (const key of store.keys()) {
        pipes.add(key.split(":")[0]);
      }
      return [...pipes].sort();
    },
    async indexRun(pipelineId, runId) {
      // In a mock store, indexing is a no-op
      return;
    },
  };
}
