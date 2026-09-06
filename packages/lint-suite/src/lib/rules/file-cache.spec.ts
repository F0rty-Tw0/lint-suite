import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  rmSync,
  utimesSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, test } from 'vitest';

import { createFileCache, flushFileCaches, readCached } from './file-cache.ts';
import type { FileCache } from './file-cache.ts';

let directory = '';
let file = '';
let parsed = 0;
let cacheName = 0;

const parse = (text: string): string => {
  parsed += 1;

  return text.toUpperCase();
};

const freshCache = (): FileCache<string> => {
  return createFileCache<string>(`spec-${process.pid}-${cacheName}`);
};

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'lint-suite-file-cache-'));
  file = join(directory, 'sample.txt');
  parsed = 0;
  cacheName += 1;
  process.env['LINT_SUITE_CACHE_DIR'] = join(directory, 'cache');
  delete process.env['LINT_SUITE_CACHE'];
  writeFileSync(file, 'one');
});

afterEach(() => {
  delete process.env['LINT_SUITE_CACHE_DIR'];
  rmSync(directory, { recursive: true, force: true });
});

test('parses a file once while it is unchanged', () => {
  const cache = freshCache();

  assert.equal(readCached(cache, file, parse), 'ONE');
  assert.equal(readCached(cache, file, parse), 'ONE');
  assert.equal(parsed, 1);
});

test('parses again when the file changes', () => {
  const cache = freshCache();

  readCached(cache, file, parse);
  writeFileSync(file, 'two');
  utimesSync(file, new Date(), new Date(Date.now() + 5000));

  assert.equal(readCached(cache, file, parse), 'TWO');
  assert.equal(parsed, 2);
});

test('reads null for a file that cannot be opened', () => {
  const cache = freshCache();

  assert.equal(readCached(cache, join(directory, 'absent.txt'), parse), null);
  assert.equal(parsed, 0);
});

test('survives a flush into a new cache of the same name', () => {
  const first = freshCache();

  readCached(first, file, parse);
  flushFileCaches();

  const stored = join(directory, 'cache', `${first.name}.v1.json`);

  assert.ok(existsSync(stored));

  const second = createFileCache<string>(first.name);

  assert.equal(readCached(second, file, parse), 'ONE');
  assert.equal(parsed, 1);
});

test('writes nothing to disk when the cache is disabled', () => {
  process.env['LINT_SUITE_CACHE'] = '0';

  const cache = freshCache();

  readCached(cache, file, parse);
  flushFileCaches();

  assert.equal(existsSync(join(directory, 'cache')), false);
});
