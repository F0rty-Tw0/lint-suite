import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_NAME = 'lint-suite';
const DEV_VERSION = 'dev';
const MAX_MANIFEST_DEPTH = 6;

/** The directory of this module, in the source tree or next to the bundle. */
const moduleDirectory = (): string | null => {
  const url: unknown = import.meta.url;

  if (typeof url !== 'string') return null;

  return dirname(fileURLToPath(url));
};

const manifestVersion = (file: string): string | null => {
  const isPresent = existsSync(file);

  if (!isPresent) return null;

  try {
    const manifest: unknown = JSON.parse(readFileSync(file, 'utf8'));
    const isRecord = typeof manifest === 'object' && manifest !== null;

    if (!isRecord) return null;

    if (!('name' in manifest)) return null;

    if (manifest.name !== PACKAGE_NAME) return null;

    if (!('version' in manifest)) return null;

    if (typeof manifest.version !== 'string') return null;

    return manifest.version;
  } catch {
    return null;
  }
};

const parentOf = (directory: string): string | null => {
  const parent = dirname(directory);

  if (parent === directory) return null;

  return parent;
};

/**
 * The installed lint-suite version, read from this package's own manifest
 * (next to the bundle, or above the source tree), never from `process.cwd()`:
 * a monorepo root that does not depend on lint-suite itself must still see
 * an upgrade.
 */
const packageVersion = (): string => {
  let directory = moduleDirectory();

  for (let depth = 0; depth < MAX_MANIFEST_DEPTH; depth += 1) {
    if (directory === null) break;

    const version = manifestVersion(join(directory, 'package.json'));

    if (version !== null) return version;

    directory = parentOf(directory);
  }

  return DEV_VERSION;
};

export const PACKAGE_VERSION = packageVersion();
