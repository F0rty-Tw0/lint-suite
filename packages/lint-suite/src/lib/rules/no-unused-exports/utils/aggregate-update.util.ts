import { markUsage, reExportIndex } from './export-usage.util.ts';
import { STAR_NAME } from '../common/no-unused-exports.const.ts';
import type {
  Aggregate,
  ExportUsage,
  FileChange,
  FileContribution,
  FileEdges,
  UsageContext,
  UsageKey
} from '../common/no-unused-exports.type.ts';

const countDelta = (
  counts: Map<string, number>,
  key: string,
  delta: number
): void => {
  const current = counts.get(key);
  const next = (current ?? 0) + delta;

  if (next > 0) {
    counts.set(key, next);

    return;
  }

  counts.delete(key);
};

const usageDelta = (
  usage: ExportUsage,
  key: UsageKey,
  delta: number
): void => {
  const existing = usage.get(key.fileName);
  const names = existing ?? new Map<string, number>();
  const current = names.get(key.name);
  const next = (current ?? 0) + delta;

  if (next > 0) names.set(key.name, next);
  else names.delete(key.name);

  if (names.size > 0) usage.set(key.fileName, names);
  else usage.delete(key.fileName);
};

const fileContribution = (
  context: UsageContext,
  edges: FileEdges
): FileContribution => {
  const usage: UsageKey[] = [];
  const imported: string[] = [];
  const starTouched: string[] = [];

  for (const edge of edges.imports) {
    imported.push(edge.target);

    for (const name of edge.names) {
      if (name === STAR_NAME) starTouched.push(edge.target);

      const keys = markUsage(context, edge.target, name);

      for (const key of keys) usage.push(key);
    }
  }

  for (const edge of edges.reExports) {
    imported.push(edge.target);
    starTouched.push(edge.target);
  }

  for (const target of edges.starTargets) {
    imported.push(target);
    starTouched.push(target);
  }

  const contribution: FileContribution = { usage, imported, starTouched };

  return contribution;
};

const applyContribution = (
  aggregate: Aggregate,
  contribution: FileContribution,
  delta: number
): void => {
  for (const key of contribution.usage) {
    usageDelta(aggregate.usage, key, delta);
  }

  for (const target of contribution.imported) {
    countDelta(aggregate.imported, target, delta);
  }

  for (const target of contribution.starTouched) {
    countDelta(aggregate.starTouched, target, delta);
  }
};

const contextOf = (aggregate: Aggregate): UsageContext => {
  const context: UsageContext = {
    byFile: aggregate.byFile,
    reExportsByName: aggregate.reExportsByName
  };

  return context;
};

const addFile = (aggregate: Aggregate, edges: FileEdges): void => {
  const context = contextOf(aggregate);
  const contribution = fileContribution(context, edges);

  aggregate.contributions.set(edges.fileName, contribution);
  applyContribution(aggregate, contribution, 1);
};

export const buildAggregate = (byFile: Map<string, FileEdges>): Aggregate => {
  const aggregate: Aggregate = {
    byFile,
    usage: new Map(),
    imported: new Map(),
    reExportsByName: reExportIndex(byFile),
    contributions: new Map(),
    starTouched: new Map()
  };

  for (const edges of byFile.values()) {
    addFile(aggregate, edges);
  }

  return aggregate;
};

const dropFile = (aggregate: Aggregate, fileName: string): void => {
  const contribution = aggregate.contributions.get(fileName);

  if (!contribution) return;

  applyContribution(aggregate, contribution, -1);
  aggregate.contributions.delete(fileName);
};

const replaceEdges = (aggregate: Aggregate, change: FileChange): void => {
  if (!change.after) {
    aggregate.byFile.delete(change.fileName);
    aggregate.reExportsByName.delete(change.fileName);

    return;
  }

  aggregate.byFile.set(change.fileName, change.after);
  aggregate.reExportsByName.set(change.fileName, new Map());
};

export const updateAggregate = (
  aggregate: Aggregate,
  changes: FileChange[]
): void => {
  for (const change of changes) {
    dropFile(aggregate, change.fileName);
    replaceEdges(aggregate, change);
  }

  for (const change of changes) {
    if (change.after) addFile(aggregate, change.after);
  }
};
