import {
  createSymbolicObject,
  type SymbolicObject,
  type WorldArchive,
  type WorldFrame,
  type WorldInstance,
} from "../index";

import chalk from "chalk";

const summarizeWorldFrame = (world: WorldFrame, members: SymbolicObject[]) => {
  const total = members.length;
  const typeCounts = members.reduce(
    (acc: Record<string, number>, item: any) => {
      const type = item.type ?? "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {}
  );
  console.log(
    chalk.bold(`\n🌍 Symbolic World Summary: ${chalk.cyan(world.id)}`)
  );
  console.log(`📝 Description: ${world.description || "—"}`);
  console.log(`🆔 ID: ${world.id}`);
  console.log(`📅 Created: ${world.createdAt}`);
  console.log(`📦 Members: ${total}`);
  console.log("\n📊 Type Breakdown:");
  Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  - ${chalk.green(type)}: ${count}`);
    });
};

export const summaryHelper = {
  WorldFrame: summarizeWorldFrame,
  WorldArchive: (world: WorldArchive) => {
    console.log(
      chalk.bold(`\n🌍 Symbolic World Archive Summary: ${chalk.cyan(world.id)}`)
    );
    console.log(`📝 Description: ${world.description || "—"}`);
    console.log(`🆔 ID: ${world.id}`);
    console.log(`📅 Created: ${world.createdAt}`);
    console.log(`📦 Members: ${world.memberIds?.length || 0}`);
    console.log(`📂 File Path: ${world.filePath || "—"}`);
    console.log("");
  },
  WorldInstance: (world: WorldInstance) => {
    console.log(
      chalk.bold(
        `\n🌍 Symbolic World Instance Summary: ${chalk.cyan(world.runId)}`
      )
    );
    console.log(`📝 Pipeline ID: ${chalk.cyan(world.pipelineId)}`);
    console.log(`🆔 Run ID: ${chalk.cyan(world.runId)}`);
    console.log(`⏱️ Tick: ${chalk.cyan(world.tick)}`);
    console.log(`🔢 Step: ${chalk.cyan(world.step)}`);
    console.log(
      `📦 Artifacts: ${chalk.cyan(world.artifacts.size.toLocaleString())}`
    );
    console.log(
      `📅 Context Keys: ${chalk.cyan(Object.keys(world.context).length)}`
    );
    console.log(
      `🔗 Context Keys: ${chalk.cyan(Object.keys(world.context).join(", "))}`
    );
    console.log("");
    // get a count of artifacts by type
    const typeCounts = Array.from(world.artifacts.values()).reduce(
      (acc: Record<string, number>, artifact: any) => {
        const type = artifact.type ?? "Unknown";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {}
    );
    console.log("📊 Artifact Type Breakdown:");
    Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  - ${chalk.cyan(type)}: ${count.toLocaleString()}`);
      });
    console.log("");
  },
} as const;

export function printSimulationSummary(
  worldOutput: WorldInstance,
  pipelineId: string,
  runId: string,
  mergedParams: Record<string, any>
) {
  console.log(
    chalk.green(
      `[symbolos] ✅ Simulation completed! Final tick: ${worldOutput.tick}`
    )
  );

  console.log(
    chalk.magenta(
      "\n[symbolos] 📝 Simulation Summary:\n" +
        `\n- Pipeline ID: ${pipelineId}` +
        `\n- Run ID: ${runId}` +
        `\n- Final Tick: ${worldOutput.tick}` +
        `\n- Parameters:`
    )
  );
  if (Object.keys(mergedParams).length === 0) {
    console.log(chalk.gray("  No parameters provided."));
  } else {
    Object.entries(mergedParams).forEach(([key, value]) =>
      console.log(chalk.magenta(`  - ${key}: ${value}`))
    );
  }
}

/**
 *
 * Converts a WorldInstance to a WorldFrame symbolic object.
 * This is useful for archiving or storing the world state.
 */
export function toWorldFrame(world: WorldInstance): WorldFrame {
  return createSymbolicObject("WorldFrame", {
    description: `World frame for tick ${world.tick}`,
    id: `frame-${world.tick}`,
    tick: world.tick,
    step: world.step,
    runId: world.runId,
    pipelineId: world.pipelineId,
    members: Array.from(world.artifacts.values()),
    metadata: {
      artifactCount: world.artifacts.size,
    },
  });
}
