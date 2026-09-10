import { dirname } from 'node:path';

import type { Program, SourceFile } from 'typescript';

import type {
  Aggregate,
  FileEdges,
  IsExternalFile,
  ModuleResolution,
  PublicExports,
  UsageContext
} from './common/no-unused-exports.type.ts';
import { diskResolver } from './disk-resolver.ts';
import {
  buildAggregate,
  updateAggregate
} from './utils/aggregate-update.util.ts';
import { fileChanges, isIncremental } from './utils/file-changes.util.ts';
import { moduleEdges } from './utils/module-edges.util.ts';
import { publicExports } from './utils/public-exports.util.ts';
import type { GlobMatcher } from '@lint-suite/rule-internals/common/glob-matcher.type.ts';

const FILE_EDGES = new WeakMap<SourceFile, FileEdges>();

const AGGREGATES = new WeakMap<Program, Aggregate>();

const PUBLIC = new WeakMap<Aggregate, WeakMap<GlobMatcher, PublicExports>>();

const LAST_AGGREGATE = new Map<string, Aggregate>();

const projectKey = (program: Program): string => {
  const configFilePath = program.getCompilerOptions()['configFilePath'];

  if (typeof configFilePath === 'string') return configFilePath;

  const directories = program.getRootFileNames().map(dirname);
  const uniqueDirectorySet = new Set(directories);
  const uniqueDirectories = [...uniqueDirectorySet];
  const sortedDirectories = uniqueDirectories.sort();

  return sortedDirectories.join('|');
};

/**
 * Edges are cached per source file object, which an editor keeps across
 * Programs while the text is unchanged. A file with a dangling import is
 * re-read on every Program: its target may have appeared since.
 */
const fileEdges = (
  sourceFile: SourceFile,
  resolution: ModuleResolution
): FileEdges => {
  const cached = FILE_EDGES.get(sourceFile);
  const isCached = cached !== undefined;
  const isSettled = isCached && cached.dangling.length === 0;

  if (isSettled) return cached;

  const edges = moduleEdges(sourceFile, resolution);

  FILE_EDGES.set(sourceFile, edges);

  return edges;
};

const programEdges = (program: Program): Map<string, FileEdges> => {
  const checker = program.getTypeChecker();
  const isExternal: IsExternalFile = (sourceFile) =>
    program.isSourceFileFromExternalLibrary(sourceFile);
  const onDisk = diskResolver(program);
  const resolution: ModuleResolution = { checker, isExternal, onDisk };
  const byFile = new Map<string, FileEdges>();

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) continue;

    const isSourceExternal = isExternal(sourceFile);

    if (isSourceExternal) continue;

    byFile.set(sourceFile.fileName, fileEdges(sourceFile, resolution));
  }

  return byFile;
};

const nextAggregate = (
  byFile: Map<string, FileEdges>,
  previous: Aggregate | undefined
): Aggregate => {
  if (!previous) return buildAggregate(byFile);

  const changes = fileChanges(previous.byFile, byFile);
  const isPatchable = isIncremental(changes, previous.starTouched);

  if (!isPatchable) return buildAggregate(byFile);

  updateAggregate(previous, changes);
  PUBLIC.delete(previous);

  return previous;
};

export const exportIndex = (program: Program): Aggregate => {
  const cached = AGGREGATES.get(program);

  if (cached) return cached;

  const key = projectKey(program);
  const byFile = programEdges(program);
  const aggregate = nextAggregate(byFile, LAST_AGGREGATE.get(key));

  AGGREGATES.set(program, aggregate);
  LAST_AGGREGATE.set(key, aggregate);

  return aggregate;
};

export const publicExportIndex = (
  aggregate: Aggregate,
  isEntry: GlobMatcher
): PublicExports => {
  const byMatcher =
    PUBLIC.get(aggregate) ?? new WeakMap<GlobMatcher, PublicExports>();
  const cached = byMatcher.get(isEntry);

  if (cached) return cached;

  const keys = aggregate.byFile.keys();
  const fileNames = [...keys];
  const entryFiles = fileNames.filter(isEntry);
  const context: UsageContext = {
    byFile: aggregate.byFile,
    reExportsByName: aggregate.reExportsByName
  };
  const index = publicExports(context, entryFiles);

  byMatcher.set(isEntry, index);
  PUBLIC.set(aggregate, byMatcher);

  return index;
};
