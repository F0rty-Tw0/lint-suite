import type {
  FileChange,
  FileEdges
} from '../common/no-unused-exports.type.ts';

export const fileChanges = (
  before: Map<string, FileEdges>,
  after: Map<string, FileEdges>
): FileChange[] => {
  const changes: FileChange[] = [];

  for (const [fileName, edges] of after) {
    const previous = before.get(fileName);

    if (previous === edges) continue;

    const change: FileChange = { fileName, before: previous, after: edges };

    changes.push(change);
  }

  for (const [fileName, edges] of before) {
    const isKept = after.has(fileName);

    if (isKept) continue;

    const change: FileChange = { fileName, before: edges, after: undefined };

    changes.push(change);
  }

  return changes;
};

const isBarrel = (edges: FileEdges | undefined): boolean => {
  if (!edges) return false;

  const hasStarTargets = edges.starTargets.length > 0;

  return edges.reExports.length > 0 || hasStarTargets;
};

const hasSameExports = (change: FileChange): boolean => {
  const before = change.before?.exports ?? [];
  const after = change.after?.exports ?? [];

  if (before.length !== after.length) return false;

  return before.every((name, index) => name === after[index]);
};

export const isIncremental = (
  changes: FileChange[],
  starTouched: Map<string, number>
): boolean => {
  for (const change of changes) {
    const wasBarrel = isBarrel(change.before);
    const isNowBarrel = isBarrel(change.after);
    const touchesBarrel = wasBarrel || isNowBarrel;

    if (touchesBarrel) return false;

    const isStarTouched = starTouched.has(change.fileName);

    if (!isStarTouched) continue;

    const sameExports = hasSameExports(change);

    if (!sameExports) return false;
  }

  return true;
};
