import type { MissingTable } from '../common/missing.type.ts';

export const MISSING_TABLE_STUB: MissingTable = {
  causes: new Map(),
  deviations: new Set(),
  scopes: new Map(),
  duplicates: new Map()
};
