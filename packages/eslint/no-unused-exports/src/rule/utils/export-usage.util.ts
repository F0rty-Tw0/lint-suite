import { STAR_NAME } from '../common/no-unused-exports.const.ts';
import type {
  ReExportEdge,
  ReExportIndex,
  UsageContext,
  UsageKey,
  UsageWalk
} from '../common/no-unused-exports.type.ts';

const MAX_DEPTH = 50;

export const reExportIndex = (
  byFile: UsageContext['byFile']
): ReExportIndex => {
  const index: ReExportIndex = new Map();

  for (const [fileName, edges] of byFile) {
    const names = new Map<string, ReExportEdge>();

    for (const edge of edges.reExports) {
      names.set(edge.exported, edge);
    }

    index.set(fileName, names);
  }

  return index;
};

const push = (walk: UsageWalk, fileName: string, name: string): void => {
  const key: UsageKey = { fileName, name };

  walk.keys.push(key);
};

const deeper = (walk: UsageWalk): UsageWalk => {
  const next: UsageWalk = {
    visited: walk.visited,
    depth: walk.depth + 1,
    keys: walk.keys
  };

  return next;
};

const isNewStep = (walk: UsageWalk, key: string): boolean => {
  if (walk.depth > MAX_DEPTH) return false;

  const isVisited = walk.visited.has(key);

  if (isVisited) return false;

  walk.visited.add(key);

  return true;
};

const markName = (
  context: UsageContext,
  fileName: string,
  name: string,
  walk: UsageWalk
): void => {
  const isNew = isNewStep(walk, `${fileName} ${name}`);

  if (!isNew) return;

  const edges = context.byFile.get(fileName);

  if (!edges) return;

  push(walk, fileName, name);

  const reExport = context.reExportsByName.get(fileName)?.get(name);

  if (reExport) {
    markName(context, reExport.target, reExport.source, deeper(walk));
  }

  const isDeclaredLocally = edges.declared.has(name);

  if (isDeclaredLocally) return;

  for (const target of edges.starTargets) {
    markName(context, target, name, deeper(walk));
  }
};

const markAll = (
  context: UsageContext,
  fileName: string,
  walk: UsageWalk
): void => {
  const isNew = isNewStep(walk, `${fileName} ${STAR_NAME}`);

  if (!isNew) return;

  const edges = context.byFile.get(fileName);

  if (!edges) return;

  for (const name of edges.exports) {
    push(walk, fileName, name);
  }

  for (const edge of edges.reExports) {
    markName(context, edge.target, edge.source, deeper(walk));
  }

  for (const target of edges.starTargets) {
    markAll(context, target, deeper(walk));
  }
};

export const markUsage = (
  context: UsageContext,
  target: string,
  name: string
): UsageKey[] => {
  const keys: UsageKey[] = [];
  const walk: UsageWalk = { visited: new Set(), depth: 0, keys };

  if (name === STAR_NAME) {
    markAll(context, target, walk);

    return keys;
  }

  markName(context, target, name, walk);

  return keys;
};
