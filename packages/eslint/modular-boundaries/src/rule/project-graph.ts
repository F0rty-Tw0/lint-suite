import { isDeepStrictEqual } from 'node:util';

import {
  createFileCache,
  readCached
} from '@lint-suite/rule-internals/file-cache.ts';

import type {
  Project,
  RawGraph,
  WorkspaceModel
} from './common/modular-boundaries.type.ts';
import {
  breadthFirstParents,
  pathBetween,
  prunedAdjacency,
  reverseAdjacency
} from './utils/project-adjacency.util.ts';
import { resolveTarget } from './utils/resolve-target.util.ts';
import { extractSpecifiers } from './utils/specifiers.util.ts';
import { projectForFile } from './workspace-model.ts';

type PrunedGraph = {
  readonly adjacency: Map<Project, Set<Project>>;
  readonly reverse: Map<Project, Set<Project>>;
  readonly reachersBySource: Map<Project, Set<Project>>;
};

const specifierCache = createFileCache<string[]>(
  'modular-boundaries-specifiers'
);
const graphs = new WeakMap<WorkspaceModel, RawGraph>();
const prunedGraphs = new WeakMap<RawGraph, Map<string, PrunedGraph>>();

const readSpecifiers = (file: string): string[] | null => {
  return readCached(specifierCache, file, (text) => extractSpecifiers(text));
};

const edgeTargets = (
  model: WorkspaceModel,
  file: string,
  source: Project,
  specifiers: string[]
): Project[] => {
  const targets: Project[] = [];

  for (const specifier of specifiers) {
    const target = resolveTarget(specifier, file, model, undefined);
    const isOtherProject =
      target.kind === 'project' && target.project !== source;

    if (isOtherProject) targets.push(target.project);
  }

  return targets;
};

const buildGraph = (model: WorkspaceModel): RawGraph => {
  const adjacency = new Map<Project, Set<Project>>();
  const specifierRefs = new Map<string, unknown>();

  for (const project of model.projects) adjacency.set(project, new Set());

  for (const file of model.listing.sourceFiles) {
    const source = projectForFile(model, file);

    if (source === undefined) continue;

    const specifiers = readSpecifiers(file);

    const edges = adjacency.get(source) ?? new Set<Project>();
    const targets = edgeTargets(model, file, source, specifiers ?? []);

    specifierRefs.set(file, specifiers);
    adjacency.set(source, edges);

    for (const target of targets) edges.add(target);
  }

  const sourceFiles = model.listing.sourceFiles.toSorted();
  const { validation } = model;
  const graph: RawGraph = {
    adjacency,
    sourceFiles,
    specifierRefs,
    validation
  };

  graphs.set(model, graph);

  return graph;
};

const isGraphChanged = (graph: RawGraph, model: WorkspaceModel): boolean => {
  const sourceFiles = model.listing.sourceFiles.toSorted();
  const isSameList = isDeepStrictEqual(sourceFiles, graph.sourceFiles);
  const refs = [...graph.specifierRefs];
  const isChangedRef = ([file, ref]: [string, unknown]): boolean => {
    return readSpecifiers(file) !== ref;
  };

  return !isSameList || refs.some(isChangedRef);
};

/**
 * The raw import graph between the model's projects, cached per model. Once
 * the model was revalidated, the graph is rebuilt when the source file list or
 * any source file's specifiers changed; otherwise its `validation` advances.
 */
export const projectGraphFor = (model: WorkspaceModel): RawGraph => {
  const cached = graphs.get(model);

  if (cached === undefined) return buildGraph(model);

  if (cached.validation.at >= model.validation.at) return cached;

  const isChanged = isGraphChanged(cached, model);

  if (isChanged) return buildGraph(model);

  cached.validation = model.validation;

  return cached;
};

const prunedGraphFor = (
  model: WorkspaceModel,
  ignored: [string, string][]
): PrunedGraph => {
  const graph = projectGraphFor(model);
  const key = JSON.stringify(ignored);
  const byKey = prunedGraphs.get(graph) ?? new Map<string, PrunedGraph>();
  const cached = byKey.get(key);

  prunedGraphs.set(graph, byKey);

  if (cached) return cached;

  const adjacency = prunedAdjacency(graph.adjacency, ignored);
  const reverse = reverseAdjacency(adjacency);
  const reachersBySource = new Map<Project, Set<Project>>();
  const pruned: PrunedGraph = { adjacency, reverse, reachersBySource };

  byKey.set(key, pruned);

  return pruned;
};

/** Whether `target` reaches `source` once the ignored pairs' edges are removed. */
export const reachesSource = (
  model: WorkspaceModel,
  ignored: [string, string][],
  target: Project,
  source: Project
): boolean => {
  const pruned = prunedGraphFor(model, ignored);
  const memo = pruned.reachersBySource.get(source);

  if (memo) return memo.has(target);

  const parents = breadthFirstParents(pruned.reverse, source);
  const reachers = new Set(parents.keys());

  pruned.reachersBySource.set(source, reachers);

  return reachers.has(target);
};

/** Project ids on a shortest path from `from` to `to` in the pruned graph ([] if unreachable). */
export const shortestProjectPath = (
  model: WorkspaceModel,
  ignored: [string, string][],
  from: Project,
  to: Project
): string[] => {
  const pruned = prunedGraphFor(model, ignored);
  const parents = breadthFirstParents(pruned.adjacency, from);

  return pathBetween(parents, from, to);
};
