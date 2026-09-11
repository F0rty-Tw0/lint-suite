import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  utimesSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, test } from 'vitest';

import type { FileCache, FileCacheIdentity } from './common/file-cache.type.ts';
import { createFileCache, flushFileCaches, readCached } from './file-cache.ts';
import { PACKAGE_IDENTITY } from './package-version.ts';

const FIRST_IDENTITY: FileCacheIdentity = {
  packageName: '@lint-suite/first-plugin',
  packageVersion: '1.0.0'
};
const SECOND_IDENTITY: FileCacheIdentity = {
  packageName: '@lint-suite/second-plugin',
  packageVersion: '1.0.0'
};
const NEXT_FIRST_IDENTITY: FileCacheIdentity = {
  packageName: FIRST_IDENTITY.packageName,
  packageVersion: '2.0.0'
};

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

const storedFiles = (): string[] => {
  const cacheDirectory = join(directory, 'cache');

  if (!existsSync(cacheDirectory)) return [];

  return readdirSync(cacheDirectory).filter((entry) => entry.endsWith('.json'));
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
  flushFileCaches();
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

test('parses again when a stored entry has another cache identity', () => {
  const cache = freshCache();
  const stale = { value: 'STALE', version: 'another-identity' };

  cache.entries.set(file, stale);

  assert.equal(readCached(cache, file, parse), 'ONE');
  assert.equal(parsed, 1);
});

test('reads null for a file that cannot be opened', () => {
  const cache = freshCache();

  assert.equal(readCached(cache, join(directory, 'absent.txt'), parse), null);
  assert.equal(parsed, 0);
});

test('survives a flush into a new cache of the same identity and name', () => {
  const first = freshCache();

  readCached(first, file, parse);
  flushFileCaches();

  assert.equal(storedFiles().length, 1);

  const second = createFileCache<string>(first.name, first.identity);

  assert.equal(readCached(second, file, parse), 'ONE');
  assert.equal(parsed, 1);
});

test('isolates two package identities using the same cache directory and name', () => {
  const name = `identity-${process.pid}-${cacheName}`;
  const first = createFileCache<string>(name, FIRST_IDENTITY);
  const second = createFileCache<string>(name, SECOND_IDENTITY);

  assert.equal(
    readCached(first, file, (): string => 'FIRST'),
    'FIRST'
  );
  assert.equal(
    readCached(second, file, (): string => 'SECOND'),
    'SECOND'
  );

  flushFileCaches();

  const reloadedFirst = createFileCache<string>(name, FIRST_IDENTITY);
  const reloadedSecond = createFileCache<string>(name, SECOND_IDENTITY);

  assert.equal(
    readCached(reloadedFirst, file, (): string => 'WRONG'),
    'FIRST'
  );
  assert.equal(
    readCached(reloadedSecond, file, (): string => 'WRONG'),
    'SECOND'
  );
  assert.equal(storedFiles().length, 2);
});

test('invalidates persisted entries when the package version changes', () => {
  const name = `version-${process.pid}-${cacheName}`;
  const first = createFileCache<string>(name, FIRST_IDENTITY);
  const second = createFileCache<string>(name, NEXT_FIRST_IDENTITY);

  assert.equal(
    readCached(first, file, (): string => 'FIRST'),
    'FIRST'
  );
  flushFileCaches();
  assert.equal(
    readCached(second, file, (): string => 'SECOND'),
    'SECOND'
  );
  flushFileCaches();

  assert.equal(storedFiles().length, 2);
});

test('uses filesystem-safe cache filenames for scoped package identities', () => {
  const cache = createFileCache<string>('unsafe/name', FIRST_IDENTITY);

  readCached(cache, file, parse);
  flushFileCaches();

  const [stored] = storedFiles();

  assert.ok(stored);
  assert.match(stored, /^[\w.-]+$/u);
});

test('writes nothing to disk when the cache is disabled', () => {
  process.env['LINT_SUITE_CACHE'] = '0';

  const cache = freshCache();

  readCached(cache, file, parse);
  flushFileCaches();

  assert.equal(existsSync(join(directory, 'cache')), false);
});

test('uses a deterministic source identity independent of the consumer cwd', () => {
  assert.deepEqual(PACKAGE_IDENTITY, {
    packageName: '@lint-suite/rule-internals',
    packageVersion: 'source'
  });
});
