import assert from 'node:assert/strict';

import { test } from 'vitest';

import { fileChanges, isIncremental } from './file-changes.util.ts';
import { byFileStub, fileEdgesStub } from './file-edges.spec.util.ts';
import type { ReExportEdge } from '../common/no-unused-exports.type.ts';

const NO_STARS = new Map<string, number>();

const edge: ReExportEdge = {
  target: 'origin.ts',
  source: 'value',
  exported: 'value'
};

test('reports nothing when every file keeps its edges object', () => {
  const edges = fileEdgesStub({ fileName: 'a.ts' });
  const byFile = byFileStub([edges]);

  const changes = fileChanges(byFile, byFile);

  assert.deepEqual(changes, []);
});

test('reports a replaced, an added and a removed file', () => {
  const before = byFileStub([
    fileEdgesStub({ fileName: 'a.ts' }),
    fileEdgesStub({ fileName: 'gone.ts' })
  ]);
  const replaced = fileEdgesStub({ fileName: 'a.ts', exports: ['x'] });
  const added = fileEdgesStub({ fileName: 'new.ts' });
  const after = byFileStub([replaced, added]);

  const changes = fileChanges(before, after);
  const names = changes.map((change) => change.fileName);

  assert.deepEqual(names, ['a.ts', 'new.ts', 'gone.ts']);
  assert.equal(changes[2]?.after, undefined);
  assert.equal(changes[1]?.before, undefined);
});

test('allows a patch when the changed file is a plain importer', () => {
  const before = byFileStub([fileEdgesStub({ fileName: 'a.ts' })]);
  const after = byFileStub([fileEdgesStub({ fileName: 'a.ts', exports: ['x'] })]);

  const changes = fileChanges(before, after);

  assert.equal(isIncremental(changes, NO_STARS), true);
});

test('refuses a patch when a re-export edge appears', () => {
  const before = byFileStub([fileEdgesStub({ fileName: 'barrel.ts' })]);
  const after = byFileStub([
    fileEdgesStub({ fileName: 'barrel.ts', reExports: [edge] })
  ]);

  const changes = fileChanges(before, after);

  assert.equal(isIncremental(changes, NO_STARS), false);
});

test('refuses a patch when a star export edge disappears', () => {
  const before = byFileStub([
    fileEdgesStub({ fileName: 'barrel.ts', starTargets: ['origin.ts'] })
  ]);
  const after = byFileStub([fileEdgesStub({ fileName: 'barrel.ts' })]);

  const changes = fileChanges(before, after);

  assert.equal(isIncremental(changes, NO_STARS), false);
});

test('refuses a patch when a star imported file changes its exports', () => {
  const starTouched = new Map([['origin.ts', 1]]);
  const before = byFileStub([
    fileEdgesStub({ fileName: 'origin.ts', exports: ['a'] })
  ]);
  const after = byFileStub([
    fileEdgesStub({ fileName: 'origin.ts', exports: ['a', 'b'] })
  ]);

  const changes = fileChanges(before, after);

  assert.equal(isIncremental(changes, starTouched), false);
});

test('allows a patch when a star imported file keeps its exports', () => {
  const starTouched = new Map([['origin.ts', 1]]);
  const before = byFileStub([
    fileEdgesStub({ fileName: 'origin.ts', exports: ['a'] })
  ]);
  const after = byFileStub([
    fileEdgesStub({ fileName: 'origin.ts', exports: ['a'], skipped: true })
  ]);

  const changes = fileChanges(before, after);

  assert.equal(isIncremental(changes, starTouched), true);
});
