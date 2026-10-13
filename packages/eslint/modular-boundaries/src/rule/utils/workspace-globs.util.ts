import { basename, dirname, relative } from 'node:path';

import { compileGlobs } from '@lint-suite/rule-internals/utils/glob-matcher.util.ts';

import type { GlobMatcher } from '@lint-suite/rule-internals/common/glob-matcher.type.ts';

import type {
  DiscoveredRoot,
  WorkspaceListing
} from '../common/modular-boundaries.type.ts';

const LEADING_DOT_SLASH = /^\.\//u;
const TRAILING_SLASHES = /\/+$/u;

const matchesNothing: GlobMatcher = (): boolean => false;

export const normalizeEntry = (entry: string): string => {
  const withoutPrefix = entry.replace(LEADING_DOT_SLASH, '');

  return withoutPrefix.replace(TRAILING_SLASHES, '');
};

const compileEntries = (entries: string[]): GlobMatcher => {
  if (entries.length === 0) return matchesNothing;

  const patterns = entries.map(normalizeEntry);

  return compileGlobs(patterns);
};

const workspaceMatcher = (entries: string[]): GlobMatcher => {
  const includes = entries.filter((entry) => !entry.startsWith('!'));
  const negated = entries.filter((entry) => entry.startsWith('!'));
  const excludes = negated.map((entry) => entry.slice(1));
  const isIncluded = compileEntries(includes);
  const isExcluded = compileEntries(excludes);
  const matches = (path: string): boolean => {
    const isIncludedPath = isIncluded(path);
    const isExcludedPath = isExcluded(path);

    return isIncludedPath && !isExcludedPath;
  };

  return matches;
};

export const manifestDirectories = (
  listing: WorkspaceListing,
  name: string
): string[] => {
  const isNamed = (file: string): boolean => basename(file) === name;
  const manifests = listing.manifests.filter(isNamed);

  return manifests.map((file) => dirname(file));
};

export const toRoot = (root: string): DiscoveredRoot => {
  const discovered: DiscoveredRoot = { root };

  return discovered;
};

/**
 * Roots among `directories` whose path relative to `root` matches the workspace
 * glob `entries`. `!` entries exclude; an empty include list matches nothing.
 */
export const globRoots = (
  root: string,
  directories: string[],
  entries: string[]
): DiscoveredRoot[] => {
  const matches = workspaceMatcher(entries);
  const isMatch = (directory: string): boolean => {
    const path = relative(root, directory);

    return matches(path);
  };

  return directories.filter(isMatch).map(toRoot);
};
