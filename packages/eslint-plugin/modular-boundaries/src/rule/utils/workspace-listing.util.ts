import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { basename, extname, join, relative, resolve, sep } from 'node:path';

import { compileGlobs } from '@lint-suite/rule-internals/utils/glob-matcher.util.ts';

import {
  MANIFEST_NAMES,
  SOURCE_EXTENSIONS
} from '../common/modular-boundaries.const.ts';
import { readTracked } from './tracked-read.util.ts';
import { isMarkerFile, markedDirectory } from './workspace-root.util.ts';

import type { GlobMatcher } from '@lint-suite/rule-internals/common/glob-matcher.type.ts';
import type { Dirent } from 'node:fs';

import type {
  ReadSet,
  WorkspaceListing
} from '../common/modular-boundaries.type.ts';

const GIT_LIST_ARGS = [
  'ls-files',
  '-z',
  '--cached',
  '--others',
  '--exclude-standard'
];
// The 1 MiB spawnSync default overflows on large repositories.
const GIT_MAX_BUFFER = 512 * 1024 * 1024;
const SKIPPED_DIRECTORIES = new Set(['node_modules', '.git']);
const EDGE_SLASHES = /^\/+|\/+$/gu;

const gitFiles = (root: string): string[] | undefined => {
  const result = spawnSync('git', GIT_LIST_ARGS, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: GIT_MAX_BUFFER
  });
  const hasFailed = result.error !== undefined || result.status !== 0;

  if (hasFailed) return undefined;

  const paths = result.stdout.split('\0');

  return paths.filter((path) => path !== '');
};

const isWalkedDirectory = (entry: Dirent): boolean => {
  return entry.isDirectory() && !SKIPPED_DIRECTORIES.has(entry.name);
};

const walkFiles = (root: string, directory: string = root): string[] => {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isFile()) files.push(relative(root, path));

    const isWalked = isWalkedDirectory(entry);

    if (isWalked) files.push(...walkFiles(root, path));
  }

  return files;
};

const isStringArray = (value: unknown): value is string[] => {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
};

const ignorePatterns = (line: string): string[] => {
  const base = line.replaceAll(EDGE_SLASHES, '');

  return [base, `${base}/**`];
};

const nxIgnoreMatcher = (
  root: string,
  readSet: ReadSet
): GlobMatcher | undefined => {
  const result = readTracked(readSet, join(root, '.nxignore'));

  if (result === null || !result.ok) return undefined;
  if (!isStringArray(result.data)) return undefined;

  const patterns = result.data.flatMap(ignorePatterns);

  if (patterns.length === 0) return undefined;

  return compileGlobs(patterns);
};

const withoutIgnored = (
  paths: string[],
  isIgnored: GlobMatcher | undefined
): string[] => {
  if (isIgnored === undefined) return paths;

  return paths.filter((path) => !isIgnored(path));
};

const nestedRoots = (
  root: string,
  files: string[],
  readSet: ReadSet
): string[] => {
  const roots: string[] = [];

  for (const file of files) {
    const directory = markedDirectory(file);

    if (directory === undefined || directory === root) continue;

    const isMarker = isMarkerFile(file, readSet);

    if (isMarker) roots.push(directory);
  }

  return roots;
};

const isUnderAny = (file: string, directories: string[]): boolean => {
  return directories.some((directory) => file.startsWith(directory + sep));
};

const splitListing = (root: string, files: string[]): WorkspaceListing => {
  const rootTurbo = join(root, 'turbo.json');
  const listing: WorkspaceListing = {
    manifests: [],
    packageTurboFiles: [],
    sourceFiles: []
  };

  for (const file of files) {
    const name = basename(file);
    const extension = extname(name);
    const isManifest = MANIFEST_NAMES.includes(name);
    const isPackageTurbo = name === 'turbo.json' && file !== rootTurbo;
    const isSourceFile = SOURCE_EXTENSIONS.includes(extension);

    if (isManifest) listing.manifests.push(file);
    if (isPackageTurbo) listing.packageTurboFiles.push(file);
    if (isSourceFile) listing.sourceFiles.push(file);
  }

  return listing;
};

/**
 * Lists the workspace's candidate files: `git ls-files` (walk fallback outside
 * git), minus `.nxignore` matches and nested workspace roots. Every path is
 * `path.resolve(root, p)`, so it equals ESLint's native filename.
 */
export const listWorkspaceFiles = (
  root: string,
  readSet: ReadSet
): WorkspaceListing => {
  const base = resolve(root);
  const listed = gitFiles(base) ?? walkFiles(base);
  const isIgnored = nxIgnoreMatcher(base, readSet);
  const kept = withoutIgnored(listed, isIgnored);
  const candidates = kept.map((path) => resolve(base, path));
  const nested = nestedRoots(base, candidates, readSet);
  const files = candidates.filter((file) => !isUnderAny(file, nested));

  return splitListing(base, files);
};
