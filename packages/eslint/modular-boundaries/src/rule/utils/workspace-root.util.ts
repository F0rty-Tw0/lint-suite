import { basename, dirname, join, resolve } from 'node:path';

import { isRecord } from './guards.util.ts';
import { readTracked } from './tracked-read.util.ts';
import { ROOT_MARKERS } from '../common/modular-boundaries.const.ts';
import type {
  ParseResult,
  ReadSet
} from '../common/modular-boundaries.type.ts';

const MOON_DIRECTORY = '.moon';
const MOON_WORKSPACE = 'workspace.yml';

const hasWorkspaces = (data: unknown): boolean => {
  if (!isRecord(data)) return false;

  const { workspaces } = data;
  const isList = Array.isArray(workspaces);

  if (isList) return true;

  if (!isRecord(workspaces)) return false;

  const { packages } = workspaces;

  return Array.isArray(packages);
};

const isRootTurbo = (data: unknown): boolean => {
  if (!isRecord(data)) return false;

  return !('extends' in data);
};

const isMarkerContent = (
  name: string,
  result: ParseResult<unknown>
): boolean => {
  if (name === 'package.json') return result.ok && hasWorkspaces(result.data);

  if (name === 'turbo.json') return result.ok && isRootTurbo(result.data);

  return true;
};

/** The directory a root marker file would mark, judged by its name alone. */
export const markedDirectory = (file: string): string | undefined => {
  const directory = dirname(file);
  const name = basename(file);
  const parentName = basename(directory);
  const isMoonWorkspace =
    name === MOON_WORKSPACE && parentName === MOON_DIRECTORY;

  if (isMoonWorkspace) return dirname(directory);

  const isMarkerName = ROOT_MARKERS.includes(name);

  if (!isMarkerName) return undefined;

  return directory;
};

/**
 * Whether a marker file exists and its contents make it a marker: `package.json`
 * needs `workspaces`, `turbo.json` must not `extends`. Unparseable content of
 * either is not a marker.
 */
export const isMarkerFile = (file: string, readSet: ReadSet): boolean => {
  const result = readTracked(readSet, file);

  if (result === null) return false;

  const name = basename(file);

  return isMarkerContent(name, result);
};

export const isWorkspaceRoot = (
  directory: string,
  readSet: ReadSet
): boolean => {
  const markerFiles = ROOT_MARKERS.map((marker) => join(directory, marker));

  return markerFiles.some((file) => isMarkerFile(file, readSet));
};

export const findWorkspaceRoot = (
  directory: string,
  readSet: ReadSet
): string | undefined => {
  const current = resolve(directory);
  const isRoot = isWorkspaceRoot(current, readSet);

  if (isRoot) return current;

  const parent = dirname(current);

  if (parent === current) return undefined;

  return findWorkspaceRoot(parent, readSet);
};
