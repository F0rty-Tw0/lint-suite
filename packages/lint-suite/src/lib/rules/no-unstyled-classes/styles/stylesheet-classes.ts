import { readFileSync, statSync } from 'node:fs';
import { dirname } from 'node:path';

import { parse } from 'postcss-scss';

import { collectStylesheet } from './stylesheet-collection.ts';
import { classMatcher } from '../../utils/selector-classes.util.ts';
import type {
  StylesheetClasses,
  StylesheetEntry,
  StylesheetSource
} from '../common/no-unstyled-classes.type.ts';

type CachedStylesheet = {
  readonly entry: StylesheetEntry;
  readonly version: string;
};

type ClassSink = {
  readonly exact: Set<string>;
  readonly patterns: string[];
};

const stylesheets = new Map<string, CachedStylesheet>();

const emptyEntry = (): StylesheetEntry => {
  const entry: StylesheetEntry = { classes: [], patterns: [], imports: [] };

  return entry;
};

const parseStylesheet = (source: string, path: string): StylesheetEntry => {
  try {
    const root = parse(source, { from: path });

    return collectStylesheet(root, dirname(path));
  } catch {
    return emptyEntry();
  }
};

const fileEntry = (path: string): StylesheetEntry => {
  try {
    const stats = statSync(path, { bigint: true });
    const version = `${stats.mtimeNs}:${stats.size}`;
    const cached = stylesheets.get(path);

    if (cached?.version === version) return cached.entry;

    const entry = parseStylesheet(readFileSync(path, 'utf8'), path);
    const fresh: CachedStylesheet = { entry, version };

    stylesheets.set(path, fresh);

    return entry;
  } catch {
    return emptyEntry();
  }
};

const addEntry = (
  entry: StylesheetEntry,
  sink: ClassSink,
  visited: Set<string>
): void => {
  for (const name of entry.classes) sink.exact.add(name);

  sink.patterns.push(...entry.patterns);

  for (const imported of entry.imports) {
    const isVisited = visited.has(imported);

    if (isVisited) continue;

    visited.add(imported);
    addEntry(fileEntry(imported), sink, visited);
  }
};

const addSource = (
  source: StylesheetSource,
  sink: ClassSink,
  visited: Set<string>
): void => {
  if (source.kind === 'file') {
    const isVisited = visited.has(source.path);

    if (isVisited) return;

    visited.add(source.path);
    addEntry(fileEntry(source.path), sink, visited);

    return;
  }

  addEntry(parseStylesheet(source.source, source.path), sink, visited);
};

const toRegExp = (pattern: string): RegExp => {
  return new RegExp(pattern, 'u');
};

export const stylesheetClasses = (
  sources: StylesheetSource[]
): StylesheetClasses => {
  const exact = new Set<string>();
  const patterns: string[] = [];
  const sink: ClassSink = { exact, patterns };
  const visited = new Set<string>();

  for (const source of sources) addSource(source, sink, visited);

  const compiled = patterns.map(toRegExp);
  const has = classMatcher(exact, compiled);
  const size = exact.size + compiled.length;
  const classes: StylesheetClasses = { has, size };

  return classes;
};
