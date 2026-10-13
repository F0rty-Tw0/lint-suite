import { mapGlobToRegExp } from './tag-patterns.util.ts';

import type { Project } from '../common/modular-boundaries.type.ts';

const matchesPair = (
  [first, second]: [string, string],
  a: Project,
  b: Project
): boolean => {
  const firstPattern = mapGlobToRegExp(first);
  const secondPattern = mapGlobToRegExp(second);
  const isForward = firstPattern.test(a.id) && secondPattern.test(b.id);
  const isBackward = firstPattern.test(b.id) && secondPattern.test(a.id);

  return isForward || isBackward;
};

/** `adjacency` without every edge whose two ends match an ignored pair, in either order. */
export const prunedAdjacency = (
  adjacency: Map<Project, Set<Project>>,
  ignored: [string, string][]
): Map<Project, Set<Project>> => {
  const pruned = new Map<Project, Set<Project>>();

  for (const [source, targets] of adjacency) {
    const isKept = (target: Project): boolean => {
      return !ignored.some((pair) => matchesPair(pair, source, target));
    };
    const kept = [...targets].filter(isKept);

    pruned.set(source, new Set(kept));
  }

  return pruned;
};

/** The same edges pointing the other way. */
export const reverseAdjacency = (
  adjacency: Map<Project, Set<Project>>
): Map<Project, Set<Project>> => {
  const reverse = new Map<Project, Set<Project>>();

  for (const [source, targets] of adjacency) {
    for (const target of targets) {
      const sources = reverse.get(target) ?? new Set<Project>();

      sources.add(source);
      reverse.set(target, sources);
    }
  }

  return reverse;
};

/**
 * Breadth-first search from `start`: every project reached through at least
 * one edge, mapped to the project it was first reached from. `start` is a key
 * only when a cycle leads back to it.
 */
export const breadthFirstParents = (
  adjacency: Map<Project, Set<Project>>,
  start: Project
): Map<Project, Project> => {
  const parents = new Map<Project, Project>();
  const queue = [start];

  for (const current of queue) {
    const neighbours = adjacency.get(current) ?? [];

    for (const neighbour of neighbours) {
      if (parents.has(neighbour)) continue;

      parents.set(neighbour, current);
      queue.push(neighbour);
    }
  }

  return parents;
};

/** Project ids from `from` to `to` inclusive along `parents`, or [] when `to` was not reached. */
export const pathBetween = (
  parents: Map<Project, Project>,
  from: Project,
  to: Project
): string[] => {
  if (!parents.has(to)) return [];

  const path = [to.id];
  let current = to;

  while (current !== from) {
    const parent = parents.get(current);

    if (parent === undefined) return [];

    path.unshift(parent.id);
    current = parent;
  }

  return path;
};
