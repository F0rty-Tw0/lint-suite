import { existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

const QUOTED = /'([^']*)'|"([^"]*)"/u;
const SKIPPED_PREFIXES = ['sass:', 'http', 'url('];

const specifierOf = (params: string): string | null => {
  const match = QUOTED.exec(params);

  if (!match) return null;

  return match[1] ?? match[2] ?? null;
};

const isResolvable = (specifier: string): boolean => {
  const isEmpty = specifier.length === 0;

  if (isEmpty) return false;

  const isSkipped = SKIPPED_PREFIXES.some((prefix) =>
    specifier.startsWith(prefix)
  );

  if (isSkipped) return false;

  return !specifier.endsWith('.css');
};

const candidatesOf = (path: string): string[] => {
  const isStylesheet = path.endsWith('.scss');

  if (isStylesheet) return [path, join(dirname(path), `_${basename(path)}`)];

  const partial = join(dirname(path), `_${basename(path)}.scss`);

  return [
    `${path}.scss`,
    partial,
    join(path, 'index.scss'),
    join(path, '_index.scss')
  ];
};

export const resolveStylesheetImport = (
  params: string,
  directory: string
): string | null => {
  const specifier = specifierOf(params);

  if (specifier === null) return null;

  const isCandidate = isResolvable(specifier);

  if (!isCandidate) return null;

  const path = resolve(directory, specifier);
  const candidates = candidatesOf(path);
  const existing = candidates.find((candidate) => existsSync(candidate));

  return existing ?? null;
};
