import {
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { dirname, join } from 'node:path';

type CachedFile<T> = {
  readonly value: T;
  readonly version: string;
};

export type FileCache<T> = {
  readonly name: string;
  readonly entries: Map<string, CachedFile<T>>;
  // eslint-disable-next-line local/readonly-type-properties -- flipped once the disk copy was read
  loaded: boolean;
  // eslint-disable-next-line local/readonly-type-properties -- flipped when an entry was parsed this run
  dirty: boolean;
};

type FileParser<T> = (text: string, path: string) => T;

/** Bump when the shape of any cached value changes. */
const FORMAT = 1;

const caches = new Set<FileCache<unknown>>();

let isFlushRegistered = false;

const cacheDirectory = (): string | null => {
  const { LINT_SUITE_CACHE, LINT_SUITE_CACHE_DIR } = process.env;
  const isDisabled = LINT_SUITE_CACHE === '0';

  if (isDisabled) return null;

  if (LINT_SUITE_CACHE_DIR) return LINT_SUITE_CACHE_DIR;

  return join(process.cwd(), 'node_modules', '.cache', 'lint-suite');
};

const cacheFile = (name: string): string | null => {
  const directory = cacheDirectory();

  if (directory === null) return null;

  return join(directory, `${name}.v${FORMAT}.json`);
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

  const file = cacheFile(cache.name);

  if (file === null) return;

  try {
    const stored = storedEntries<T>(readFileSync(file, 'utf8'));

    for (const [path, entry] of stored) cache.entries.set(path, entry);
  } catch {
    return;
  }
};

const write = (cache: FileCache<unknown>): void => {
  const file = cacheFile(cache.name);

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
 * A cache of parsed files keyed by path and mtime, mirrored to
 * `node_modules/.cache/lint-suite/<name>.v<format>.json` (or
 * `LINT_SUITE_CACHE_DIR`; `LINT_SUITE_CACHE=0` disables the disk copy).
 * Values must survive JSON.
 */
export const createFileCache = <T>(name: string): FileCache<T> => {
  const cache: FileCache<T> = {
    name,
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
    const version = `${stats.mtimeNs}:${stats.size}`;
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
