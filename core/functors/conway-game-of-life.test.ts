import { InitializeConwayCells, StepConwayCells } from './conway-game-of-life';
import { describe, expect, it } from 'vitest';

describe('InitializeConwayCells', () => {
  it('creates a constellation with cells matching seed pattern', async () => {
    const result = await InitializeConwayCells.apply({
      width: 5,
      height: 5,
      seedPattern: 'glider',
    });

    expect(result.type).toBe('Constellation');
    expect(result.objects.length).toBe(25); // 5x5 grid
    const aliveCount = result.objects.filter((obj) => obj.status === 'alive').length;
    expect(aliveCount).toBeGreaterThan(0);
  });
});

describe('StepConwayCells', () => {
  it('produces a new constellation with same shape', async () => {
    const initial = await InitializeConwayCells.apply({
      width: 5,
      height: 5,
      seedPattern: 'glider',
    });

    const result = await StepConwayCells.apply({
      constellation: initial,
      step: 1,
    });

    expect(result.objects.length).toBe(25); // 5x5 grid should persist
    expect(result.objects[0].tick).toBe(1);
  });
});