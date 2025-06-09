import type {
  SymbolicObject,
  WorldArchive,
  WorldFrame,
  WorldSimulatorConfig,
} from "../types";

import { Readable } from "node:stream";
import chalk from "chalk";
import { createGzip } from "node:zlib";
import { createSymbolicObject } from "./object-factory";
import { pipeline as streamPipeline } from "node:stream/promises";

async function resolveArchivePath(
  config: WorldSimulatorConfig,
  pipelineId: string
): Promise<string> {
  const dateStamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "_");
  const dirName = config.archiveDirName ?? `${pipelineId}_${dateStamp}`;
  const outputDir = config.outputRoot || "sandbox/worlds/archives";
  const path = await import("path");
  return path.join(outputDir, dirName);
}

type ArchiveParams = {
  context: Record<string, any>;
  pipelineId: string;
  runId: string;
  config: WorldSimulatorConfig;
  getArtifacts: (context: Record<string, any>) => any[];
};

export async function storeWorldArchive({
  context,
  pipelineId,
  runId,
  config,
  getArtifacts,
}: ArchiveParams): Promise<{
  world: WorldArchive;
  filePath: string;
}> {
  try {
    const worldId = `world-${crypto.randomUUID()}`;
    const worldLabel = `World Archive - ${new Date().toISOString()}`;
    const worldCreatedAt = new Date().toISOString();

    const artifactsArray = getArtifacts(context);
    const worldArchive = createSymbolicObject<WorldArchive>("WorldArchive", {
      id: worldId,
      name: `World Archive for ${pipelineId} - ${runId}`,
      label: worldLabel,
      description: `World archive for pipeline ${pipelineId}, run ${runId}`,
      status: "archived",
      memberIds: artifactsArray.map((a: any) => a.id),
      metadata: {
        pipelineId,
        runId,
        subjectiveFrameId: context.subjectiveFrame?.id,
        contextualFrameId: context.contextualFrame?.id,
        selectionCriteriaId: context.selectionCriteria?.id,
        pipelinepipelineArgsId: context.pipelinepipelineArgsId,
        pipelineRunId: context.pipelineRunId,
      },
      members: artifactsArray,
    });

    const fs = await import("fs/promises");
    const path = await import("path");
    const worldsDir = await resolveArchivePath(config, pipelineId);
    await fs.mkdir(worldsDir, { recursive: true });
    const compressedPath = path.join(worldsDir, `${pipelineId}.world.json.gz`);
    const fsModule = await import("fs");
    const jsonStream = Readable.from([JSON.stringify(worldArchive)]);
    // Always create a gzip stream, fallback to passthrough if compress is false
    const { PassThrough } = await import("stream");
    const gzipStream =
      config.compress === false ? new PassThrough() : createGzip();
    const outStream = fsModule.createWriteStream(compressedPath);

    const streamsArr = [jsonStream, gzipStream, outStream].filter(Boolean);

    await streamPipeline(...(streamsArr as [any, ...any[]]));
    worldArchive.filePath = compressedPath;

    return {
      world: worldArchive,
      filePath: compressedPath,
    };
  } catch (error) {
    console.error(chalk.red("Error storing world archive:"), error);
    throw new Error(
      `Failed to store world archive: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

type ArchiveFrameParams = ArchiveParams & {
  tick: number;
  step: number;
  previousArtifacts?: Map<string, SymbolicObject>;
};

export const storeWorldFrame = async ({
  context,
  pipelineId,
  runId,
  config,
  getArtifacts,
  tick,
  step,
}: ArchiveFrameParams): Promise<{
  frame: WorldFrame;
  filePath: string;
}> => {
  try {
    const worldId = `world-${(await import("crypto")).randomUUID()}`;
    const worldLabel = `World Archive Frame - ${new Date().toISOString()}`;

    const artifactsArray = getArtifacts(context);
    const worldFrame = createSymbolicObject<WorldFrame>("WorldFrame", {
      id: worldId,
      label: worldLabel,
      description: `World archive snapshot for pipeline ${pipelineId}, run ${runId}, tick ${tick}, step ${step}`,
      status: "archived",
      memberIds: artifactsArray.map((a: any) => a.id),
      tick: tick,
      step: step,
      metadata: {
        pipelineId,
        runId,
        tick,
        step,
        subjectiveFrameId: context.subjectiveFrame?.id,
        contextualFrameId: context.contextualFrame?.id,
        selectionCriteriaId: context.selectionCriteria?.id,
        pipelinepipelineArgsId: context.pipelinepipelineArgsId,
        pipelineRunId: context.pipelineRunId,
      },
      members: artifactsArray,
    });

    const fs = await import("fs/promises");
    const path = await import("path");
    const worldsDir = await resolveArchivePath(config, pipelineId);

    await fs.mkdir(worldsDir, { recursive: true });
    const jsonFileName = `frame-${step + 1}-tick-${tick}.world.json.gz`;
    const filePath = path.join(worldsDir, jsonFileName);
    const fsModule = await import("fs");
    const jsonStream = Readable.from([JSON.stringify(worldFrame)]);
    // Always create a gzip stream, fallback to passthrough if compress is false
    const { PassThrough } = await import("stream");
    const gzipStream =
      config.compress === false ? new PassThrough() : createGzip();
    const outStream = fsModule.createWriteStream(filePath);

    const streamsArr = [jsonStream, gzipStream, outStream].filter(Boolean);

    await streamPipeline(...(streamsArr as [any, ...any[]]));
    return { frame: worldFrame, filePath };
  } catch (error) {
    console.error(chalk.red("Error storing world archive frame:"), error);
    throw new Error(
      `Failed to store world archive frame: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
