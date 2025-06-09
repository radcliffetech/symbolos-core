import type { SymbolicObject } from './object';
export type SymbolicLink = SymbolicObject & {
  type: 'SymbolicLink';
  fromId: string;
  toId: string;
  relationship: string;
  label?: string;
  description?: string;
  createdAt: string;
  metadata?: Record<string, any>;
};
