import {
  PipelineArgs,
  conwayGame,
  createNewWorldInstance,
  createSymbolicObject,
  runGen2WorldSimulation,
} from "../src";

const pipelineArgs = createSymbolicObject<PipelineArgs>("PipelineArgs", {
  params: {
    steps: 20,
    seedPattern: "glider",
    width: 9,
    height: 9,
  },
});

const newWorld = await runGen2WorldSimulation({
  world: createNewWorldInstance("poc-conway"),
  steps: conwayGame.getSteps(pipelineArgs),
  pipelineArgs,
  simulatorConfig: {
    verbose: true,
  },
  frameHandler: (world) => {
    // Optionally handle each frame, e.g., log or modify the world
    console.log(
      `🔄 Frame at tick ${world.tick} with ${world.artifacts.size} artifacts.`
    );
    return world;
  },
});
console.log(`✅ Simulation completed. Final tick: ${newWorld.tick}`);
console.log(`🔢 World contains ${newWorld.artifacts.size} symbolic objects.`);
