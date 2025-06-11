import { gzip, ungzip } from "node-gzip";

import type { WorldFrame } from "../types";
import chalk from "chalk";
import { createClient } from "redis";

export async function getRedisClient(): Promise<
  ReturnType<typeof createClient>
> {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const redisClient = createClient({ url: redisUrl });
  redisClient.on("error", (err) => console.log("Redis Client Error", err));
  await redisClient.connect();
  return redisClient;
}

interface StoreParams {
  redisClient: any;
  world: WorldFrame;
  prefix?: string;
  verbose?: boolean;
}
export async function storeWorldInstanceToRedis({
  redisClient,
  world,
  prefix = "symbolos:worlds",
  verbose = false,
}: StoreParams): Promise<void> {
  const key = `${prefix}:${world.pipelineId}:${world.runId}:frame:${world.tick}`;
  const worldData = JSON.stringify(world);
  if (verbose) {
    console.log(
      chalk.blueBright(
        `[symbolos] 🗄️ Storing world instance to Redis at key: ${key} 
      (Tick: ${world.tick}, Step: ${world.step})`
      )
    );
  }
  redisClient.set(key, worldData);
}

export async function storeCompressedWorldFrameToRedis({
  redisClient,
  world,
  prefix = "symbolos:worlds",
  verbose = false,
}: StoreParams): Promise<void> {
  const key = `${prefix}:${world.pipelineId}:${world.runId}:frame:${world.tick}`;
  const compressed = await gzip(JSON.stringify(world));
  if (verbose) {
    console.log(
      chalk.blueBright(
        `[symbolos] 🗄️ Storing compressed world frame to Redis at key: ${key} 
        (Tick: ${world.tick}, Step: ${world.step})`
      )
    );
  }
  redisClient.set(key, compressed);
}

export async function getWorldFrameFromRedis({
  redisClient,
  pipelineId,
  runId,
  tick,
  prefix = "symbolos:worlds",
}: {
  redisClient: any;
  pipelineId: string;
  runId: string;
  tick: number;
  prefix?: string;
}): Promise<WorldFrame | null> {
  const key = `${prefix}:${pipelineId}:${runId}:frame:${tick}`;
  const json = await redisClient.get(key);
  return json ? (JSON.parse(json) as WorldFrame) : null;
}

export async function getCompressedWorldFrameFromRedis({
  redisClient,
  pipelineId,
  runId,
  tick,
  prefix = "symbolos:worlds",
}: {
  redisClient: any;
  pipelineId: string;
  runId: string;
  tick: number;
  prefix?: string;
}): Promise<WorldFrame | null> {
  const key = `${prefix}:${pipelineId}:${runId}:frame:${tick}`;
  const compressed = await redisClient.get(key);
  if (!compressed) return null;
  const decompressed = await ungzip(compressed);
  return JSON.parse(decompressed.toString());
}

export async function listFramesForRun(
  redisClient: any,
  pipelineId: string,
  runId: string,
  prefix = "symbolos:worlds"
): Promise<string[]> {
  const pattern = `${prefix}:${pipelineId}:${runId}:frame:*`;
  const keys = await redisClient.keys(pattern);
  return keys.sort((a: string, b: string) => {
    const aTick = parseInt(a.split(":").pop() || "0");
    const bTick = parseInt(b.split(":").pop() || "0");
    return aTick - bTick;
  });
}

export async function indexWorldRun(
  redisClient: any,
  pipelineId: string,
  runId: string,
  prefix = "symbolos:index"
): Promise<void> {
  const key = `${prefix}:${pipelineId}`;
  await redisClient.sAdd(key, runId);
}

export async function listWorldRuns(
  redisClient: any,
  pipelineId: string,
  prefix = "symbolos:index"
): Promise<string[]> {
  const key = `${prefix}:${pipelineId}`;
  const runs = await redisClient.smembers(key);
  return runs.sort();
}

export async function getLatestFrameForRun(
  redisClient: any,
  pipelineId: string,
  runId: string,
  prefix = "symbolos:worlds"
): Promise<WorldFrame | null> {
  const keys = await listFramesForRun(redisClient, pipelineId, runId, prefix);
  const latestKey = keys.at(-1);
  if (!latestKey) return null;
  const json = await redisClient.get(latestKey);
  return json ? JSON.parse(json) : null;
}

export async function getLatestCompressedFrameForRun(
  redisClient: any,
  pipelineId: string,
  runId: string,
  prefix = "symbolos:worlds"
): Promise<WorldFrame | null> {
  const keys = await listFramesForRun(redisClient, pipelineId, runId, prefix);
  const latestKey = keys.at(-1);
  if (!latestKey) return null;
  const compressed = await redisClient.get(latestKey);
  if (!compressed) return null;
  const decompressed = await ungzip(compressed);
  return JSON.parse(decompressed.toString());
}

export async function deleteWorldRun(
  redisClient: any,
  pipelineId: string,
  runId: string,
  prefix = "symbolos:worlds"
): Promise<void> {
  const frameKeys = await listFramesForRun(
    redisClient,
    pipelineId,
    runId,
    prefix
  );
  if (frameKeys.length > 0) {
    await redisClient.del(...frameKeys);
  }
  await redisClient.srem(`symbolos:index:${pipelineId}`, runId);
}

export async function listWorldPipelines(
  redisClient: any,
  prefix = "symbolos:index"
): Promise<string[]> {
  const keys = await redisClient.keys(`${prefix}:*`);
  return keys.map((key: string) => key.replace(`${prefix}:`, "")).sort();
}

export async function deleteAllRunsForPipeline(
  redisClient: any,
  pipelineId: string,
  prefix = "symbolos:worlds"
): Promise<void> {
  const runIds = await listWorldRuns(redisClient, pipelineId);
  for (const runId of runIds) {
    const frameKeys = await listFramesForRun(
      redisClient,
      pipelineId,
      runId,
      prefix
    );
    if (frameKeys.length > 0) {
      await redisClient.del(...frameKeys);
    }
  }
  await redisClient.del(`symbolos:index:${pipelineId}`);
}

export const convertWorldFrameToCSV = (world: WorldFrame): string => {
  // Implementation placeholder - adjust as needed
  // Example: convert world object's properties to CSV string
  const headers = Object.keys(world).join(",");
  const values = Object.values(world)
    .map((value) => JSON.stringify(value))
    .join(",");
  return `${headers}\n${values}`;
};
