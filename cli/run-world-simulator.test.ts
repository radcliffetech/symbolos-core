import { expect, test } from 'vitest';

import { execa } from 'execa';
import path from 'path';

test('CLI runs with conway-game pipeline', async () => {
  const cliPath = path.resolve(__dirname, 'run-world-simulator.ts');

  const subprocess = await execa('tsx', [cliPath, '--pipelineId=conway-game-of-life'], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  expect(subprocess.exitCode).toBe(0);
  expect(subprocess.stdout).toContain('✅ Simulation completed');
});


test('CLI fails with invalid pipeline ID', async () => {
  const cliPath = path.resolve(__dirname, 'run-world-simulator.ts');

  try {
    await execa('tsx', [cliPath, '--pipelineId=not-a-real-pipeline'], {
      stdout: 'pipe',
      stderr: 'pipe',
    });
    throw new Error('Expected CLI to fail, but it succeeded');
  } catch (err: any) {
    expect(err.exitCode).not.toBe(0);
    expect(err.stderr).toContain('❌ Pipeline with ID "not-a-real-pipeline" not found');
  }
});