import { isRecord, isStringArray } from './guards.util.ts';

import type { JsonObject } from '../common/modular-boundaries.type.ts';

const field = (record: JsonObject, key: string): unknown => {
  return record?.[key];
};

/** A non-empty string field, else `undefined`. */
export const stringField = (
  record: JsonObject,
  key: string
): string | undefined => {
  const value = field(record, key);
  const isName = typeof value === 'string' && value !== '';

  return isName ? value : undefined;
};

export const stringArrayField = (record: JsonObject, key: string): string[] => {
  const value = field(record, key);

  return isStringArray(value) ? value : [];
};

export const recordField = (record: JsonObject, key: string): JsonObject => {
  const value = field(record, key);

  return isRecord(value) ? value : undefined;
};
