import { beforeEach, describe, expect, it, vi } from "vitest";
import { storeWorldArchive, storeWorldFrame } from "./world-utils";

import { PassThrough } from "stream";

vi.mock("fs/promises", async () => {
  const actual = (await vi.importActual("fs/promises")) as any;
  return {
    ...(actual as object),
    mkdir: vi.fn(),
  };
});

vi.mock("fs", async () => {
  const actual = await vi.importActual("fs");
  return {
    ...(actual as object),
    createWriteStream: () => ({
      on: () => {},
      once: () => {},
      end: () => {},
    }),
  };
});

vi.mock("stream", async () => {
  const actual = await vi.importActual("stream");
  return {
    ...(actual as object),
    pipeline: (_a: any, _b: any, _c: any, cb: any) => cb(null),
    Readable: {
      from: (arr: any[]) => {
        const stream = new PassThrough();
        stream.end(arr[0]);
        return stream;
      },
    },
  };
});

vi.mock("zlib", () => ({
  createGzip: () => new PassThrough(),
}));

vi.mock("path", () => ({
  join: (...args: string[]) => args.join("/"),
}));

describe("storeWorldArchive", () => {
  it("creates a world archive with embedded filePath", async () => {
    const result = await storeWorldArchive({
      context: {},
      pipelineId: "test-pipeline",
      runId: "run-123",
      config: { verbose: false },
      getArtifacts: () => [{ id: "x", type: "Test" }],
    });

    expect(result.world).toBeDefined();
    expect(result.world.type).toBe("WorldArchive");
    expect(result.filePath).toContain(".world.json.gz");
  });
});

describe("storeWorldFrame", () => {
  it("creates a world frame with tick and step info", async () => {
    const result = await storeWorldFrame({
      context: {},
      pipelineId: "test-pipeline",
      runId: "run-456",
      config: { verbose: false },
      tick: 2,
      step: 5,
      getArtifacts: () => [{ id: "y", type: "Test" }],
    });

    expect(result.frame).toBeDefined();
    expect(result.frame.tick).toBe(2);
    expect(result.frame.step).toBe(5);
    expect(result.filePath).toContain("tick-2");
  });
});

it("stores uncompressed archive when compress is false", async () => {
  const result = await storeWorldArchive({
    context: {},
    pipelineId: "no-compress",
    runId: "run-789",
    config: { compress: false, verbose: false },
    getArtifacts: () => [{ id: "a", type: "Test" }],
  });

  expect(result.filePath).toContain(".world.json.gz");
  expect(result.world).toBeDefined();
});

it("uses custom archiveDirName from config", async () => {
  const result = await storeWorldFrame({
    context: {},
    pipelineId: "custom-pipeline",
    runId: "run-custom",
    tick: 0,
    step: 0,
    config: {
      archiveDirName: "custom-archive-dir",
    },
    getArtifacts: () => [{ id: "b", type: "Test" }],
  });

  expect(result.filePath).toContain("custom-archive-dir");
});

it("handles empty artifact set gracefully", async () => {
  const result = await storeWorldArchive({
    context: {},
    pipelineId: "empty-artifacts",
    runId: "run-000",
    config: {},
    getArtifacts: () => [],
  });

  expect(result.world.memberIds).toEqual([]);
  expect(result.world.members).toEqual([]);
});
