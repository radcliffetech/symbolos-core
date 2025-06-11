// Mock gzip/ungzip for compressed world frame tests
vi.mock("node-gzip", () => ({
  gzip: vi.fn(async (input) => Buffer.from(input)),
  ungzip: vi.fn(async (input) => input),
}));

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCompressedWorldFrameFromRedis,
  getLatestCompressedFrameForRun,
  storeCompressedWorldFrameToRedis,
} from "./redis-utils";
import { getWorldFrameFromRedis, listFramesForRun } from "./redis-utils";
import { indexWorldRun, listWorldRuns } from "./redis-utils";

import { createNewWorldInstance } from "src/simulators/world-simulator";
import { deleteAllRunsForPipeline } from "./redis-utils";
import { getLatestFrameForRun } from "./redis-utils";
import { listWorldPipelines } from "./redis-utils";
import { storeWorldInstanceToRedis } from "./redis-utils";
import { toWorldFrame } from "./world-actions";

vi.mock("redis", () => {
  const mockRedis = {
    connect: vi.fn(),
    on: vi.fn(),
    set: vi.fn(),
    get: vi.fn().mockResolvedValue("ok"),
    keys: vi.fn(),
  };
  return {
    createClient: () => mockRedis,
  };
});

describe("redis-utils", () => {
  let redisClient: any;

  beforeEach(() => {
    redisClient = {
      connect: vi.fn(),
      on: vi.fn(),
      set: vi.fn(),
      get: vi.fn(),
      keys: vi.fn().mockResolvedValue([]),
      sAdd: vi.fn(),
      smembers: vi.fn().mockResolvedValue([]),
      del: vi.fn(),
      srem: vi.fn(),
    };
  });

  it("connects to Redis using getRedisClient", async () => {
    // Import here to avoid hoisting issues and ensure mocks apply
    const { getRedisClient } = await import("./redis-utils");
    const client = await getRedisClient();
    expect(client.connect).toHaveBeenCalled();
    expect(client.on).toHaveBeenCalledWith("error", expect.any(Function));
  });

  it("stores world instance with expected key", async () => {
    const mockWorld = createNewWorldInstance("test");
    const frame = toWorldFrame(mockWorld);
    await storeWorldInstanceToRedis({
      redisClient,
      world: frame,
    });
    const expectedKey = `symbolos:worlds:${frame.pipelineId}:${frame.runId}:frame:${frame.tick}`;
    expect(redisClient.set).toHaveBeenCalledWith(
      expectedKey,
      JSON.stringify(frame)
    );
  });

  it("retrieves a world frame by key using getWorldFrameFromRedis", async () => {
    const mockFrame = { tick: 1, step: 1, pipelineId: "gas", runId: "abc" };
    redisClient.get.mockResolvedValue(JSON.stringify(mockFrame));

    const frame = await getWorldFrameFromRedis({
      redisClient,
      pipelineId: "gas",
      runId: "abc",
      tick: 1,
    });

    expect(redisClient.get).toHaveBeenCalledWith(
      "symbolos:worlds:gas:abc:frame:1"
    );
    expect(frame).toEqual(mockFrame);
  });

  it("lists sorted frame keys for a given run using listFramesForRun", async () => {
    redisClient.keys = vi
      .fn()
      .mockResolvedValue([
        "symbolos:worlds:gas:abc:frame:3",
        "symbolos:worlds:gas:abc:frame:1",
        "symbolos:worlds:gas:abc:frame:2",
      ]);

    const keys = await listFramesForRun(redisClient, "gas", "abc");

    expect(redisClient.keys).toHaveBeenCalledWith(
      "symbolos:worlds:gas:abc:frame:*"
    );
    expect(keys).toEqual([
      "symbolos:worlds:gas:abc:frame:1",
      "symbolos:worlds:gas:abc:frame:2",
      "symbolos:worlds:gas:abc:frame:3",
    ]);
  });

  it("indexes a world run using indexWorldRun", async () => {
    redisClient.sAdd = vi.fn();
    await indexWorldRun(redisClient, "gas", "abc");
    expect(redisClient.sAdd).toHaveBeenCalledWith("symbolos:index:gas", "abc");
  });

  it("lists all world runs for a pipeline using listWorldRuns", async () => {
    redisClient.smembers = vi.fn().mockResolvedValue(["run2", "run1"]);
    const runs = await listWorldRuns(redisClient, "gas");
    expect(redisClient.smembers).toHaveBeenCalledWith("symbolos:index:gas");
    expect(runs).toEqual(["run1", "run2"]); // confirm sorted
  });

  // Test for getLatestFrameForRun

  it("gets the latest world frame for a run using getLatestFrameForRun", async () => {
    const mockFrame = { tick: 3, step: 1, pipelineId: "gas", runId: "abc" };

    redisClient.keys.mockResolvedValue([
      "symbolos:worlds:gas:abc:frame:1",
      "symbolos:worlds:gas:abc:frame:2",
      "symbolos:worlds:gas:abc:frame:3",
    ]);

    redisClient.get.mockResolvedValueOnce(JSON.stringify(mockFrame));

    const frame = await getLatestFrameForRun(redisClient, "gas", "abc");

    expect(redisClient.keys).toHaveBeenCalledWith(
      "symbolos:worlds:gas:abc:frame:*"
    );
    expect(redisClient.get).toHaveBeenCalledWith(
      "symbolos:worlds:gas:abc:frame:3"
    );
    expect(frame).toEqual(mockFrame);
  });

  it("lists all pipeline IDs using listWorldPipelines", async () => {
    redisClient.keys.mockResolvedValue([
      "symbolos:index:memetic-drift",
      "symbolos:index:gas-diffusion",
      "symbolos:index:counterpoint",
    ]);

    const pipelines = await listWorldPipelines(redisClient);

    expect(redisClient.keys).toHaveBeenCalledWith("symbolos:index:*");
    expect(pipelines).toEqual([
      "counterpoint",
      "gas-diffusion",
      "memetic-drift",
    ]);
  });

  it("deletes all frame keys and index entry for a pipeline using deleteAllRunsForPipeline", async () => {
    // Reset and isolate Redis mocks for this test
    redisClient.keys.mockReset();
    // Return frame keys based on the pattern being requested
    redisClient.keys.mockImplementation((pattern: string) => {
      if (pattern === "symbolos:worlds:gas:run1:frame:*") {
        return Promise.resolve([
          "symbolos:worlds:gas:run1:frame:1",
          "symbolos:worlds:gas:run1:frame:2",
        ]);
      }
      if (pattern === "symbolos:worlds:gas:run2:frame:*") {
        return Promise.resolve([
          "symbolos:worlds:gas:run2:frame:1",
          "symbolos:worlds:gas:run2:frame:2",
        ]);
      }
      // Default (shouldn't be used in this test)
      return Promise.resolve([]);
    });
    redisClient.del = vi.fn();
    redisClient.smembers = vi.fn().mockResolvedValue(["run1", "run2"]);

    await deleteAllRunsForPipeline(redisClient, "gas");

    const flattened = redisClient.del.mock.calls.flat();

    expect(flattened).toEqual(
      expect.arrayContaining([
        "symbolos:worlds:gas:run1:frame:1",
        "symbolos:worlds:gas:run1:frame:2",
        "symbolos:worlds:gas:run2:frame:1",
        "symbolos:worlds:gas:run2:frame:2",
        "symbolos:index:gas",
      ])
    );
    // Ensure only these keys were deleted (no extras)
    expect(flattened.length).toBe(5);
  });
  it("stores a compressed world frame using storeCompressedWorldFrameToRedis", async () => {
    const mockWorld = createNewWorldInstance("test");
    const frame = toWorldFrame(mockWorld);
    await storeCompressedWorldFrameToRedis({ redisClient, world: frame });

    const expectedKey = `symbolos:worlds:${frame.pipelineId}:${frame.runId}:frame:${frame.tick}`;
    expect(redisClient.set).toHaveBeenCalledWith(
      expectedKey,
      expect.any(Buffer)
    );
  });

  it("retrieves and decompresses a frame using getCompressedWorldFrameFromRedis", async () => {
    const mockFrame = { tick: 1, step: 1, pipelineId: "gas", runId: "abc" };
    redisClient.get.mockResolvedValueOnce(
      Buffer.from(JSON.stringify(mockFrame))
    );

    const frame = await getCompressedWorldFrameFromRedis({
      redisClient,
      pipelineId: "gas",
      runId: "abc",
      tick: 1,
    });

    expect(frame).toEqual(mockFrame);
  });

  it("gets the latest compressed frame using getLatestCompressedFrameForRun", async () => {
    const mockFrame = { tick: 3, step: 1, pipelineId: "gas", runId: "abc" };
    redisClient.keys.mockResolvedValue([
      "symbolos:worlds:gas:abc:frame:1",
      "symbolos:worlds:gas:abc:frame:2",
      "symbolos:worlds:gas:abc:frame:3",
    ]);
    redisClient.get.mockResolvedValueOnce(
      Buffer.from(JSON.stringify(mockFrame))
    );

    const frame = await getLatestCompressedFrameForRun(
      redisClient,
      "gas",
      "abc"
    );

    expect(frame).toEqual(mockFrame);
  });
});
