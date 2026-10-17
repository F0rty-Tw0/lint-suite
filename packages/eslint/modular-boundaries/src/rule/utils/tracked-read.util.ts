import {
  createFileCache,
  readCached
} from '@lint-suite/rule-internals/file-cache.ts';

import { isRecord } from './guards.util.ts';
import { parserFor } from './parse-config.util.ts';
import type {
  ConfigError,
  JsonObject,
  ParseResult,
  ReadSet
} from '../common/modular-boundaries.type.ts';

const configCache = createFileCache<ParseResult<unknown>>(
  'modular-boundaries-config'
);

/** Reads a config file through the shared cache and records the result (`null` = missing) in `readSet`. */
export const readTracked = (
  readSet: ReadSet,
  path: string
): ParseResult<unknown> | null => {
  const parser = parserFor(path);
  const value = readCached(configCache, path, parser);

  readSet.set(path, value);

  return value;
};

/** Parsed data of a config file: `undefined` when missing or malformed (a malformed file also adds a `ConfigError`). */
export const readTrackedData = (
  readSet: ReadSet,
  path: string,
  errors: ConfigError[]
): unknown => {
  const result = readTracked(readSet, path);

  if (result === null) return undefined;

  if (result.ok) return result.data;

  const error: ConfigError = { file: path, message: result.message };

  errors.push(error);

  return undefined;
};

/**
 * Reads a config file as an object: `undefined` when missing or malformed (a
 * malformed file also adds a `ConfigError` to `errors`), `{}` for non-object content.
 */
export const readTrackedRecord = (
  readSet: ReadSet,
  path: string,
  errors: ConfigError[]
): JsonObject => {
  const result = readTracked(readSet, path);

  if (result === null) return undefined;

  if (!result.ok) {
    const error: ConfigError = { file: path, message: result.message };

    errors.push(error);

    return undefined;
  }

  if (isRecord(result.data)) return result.data;

  const empty: JsonObject = {};

  return empty;
};
