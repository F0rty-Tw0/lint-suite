import {
  createFileCache,
  readCached
} from '@lint-suite/rule-internals/file-cache.ts';

import { parserFor } from './parse-config.util.ts';

import type {
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
