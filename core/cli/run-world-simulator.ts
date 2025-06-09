import {
  type WorldSimulatorConfig,
  createWorldFromFrame,
  forkWorld,
  makeNewWorld,
  runWorldPipeline,
} from '@core/simulators/world-simulator';
import { SYMBOLOS_VERSION } from '../version';

import { conwayGame } from '@core/pipelines/examples/conway-game-of-life';

import { WorldArchive, PipelineArgs, SymbolicObject, PipelineDefinition } from '@core/types';
import chalk from 'chalk';
import { hideBin } from 'yargs/helpers';
import { readJsonGz } from '@core/lib/utils/file-utils';
import yargs from 'yargs/yargs';

const getPipelineRegistry = (): Record<string, PipelineDefinition> => ({
  [conwayGame.id]: conwayGame,
});

const defaultPipelineId = conwayGame.id;

async function main() {
console.log(chalk.gray(`🪪 Symbolos Core v${SYMBOLOS_VERSION}`));
  const args = await yargs(hideBin(process.argv))
    .option('fromFrame', {
      type: 'string',
      describe: 'Path to .world.json.gz frame to resume from',
    })
    .option('fromArchive', {
      type: 'string',
      describe: 'Path to .world.json.gz archive to fork from',
    })
    .option('pipelineId', {
      type: 'string',
      default: defaultPipelineId,
      describe: 'Pipeline ID',
    })
    .option('verbose', { type: 'boolean', default: false })
    .option('params', {
      type: 'array',
      describe: 'Pipeline parameters as key=value pairs',
    })
    .option('list', {
      type: 'boolean',
      describe: 'List available pipeline IDs and exit',
    })
    .parse();


  let pipelineId = args.pipelineId || defaultPipelineId;

  const pipelineRegistry = getPipelineRegistry();

  if (args.list) {
    console.log('📚 Available pipelines:');
    Object.entries(pipelineRegistry).forEach(([id, def]) => {
      console.log(`- ${id} — ${def.label}`);
    });
    process.exit(0);
  }

  const pipelineDefinition = pipelineRegistry[pipelineId as keyof typeof pipelineRegistry];
  if (!pipelineDefinition) {
    console.error(chalk.red(`❌ Pipeline with ID "${pipelineId}" not found!`));
    console.error(chalk.red(`Available pipelines: ${Object.keys(pipelineRegistry).join(', ')}`));
    process.exit(1);
  }

  const framePath = args.fromFrame;
  const verbose = args.verbose;

  const cliParams = ((args.params as string[] | undefined) || []).reduce((acc: Record<string, any>, pair: string) => {
    const [key, value] = pair.split('=');
    acc[key] = isNaN(Number(value)) ? value : Number(value);
    return acc;
  }, {});

  let world;

  const runId = crypto.randomUUID();

  if (framePath) {
    console.log(chalk.cyan(`📂 Resuming world from: ${framePath}`));
    const frame = await readJsonGz(framePath);
    world = createWorldFromFrame({ frame, pipelineId, runId });
    pipelineId = world.pipelineId;
    console.log(chalk.green(`✅ World restored at tick ${world.tick}, step ${world.step}`));
  } else if (args.fromArchive) {
    console.log(chalk.cyan(`📂 Forking world from archive: ${args.fromArchive}`));
    const archive = await readJsonGz(args.fromArchive);
    const baseWorld = createWorldFromFrame({
      frame: archive,
      pipelineId: archive.pipelineId || defaultPipelineId,
      runId: archive.runId || crypto.randomUUID(),
    });
    world = forkWorld(baseWorld, cliParams);
    pipelineId = world.pipelineId;
    console.log(chalk.green(`✅ Forked world created with new runId: ${world.runId}`));
  } else {
    console.log(chalk.yellow(`🌱 Starting new world for pipeline: ${pipelineId}`));
    world = makeNewWorld(pipelineId);
    console.log(chalk.green(`✅ New world initialized with runId: ${world.runId}`));
  }

  console.log(chalk.blue(`🧪 Using pipeline: ${pipelineId}`));
  console.log(chalk.blueBright(`🔧 Pipeline Definition: ${pipelineDefinition.label}`));

  const mergedParams = {
    ...(pipelineDefinition.args?.defaults || {}),
    ...cliParams,
  };

  const userArgs: PipelineArgs = {
    id: `user-args-${Date.now()}`,
    label: 'User Arguments',
    type: 'PipelineArgs',
    status: 'valid',
    pipelineId: pipelineDefinition.id,
    runId,
    createdAt: new Date().toISOString(),
    params: mergedParams,
  };


  const pipelineConfig: WorldSimulatorConfig = {
    verbose,
  };

  if (Object.keys(mergedParams).length > 0) {
    console.log(chalk.gray('📦 Final parameters:'));
    Object.entries(mergedParams).forEach(([key, value]) => {
      console.log(chalk.gray(`  ${key}: ${value}`));
    });
  }

  console.log(chalk.blueBright(`🚀 Running simulation...`));

  const result = await runWorldPipeline({
    world,
    userArgs,
    steps: pipelineDefinition.steps(userArgs),
    config: pipelineConfig,
  });

  if (!result || typeof result.tick !== 'number') {
    console.error(chalk.red('⚠️ Simulation failed or returned invalid result.'));
    process.exit(1);
  }

  console.log(chalk.green(`✅ Simulation completed! Final tick: ${result.tick}`));
  if (result.context && result.context._artifactsById) {
    const archive = (Array.from(result.context._artifactsById.values()) as SymbolicObject[]).find(
      (o: SymbolicObject) => o.type === 'WorldArchive'
    );
    const typedArchive = archive as WorldArchive;
    if (typedArchive?.filePath) {
      console.log(chalk.gray(`📄 Archive saved to: ${typedArchive.filePath}`));
    } else {
      console.log(chalk.gray(`📄 Archive complete, but file path not recorded.`));
    }
  }

  // Summary output
  console.log(chalk.magenta('\n📝 Simulation Summary:'));
  console.log(`- Pipeline ID: ${pipelineId}`);
  console.log(`- Run ID: ${runId}`);
  console.log(`- Final Tick: ${result.tick}`);
  console.log(`- Parameters:`);
  Object.entries(mergedParams).forEach(([key, value]) => {
    console.log(`  • ${key}: ${value}`);
  });
}

main().catch((err) => {
  console.error(chalk.red('❌ Error during simulation:'), err);
  process.exit(1);
});
