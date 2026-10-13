import assert from 'node:assert/strict';

import { test } from 'vitest';

import { markUsage, reExportIndex } from './export-usage.util.ts';
import type {
  FileEdges,
  ReExportEdge,
  UsageContext,
  UsageKey
} from '../common/no-unused-exports.type.ts';
import { fileEdgesStub as fileEdges } from '../test/utils/file-edges.spec.util.ts';

const contextOf = (byFile: Map<string, FileEdges>): UsageContext => {
  const context: UsageContext = {
    byFile,
    reExportsByName: reExportIndex(byFile)
  };

  return context;
};

const keyCountOf = (
  keys: UsageKey[],
  fileName: string,
  name: string
): number => {
  const matches = keys.filter((key) => key.fileName === fileName);

  return matches.filter((key) => key.name === name).length;
};

test('reExportIndex maps a re-export edge by its exported name', () => {
  const edge: ReExportEdge = {
    target: 'origin.ts',
    source: 'value',
    exported: 'value'
  };
  const barrel = fileEdges({ fileName: 'barrel.ts', reExports: [edge] });
  const byFile = new Map([['barrel.ts', barrel]]);

  const index = reExportIndex(byFile);

  assert.equal(index.get('barrel.ts')?.get('value'), edge);
});

test('markUsage returns a directly declared export once', () => {
  const barrel = fileEdges({
    fileName: 'barrel.ts',
    exports: ['value'],
    declared: new Set(['value'])
  });
  const context = contextOf(new Map([['barrel.ts', barrel]]));

  const keys = markUsage(context, 'barrel.ts', 'value');

  assert.equal(keyCountOf(keys, 'barrel.ts', 'value'), 1);
});

test('markUsage follows a re-export to its origin', () => {
  const origin = fileEdges({ fileName: 'origin.ts', exports: ['value'] });
  const barrelReExport: ReExportEdge = {
    target: 'origin.ts',
    source: 'value',
    exported: 'value'
  };
  const barrel = fileEdges({
    fileName: 'barrel.ts',
    exports: ['value'],
    reExports: [barrelReExport]
  });
  const byFile = new Map([
    ['origin.ts', origin],
    ['barrel.ts', barrel]
  ]);
  const context = contextOf(byFile);

  const keys = markUsage(context, 'barrel.ts', 'value');

  assert.equal(keyCountOf(keys, 'barrel.ts', 'value'), 1);
  assert.equal(keyCountOf(keys, 'origin.ts', 'value'), 1);
});

test('markUsage("*") marks every export and follows star targets', () => {
  const target = fileEdges({ fileName: 'target.ts', exports: ['c'] });
  const barrel = fileEdges({
    fileName: 'barrel.ts',
    exports: ['a', 'b'],
    starTargets: ['target.ts']
  });
  const byFile = new Map([
    ['target.ts', target],
    ['barrel.ts', barrel]
  ]);
  const context = contextOf(byFile);

  const keys = markUsage(context, 'barrel.ts', '*');

  assert.equal(keyCountOf(keys, 'barrel.ts', 'a'), 1);
  assert.equal(keyCountOf(keys, 'barrel.ts', 'b'), 1);
  assert.equal(keyCountOf(keys, 'target.ts', 'c'), 1);
});

test('markUsage stops at a re-export cycle instead of looping forever', () => {
  const toB: ReExportEdge = {
    target: 'b.ts',
    source: 'value',
    exported: 'value'
  };
  const toA: ReExportEdge = {
    target: 'a.ts',
    source: 'value',
    exported: 'value'
  };
  const fileA = fileEdges({
    fileName: 'a.ts',
    exports: ['value'],
    reExports: [toB]
  });
  const fileB = fileEdges({
    fileName: 'b.ts',
    exports: ['value'],
    reExports: [toA]
  });
  const byFile = new Map([
    ['a.ts', fileA],
    ['b.ts', fileB]
  ]);
  const context = contextOf(byFile);

  const keys = markUsage(context, 'a.ts', 'value');

  assert.equal(keyCountOf(keys, 'a.ts', 'value'), 1);
  assert.equal(keyCountOf(keys, 'b.ts', 'value'), 1);
});
