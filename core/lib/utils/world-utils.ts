import { SymbolicObject } from '../../types';
import chalk from 'chalk';
// Helper function to create and write the WorldArchive object
type ArchiveParams = {
  context: Record<string, any>;
  pipelineId: string;
  runId: string;
  config: { storeFiles?: boolean; verbose?: boolean };
  getArtifacts: (context: Record<string, any>) => any[];
};

export type SymbolicWorldFrame = SymbolicObject & {
  members: any[]; // Array of members in the world
  tick: number; // Optional tick number
  step: number; // Optional step number
  pipelineId: string; // ID of the pipeline this world belongs to
  runId: string; // ID of the run this world belongs to
};

export async function storeWorldArchive({
  context,
  pipelineId,
  runId,
  getArtifacts,
}: ArchiveParams): Promise<{
  world: SymbolicObject;
  filePath: string;
}> {
  try {
    const worldId = `world-${crypto.randomUUID()}`;
    const worldLabel = `World Archive - ${new Date().toISOString()}`;
    const worldCreatedAt = new Date().toISOString();

    const artifactsArray = getArtifacts(context);
    const worldArchive = {
      type: 'WorldArchive',
      id: worldId,
      name: `World Archive for ${pipelineId} - ${runId}`,
      label: worldLabel,
      description: `World archive for pipeline ${pipelineId}, run ${runId}`,
      createdAt: worldCreatedAt,
      status: 'archived',
      memberIds: artifactsArray.map((a: any) => a.id),
      metadata: {
        pipelineId,
        runId,
        subjectiveFrameId: context.subjectiveFrame?.id,
        contextualFrameId: context.contextualFrame?.id,
        selectionCriteriaId: context.selectionCriteria?.id,
        pipelineUserArgsId: context.pipelineUserArgsId,
        pipelineRunId: context.pipelineRunId,
      },
      members: artifactsArray,
    };

    // NOTE: We are _not_ storing the WorldArchive in the database

    const fs = await import('fs/promises');
    const path = await import('path');
    const stream = await import('stream');
    const zlib = await import('zlib');
    const dateStamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '_');
    const worldsDir = path.join('sandbox', 'worlds', 'archives', `${pipelineId}_${dateStamp}`);
    await fs.mkdir(worldsDir, { recursive: true });
    const compressedPath = path.join(worldsDir, `${pipelineId}.world.json.gz`);
    // Use streaming gzip pipeline
    const { pipeline } = stream;
    const { createGzip } = zlib;
    const fsModule = await import('fs');
    await new Promise<void>((resolve, reject) => {
      const jsonStream = stream.Readable.from([JSON.stringify(worldArchive)]);
      const gzipStream = createGzip();
      const outStream = fsModule.createWriteStream(compressedPath);
      pipeline(jsonStream, gzipStream, outStream, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    // Embed the resulting file path into the worldArchive object
    (worldArchive as any).filePath = compressedPath;
    return {
      world: worldArchive,
      filePath: compressedPath,
    };
  } catch (error) {
    console.error(chalk.red('Error storing world archive:'), error);
    throw new Error(
      `Failed to store world archive: ${error instanceof Error ? error.message : 'Unknown error'}`
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
  previousArtifacts = new Map<string, SymbolicObject>(),
}: ArchiveFrameParams): Promise<{
  frame: SymbolicObject;
  filePath: string;
}> => {
  try {
    const worldId = `world-${(await import('crypto')).randomUUID()}`;
    const worldLabel = `World Archive Frame - ${new Date().toISOString()}`;
    const worldCreatedAt = new Date().toISOString();

    const artifactsArray = getArtifacts(context);
    const worldFrame = {
      type: 'WorldFrame',
      id: worldId,
      name: `World Archive Frame for ${pipelineId} - ${runId} (tick ${tick}, step ${step})`,
      label: worldLabel,
      description: `World archive snapshot for pipeline ${pipelineId}, run ${runId}, tick ${tick}, step ${step}`,
      createdAt: worldCreatedAt,
      status: 'archived',
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
        pipelineUserArgsId: context.pipelineUserArgsId,
        pipelineRunId: context.pipelineRunId,
      },
      members: artifactsArray,
    };

    // Write compressed JSON (gzip) to sandbox/worlds/{pipelineId}_{dateStamp}/
    const fs = await import('fs/promises');
    const path = await import('path');
    const stream = await import('stream');
    const zlib = await import('zlib');
    const dateStamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '_');
    const worldsDir = path.join('sandbox', 'worlds', 'archives', `${pipelineId}_${dateStamp}`);

    await fs.mkdir(worldsDir, { recursive: true });
    const jsonFileName = `frame-${step + 1}-tick-${tick}.world.json.gz`;
    const filePath = path.join(worldsDir, jsonFileName);
    // Use streaming gzip pipeline
    const { pipeline } = stream;
    const { createGzip } = zlib;
    const fsModule = await import('fs');
    await new Promise<void>((resolve, reject) => {
      const jsonStream = stream.Readable.from([JSON.stringify(worldFrame)]);
      const gzipStream = createGzip();
      const outStream = fsModule.createWriteStream(filePath);
      pipeline(jsonStream, gzipStream, outStream, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    return { frame: worldFrame, filePath };
  } catch (error) {
    console.error(chalk.red('Error storing world archive frame:'), error);
    throw new Error(
      `Failed to store world archive frame: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};
