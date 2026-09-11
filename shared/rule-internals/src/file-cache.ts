import {
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { dirname, join } from 'node:path';

import type {
  CachedFile,
  FileCache,
  FileCacheIdentity
} from './common/file-cache.type.ts';
import { PACKAGE_IDENTITY } from './package-version.ts';

type FileParser<T> = (text: string, path: string) => T;

const CACHE_FORMAT_VERSION = 1;

const caches = new Set<FileCache<unknown>>();

let isFlushRegistered = false;

const cacheDirectory = (): string | null => {
  const { LINT_SUITE_CACHE, LINT_SUITE_CACHE_DIR } = process.env;
  const isDisabled = LINT_SUITE_CACHE === '0';

  if (isDisabled) return null;

  if (LINT_SUITE_CACHE_DIR) return LINT_SUITE_CACHE_DIR;

  return join(process.cwd(), 'node_modules', '.cache', 'lint-suite');
};

const cacheFile = (
  name: string,
  identity: FileCacheIdentity
): string | null => {
  const directory = cacheDirectory();

  if (directory === null) return null;

  const identityParts = [identity.packageName, identity.packageVersion];
  const identitySource = JSON.stringify(identityParts);
  const safeIdentity = Buffer.from(identitySource, 'utf8').toString(
    'base64url'
  );
  const safeName = Buffer.from(name, 'utf8').toString('base64url');

  return join(
    directory,
    `${safeIdentity}.${safeName}.v${CACHE_FORMAT_VERSION}.json`
  );
};

const isCachedFile = <T>(value: unknown): value is CachedFile<T> => {
  const isObject = typeof value === 'object' && value !== null;

  if (!isObject) return false;

  const hasVersion = 'version' in value && typeof value.version === 'string';

  return hasVersion && 'value' in value;
};

const storedEntries = <T>(text: string): Map<string, CachedFile<T>> => {
  const entries = new Map<string, CachedFile<T>>();
  const parsed: unknown = JSON.parse(text);
  const isRecord = typeof parsed === 'object' && parsed !== null;

  if (!isRecord) return entries;

  for (const [path, entry] of Object.entries(parsed)) {
    if (isCachedFile<T>(entry)) entries.set(path, entry);
  }

  return entries;
};

const load = <T>(cache: FileCache<T>): void => {
  cache.loaded = true;

  const file = cacheFile(cache.name, cache.identity);

  if (file === null) return;

  try {
    const stored = storedEntries<T>(readFileSync(file, 'utf8'));

    for (const [path, entry] of stored) cache.entries.set(path, entry);
  } catch {
    return;
  }
};

const write = (cache: FileCache<unknown>): void => {
  const file = cacheFile(cache.name, cache.identity);

  if (file === null) return;

  try {
    mkdirSync(dirname(file), { recursive: true });

    const temporary = `${file}.${process.pid}.tmp`;
    const stored = Object.fromEntries(cache.entries);

    writeFileSync(temporary, JSON.stringify(stored));
    renameSync(temporary, file);
  } catch {
    return;
  }
};

/** Writes every cache that parsed something this run; runs at process exit. */
export const flushFileCaches = (): void => {
  for (const cache of caches) {
    if (!cache.dirty) continue;

    write(cache);
    cache.dirty = false;
  }
};

const registerFlush = (): void => {
  if (isFlushRegistered) return;

  isFlushRegistered = true;
  process.once('exit', flushFileCaches);
};

/**
 * A cache of parsed files keyed by path, owning package identity, mtime and size,
 * mirrored to `node_modules/.cache/lint-suite/<identity>.<name>.v<format>.json`
 * (or `LINT_SUITE_CACHE_DIR`; `LINT_SUITE_CACHE=0` disables the disk copy).
 * Values must survive JSON.
 */
export const createFileCache = <T>(
  name: string,
  identity: FileCacheIdentity = PACKAGE_IDENTITY
): FileCache<T> => {
  const cache: FileCache<T> = {
    name,
    identity,
    entries: new Map(),
    loaded: false,
    dirty: false
  };

  caches.add(cache);
  registerFlush();

  return cache;
};

export const readCached = <T>(
  cache: FileCache<T>,
  path: string,
  parse: FileParser<T>
): T | null => {
  if (!cache.loaded) load(cache);

  try {
    const stats = statSync(path, { bigint: true });
    const version =
      `${cache.identity.packageName}:${cache.identity.packageVersion}:` +
      `${stats.mtimeNs}:${stats.size}`;
    const cached = cache.entries.get(path);

    if (cached?.version === version) return cached.value;

    const value = parse(readFileSync(path, 'utf8'), path);
    const fresh: CachedFile<T> = { value, version };

    cache.entries.set(path, fresh);
    cache.dirty = true;

    return value;
  } catch {
    return null;
  }
};
