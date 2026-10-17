import { join, resolve } from 'node:path';

import { isStringArray } from './guards.util.ts';
import { recordField, stringField } from './manifest-fields.util.ts';
import { readTrackedRecord } from './tracked-read.util.ts';
import type {
  ConfigError,
  JsonObject,
  PathAlias,
  ReadSet
} from '../common/modular-boundaries.type.ts';

const readRootTsconfig = (
  root: string,
  readSet: ReadSet,
  errors: ConfigError[]
): JsonObject => {
  const basePath = join(root, 'tsconfig.base.json');
  const base = readTrackedRecord(readSet, basePath, errors);
  const baseRead = readSet.get(basePath);
  const isBaseMissing = baseRead === null;

  if (!isBaseMissing) return base;

  const path = join(root, 'tsconfig.json');

  return readTrackedRecord(readSet, path, errors);
};

/**
 * `compilerOptions.paths` of the root `tsconfig.base.json`, else root
 * `tsconfig.json` (`extends` not followed). Each key maps to its first target,
 * resolved against `baseUrl` (relative to the root) or the root; `*` is kept.
 */
export const readPathAliases = (
  root: string,
  readSet: ReadSet,
  errors: ConfigError[]
): PathAlias[] => {
  const tsconfig = readRootTsconfig(root, readSet, errors);
  const compilerOptions = recordField(tsconfig, 'compilerOptions');
  const paths = recordField(compilerOptions, 'paths') ?? {};
  const baseUrl = stringField(compilerOptions, 'baseUrl') ?? '.';
  const directory = resolve(root, baseUrl);
  const toAlias = ([pattern, targets]: [string, unknown]): PathAlias[] => {
    const noTargets: string[] = [];
    const [first] = isStringArray(targets) ? targets : noTargets;

    if (first === undefined) return [];

    const target = resolve(directory, first);
    const alias: PathAlias = { pattern, target };

    return [alias];
  };
  const entries = Object.entries(paths);

  return entries.flatMap(toAlias);
};
