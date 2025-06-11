vi.mock("redis", () => ({
  createClient: () => ({
    on: vi.fn(),
    connect: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    keys: vi.fn(),
    smembers: vi.fn(),
    del: vi.fn(),
    sAdd: vi.fn(),
    srem: vi.fn(),
  }),
}));

vi.mock("node-gzip", () => ({
  gzip: vi.fn(async (input) => Buffer.from(input)),
  ungzip: vi.fn(async (input) => input),
}));

import { describe, expect, it, vi } from "vitest";

import { WorldFrame } from "../types";
import { createRedisWorldStore } from "./redis-world-store";
import { createSymbolicObject } from "./object-factory";

describe("createRedisWorldStore", () => {
  const redisClient = {
    set: vi.fn(),
    get: vi.fn(),
    keys: vi.fn(),
    smembers: vi.fn(),
    del: vi.fn(),
    sAdd: vi.fn(),
    srem: vi.fn(),
  };

  const store = createRedisWorldStore(redisClient);

  const sampleFrame = createSymbolicObject<WorldFrame>("WorldFrame", {
    id: "frame-1",
    tick: 1,
    step: 1,
    runId: "run-abc",
    pipelineId: "gas-diffusion",
    members: [],
    metadata: {},
    description: "test frame",
  });

  it("calls storeWorldInstanceToRedis via saveFrame", async () => {
    await store.saveFrame(sampleFrame);
    expect(redisClient.set).toHaveBeenCalled();
  });

  it("calls getWorldFrameFromRedis via getFrame", async () => {
    redisClient.get.mockResolvedValueOnce(
      Buffer.from(JSON.stringify(sampleFrame))
    );
    const frame = await store.getFrame("gas-diffusion", "run-abc", 1);
    expect(redisClient.get).toHaveBeenCalledWith(
      "symbolos:worlds:gas-diffusion:run-abc:frame:1"
    );
    expect(frame).toEqual(sampleFrame);
  });

  it("calls listFramesForRun via listFrames", async () => {
    redisClient.keys.mockResolvedValue([
      "symbolos:worlds:gas-diffusion:run-abc:frame:1",
    ]);
    const keys = await store.listFrames("gas-diffusion", "run-abc");
    expect(keys.length).toBe(1);
    expect(redisClient.keys).toHaveBeenCalled();
  });

  it("calls getLatestFrameForRun via getLatestFrame", async () => {
    redisClient.keys.mockResolvedValue([
      "symbolos:worlds:gas-diffusion:run-abc:frame:1",
    ]);
    redisClient.get.mockResolvedValueOnce(
      Buffer.from(JSON.stringify(sampleFrame))
    );
    const frame = await store.getLatestFrame("gas-diffusion", "run-abc");
    expect(frame?.tick).toBe(1);
  });

  it("calls deleteWorldRun via deleteRun", async () => {
    redisClient.keys.mockResolvedValue([
      "symbolos:worlds:gas-diffusion:run-abc:frame:1",
    ]);
    redisClient.del.mockResolvedValue(1);
    redisClient.srem.mockResolvedValue(1);
    await store.deleteRun("gas-diffusion", "run-abc");
    expect(redisClient.del).toHaveBeenCalled();
    expect(redisClient.srem).toHaveBeenCalledWith(
      "symbolos:index:gas-diffusion",
      "run-abc"
    );
  });

  it("calls listWorldRuns via listRuns", async () => {
    redisClient.smembers.mockResolvedValue(["run-abc"]);
    const runs = await store.listRuns("gas-diffusion");
    expect(runs).toEqual(["run-abc"]);
  });

  it("calls listWorldPipelines via listPipelines", async () => {
    redisClient.keys.mockResolvedValue([
      "symbolos:index:gas-diffusion",
      "symbolos:index:gravity",
    ]);
    const pipelines = await store.listPipelines();
    expect(pipelines).toEqual(["gas-diffusion", "gravity"]);
  });

  it("calls indexWorldRun via indexRun", async () => {
    redisClient.sAdd.mockResolvedValue(1);
    await store.indexRun("gas-diffusion", "run-abc");
    expect(redisClient.sAdd).toHaveBeenCalledWith(
      "symbolos:index:gas-diffusion",
      "run-abc"
    );
  });
});
