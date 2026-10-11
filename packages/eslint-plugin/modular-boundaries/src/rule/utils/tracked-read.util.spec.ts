import assert from 'node:assert/strict';

import { onTestFinished, test } from 'vitest';

import { writeTempWorkspace } from '../test/utils/fixture-workspace.spec.util.ts';
import { readTracked } from './tracked-read.util.ts';

test('readTracked parses by file name and records the value', (): void => {
  const workspace = writeTempWorkspace({ 'moon.yml': 'tags: [a]\n' });
  const readSet = new Map<string, unknown>();
  const path = workspace.file('moon.yml');

  onTestFinished(workspace.dispose);

  const value = readTracked(readSet, path);

  assert.deepEqual(value, { ok: true, data: { tags: ['a'] } });
  assert.equal(readSet.get(path), value);
});

test('readTracked records null for a missing file', (): void => {
  const workspace = writeTempWorkspace({});
  const readSet = new Map<string, unknown>();
  const path = workspace.file('project.json');

  onTestFinished(workspace.dispose);

  const value = readTracked(readSet, path);

  assert.equal(value, null);
  assert.equal(readSet.has(path), true);
});

test('readTracked returns the same reference for an unchanged file', (): void => {
  const workspace = writeTempWorkspace({ 'project.json': '{ "tags": [] }' });
  const path = workspace.file('project.json');

  onTestFinished(workspace.dispose);

  const first = readTracked(new Map(), path);
  const second = readTracked(new Map(), path);

  assert.equal(second, first);
});
