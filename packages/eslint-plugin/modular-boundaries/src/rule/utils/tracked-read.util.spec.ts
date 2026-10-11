import assert from 'node:assert/strict';

import { onTestFinished, test } from 'vitest';

import { writeTempWorkspace } from '../test/utils/fixture-workspace.spec.util.ts';
import { readTracked, readTrackedData } from './tracked-read.util.ts';

import type { ConfigError } from '../common/modular-boundaries.type.ts';

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

test('readTrackedData returns parsed data and records parse errors', (): void => {
  const workspace = writeTempWorkspace({
    'moon.yml': '[1]\n',
    'project.json': '{ broken'
  });
  const errors: ConfigError[] = [];
  const readSet = new Map<string, unknown>();
  const moon = readTrackedData(readSet, workspace.file('moon.yml'), errors);
  const broken = workspace.file('project.json');
  const missing = workspace.file('turbo.json');

  onTestFinished(workspace.dispose);

  assert.deepEqual(moon, [1]);
  assert.equal(readTrackedData(readSet, broken, errors), undefined);
  assert.equal(readTrackedData(readSet, missing, errors), undefined);
  assert.deepEqual(
    errors.map((error) => error.file),
    [broken]
  );
});
