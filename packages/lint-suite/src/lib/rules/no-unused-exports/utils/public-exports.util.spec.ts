import assert from 'node:assert/strict';

import { test } from 'vitest';

import { reExportIndex } from './export-usage.util.ts';
import { byFileStub, fileEdgesStub } from './file-edges.spec.util.ts';
import { publicExports } from './public-exports.util.ts';
import type {
  ReExportEdge,
  UsageContext
} from '../common/no-unused-exports.type.ts';

const namedReExport: ReExportEdge = {
  target: 'origin.ts',
  source: 'kept',
  exported: 'kept'
};
const entry = fileEdgesStub({
  fileName: 'index.ts',
  exports: ['kept'],
  reExports: [namedReExport],
  starTargets: ['star.ts']
});
const origin = fileEdgesStub({
  fileName: 'origin.ts',
  exports: ['kept', 'dropped'],
  declared: new Set(['kept', 'dropped'])
});
const star = fileEdgesStub({
  fileName: 'star.ts',
  exports: ['starred'],
  declared: new Set(['starred'])
});
const byFile = byFileStub([entry, origin, star]);
const context: UsageContext = {
  byFile,
  reExportsByName: reExportIndex(byFile)
};

test('marks names an entry point re-exports by name', () => {
  const index = publicExports(context, ['index.ts']);

  assert.deepEqual(index.get('origin.ts'), new Set(['kept']));
});

test('marks every export behind an entry point star re-export', () => {
  const index = publicExports(context, ['index.ts']);

  assert.deepEqual(index.get('star.ts'), new Set(['starred']));
});

test('leaves files untouched when no entry point reaches them', () => {
  const index = publicExports(context, []);

  assert.equal(index.size, 0);
});
