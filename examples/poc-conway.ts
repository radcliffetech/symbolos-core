import {
  PipelineArgs,
  conwayGame,
  createSymbolicObject,
  makeNewWorld,
  runWorldPipeline,
} from "../src";

const pipelineArgs = createSymbolicObject<PipelineArgs>("PipelineArgs", {
  params: {
    steps: 20,
    seedPattern: "glider",
    width: 9,
    height: 9,
  },
});

const newWorld = await runWorldPipeline({
  world: makeNewWorld("poc-conway"),
  steps: conwayGame.getSteps(pipelineArgs),
  pipelineArgs,
  config: {
    verbose: true,
    outputRoot: "./sandbox",
    archiveDirName: "conway-archive",
    compress: true,
  },
});
console.log(`✅ Simulation completed. Final tick: ${newWorld.tick}`);
console.log(`🔢 World contains ${newWorld.artifacts.size} symbolic objects.`);
