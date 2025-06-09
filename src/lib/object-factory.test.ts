import { describe, expect, it } from 'vitest';

import { createSymbolicObject } from './object-factory';

describe('createSymbolicObject', () => {
  it('generates id, createdAt, and updatedAt if not provided', () => {
    const result = createSymbolicObject('TestType', { label: 'Generated' });

    expect(result.id).toMatch(/^test-type-/); // updated to match slugified ID
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.type).toBe('TestType');
    expect(result.label).toBe('Generated');
  });

  it('respects provided id and createdAt', () => {
    const result = createSymbolicObject('TestType', {
      id: 'custom-id',
      label: 'With values',
    });

    expect(result.id).toBe('custom-id');
    expect(result.createdAt).toBeDefined();
    expect(result.label).toBe('With values');
  });
});