import { dirname } from 'node:path';

import { parse } from 'postcss-scss';

import { collectStylesheet } from './stylesheet-collection.ts';
import { resolveStylesheetImport } from './stylesheet-imports.ts';
import { createFileCache, readCached } from '../../file-cache.ts';
import { classMatcher } from '../../selector-classes.ts';
import { toRegExp } from '../../utils/to-regexp.util.ts';
import type {
  StylesheetClasses,
  StylesheetEntry,
  StylesheetSource
} from '../common/no-unstyled-classes.type.ts';

type MergedChain = {
  readonly chain: StylesheetEntry[];
  readonly classes: StylesheetClasses;
};

const EMPTY_ENTRY: StylesheetEntry = { classes: [], patterns: [], imports: [] };

const stylesheets = createFileCache<StylesheetEntry>('stylesheets');
const inlineStylesheets = new Map<string, StylesheetEntry>();
const merged = new Map<string, MergedChain>();

const parseStylesheet = (source: string, path: string): StylesheetEntry => {
  try {
    return collectStylesheet(parse(source, { from: path }));
  } catch {
    return EMPTY_ENTRY;
  }
};

const fileEntry = (path: string): StylesheetEntry => {
  return readCached(stylesheets, path, parseStylesheet) ?? EMPTY_ENTRY;
};

const inlineEntry = (source: string, path: string): StylesheetEntry => {
  const key = `${path}\0${source}`;
  const cached = inlineStylesheets.get(key);

  if (cached !== undefined) return cached;

  const entry = parseStylesheet(source, path);

  inlineStylesheets.set(key, entry);

  return entry;
};

const collectImports = (
  entry: StylesheetEntry,
  directory: string,
  chain: StylesheetEntry[],
  visited: Set<string>
): void => {
  for (const specifier of entry.imports) {
    const imported = resolveStylesheetImport(specifier, directory);

    if (imported === null) continue;

    const isVisited = visited.has(imported);

    if (isVisited) continue;

    visited.add(imported);

    const importedEntry = fileEntry(imported);

    chain.push(importedEntry);
    collectImports(importedEntry, dirname(imported), chain, visited);
  }
};

const entryOf = (source: StylesheetSource): StylesheetEntry => {
  if (source.kind === 'file') return fileEntry(source.path);

  return inlineEntry(source.source, source.path);
};

const collectChain = (
  source: StylesheetSource,
  chain: StylesheetEntry[],
  visited: Set<string>
): void => {
  if (source.kind === 'file') {
    const isVisited = visited.has(source.path);

    if (isVisited) return;

    visited.add(source.path);
  }

  const entry = entryOf(source);

  chain.push(entry);
  collectImports(entry, dirname(source.path), chain, visited);
};

const mergeChain = (chain: StylesheetEntry[]): StylesheetClasses => {
  const exact = new Set<string>();
  const patterns: string[] = [];

  for (const entry of chain) {
    for (const name of entry.classes) exact.add(name);

    patterns.push(...entry.patterns);
  }

  const compiled = patterns.map(toRegExp);
  const has = classMatcher(exact, compiled);
  const size = exact.size + compiled.length;
  const classes: StylesheetClasses = { has, size };

  return classes;
};

const isCurrentChain = (
  cached: MergedChain | undefined,
  chain: StylesheetEntry[]
): cached is MergedChain => {
  if (cached === undefined) return false;

  if (cached.chain.length !== chain.length) return false;

  return cached.chain.every((entry, position) => entry === chain[position]);
};

const sourceKey = (source: StylesheetSource): string => {
  if (source.kind === 'file') return source.path;

  return `${source.path}\0${source.source}`;
};

const keyOf = (sources: StylesheetSource[]): string => {
  return sources.map(sourceKey).join('\n');
};

export const stylesheetClasses = (
  sources: StylesheetSource[]
): StylesheetClasses => {
  const chain: StylesheetEntry[] = [];
  const visited = new Set<string>();

  for (const source of sources) collectChain(source, chain, visited);

  const key = keyOf(sources);
  const cached = merged.get(key);

  if (isCurrentChain(cached, chain)) return cached.classes;

  const classes = mergeChain(chain);
  const fresh: MergedChain = { chain, classes };

  merged.set(key, fresh);

  return classes;
};
