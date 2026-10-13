import assert from 'node:assert/strict';

import { test } from 'vitest';

import { globRoots } from './workspace-globs.util.ts';

const ROOT = '/ws';
const DIRECTORIES = ['/ws/packages/a', '/ws/packages/b', '/ws/tools/c'];

const matchedRoots = (entries: string[]): string[] => {
  const roots = globRoots(ROOT, DIRECTORIES, entries);

  return roots.map((discovered) => discovered.root);
};

test('a ./ prefix and a trailing slash are stripped from every entry', (): void => {
  const roots = matchedRoots(['./packages/*/', '!./packages/b/']);

  assert.deepEqual(roots, ['/ws/packages/a']);
});

test('a negated entry excludes only what it matches', (): void => {
  const roots = matchedRoots(['packages/*', 'tools/*', '!tools/*']);

  assert.deepEqual(roots, ['/ws/packages/a', '/ws/packages/b']);
});

test('an empty include list matches nothing', (): void => {
  const roots = matchedRoots(['!packages/a']);

  assert.deepEqual(roots, []);
});
