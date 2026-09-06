import assert from 'node:assert/strict';

import { test } from 'vitest';

import { buildAggregate, updateAggregate } from './aggregate-update.util.ts';
import { byFileStub, fileEdgesStub } from './file-edges.spec.util.ts';
import type {
  Aggregate,
  FileChange,
  FileEdges,
  ImportEdge
} from '../common/no-unused-exports.type.ts';

const usedImport: ImportEdge = { target: 'used.ts', names: ['usedValue'] };

const used = fileEdgesStub({
  fileName: 'used.ts',
  exports: ['usedValue'],
  declared: new Set(['usedValue'])
});

const usageOf = (aggregate: Aggregate, fileName: string, name: string): number => {
  return aggregate.usage.get(fileName)?.get(name) ?? 0;
};

const consumerOf = (imports: ImportEdge[]): FileEdges => {
  return fileEdgesStub({ fileName: 'consumer.ts', imports });
};

const changeOf = (before: FileEdges, after: FileEdges | undefined): FileChange => {
  const change: FileChange = { fileName: before.fileName, before, after };

  return change;
};

test('counts an import as usage of the declaring file', () => {
  const byFile = byFileStub([used, consumerOf([usedImport])]);

  const aggregate = buildAggregate(byFile);

  assert.equal(usageOf(aggregate, 'used.ts', 'usedValue'), 1);
  assert.equal(aggregate.imported.get('used.ts'), 1);
});

test('drops the usage when the importer loses the import', () => {
  const consumer = consumerOf([usedImport]);
  const aggregate = buildAggregate(byFileStub([used, consumer]));
  const bare = consumerOf([]);

  updateAggregate(aggregate, [changeOf(consumer, bare)]);

  assert.equal(usageOf(aggregate, 'used.ts', 'usedValue'), 0);
  assert.equal(aggregate.imported.has('used.ts'), false);
  assert.equal(aggregate.byFile.get('consumer.ts'), bare);
});

test('adds the usage when the importer gains the import', () => {
  const bare = consumerOf([]);
  const aggregate = buildAggregate(byFileStub([used, bare]));
  const consumer = consumerOf([usedImport]);

  updateAggregate(aggregate, [changeOf(bare, consumer)]);

  assert.equal(usageOf(aggregate, 'used.ts', 'usedValue'), 1);
  assert.equal(aggregate.imported.get('used.ts'), 1);
});

test('keeps a count of every importer of the same export', () => {
  const consumer = consumerOf([usedImport]);
  const other = fileEdgesStub({ fileName: 'other.ts', imports: [usedImport] });
  const aggregate = buildAggregate(byFileStub([used, consumer, other]));

  updateAggregate(aggregate, [changeOf(consumer, consumerOf([]))]);

  assert.equal(usageOf(aggregate, 'used.ts', 'usedValue'), 1);
  assert.equal(aggregate.imported.get('used.ts'), 1);
});

test('forgets a removed file and its contributions', () => {
  const consumer = consumerOf([usedImport]);
  const aggregate = buildAggregate(byFileStub([used, consumer]));

  updateAggregate(aggregate, [changeOf(consumer, undefined)]);

  assert.equal(aggregate.byFile.has('consumer.ts'), false);
  assert.equal(aggregate.contributions.has('consumer.ts'), false);
  assert.equal(usageOf(aggregate, 'used.ts', 'usedValue'), 0);
});

test('tracks the files a star import may expand', () => {
  const starImport: ImportEdge = { target: 'used.ts', names: ['*'] };
  const aggregate = buildAggregate(
    byFileStub([used, consumerOf([starImport])])
  );

  assert.equal(aggregate.starTouched.get('used.ts'), 1);
  assert.equal(usageOf(aggregate, 'used.ts', 'usedValue'), 1);
});

test('patches to the same counts a fresh build produces', () => {
  const consumer = consumerOf([usedImport]);
  const patched = buildAggregate(byFileStub([used, consumer]));
  const bare = consumerOf([]);

  updateAggregate(patched, [changeOf(consumer, bare)]);

  const fresh = buildAggregate(byFileStub([used, bare]));

  assert.deepEqual(patched.usage, fresh.usage);
  assert.deepEqual(patched.imported, fresh.imported);
  assert.deepEqual(patched.starTouched, fresh.starTouched);
});
