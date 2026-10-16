import { posix } from 'node:path';

const NEGATION = '!';

const withoutNegation = (pattern: string): string => {
  const isNegated = pattern.startsWith(NEGATION);

  if (!isNegated) return pattern;

  return pattern.slice(NEGATION.length);
};

const withoutTrailingSlash = (pattern: string): string => {
  const isDirectory = pattern.endsWith('/');

  if (!isDirectory) return pattern;

  return pattern.slice(0, -1);
};

const toGlob = (pattern: string): string => {
  const body = withoutTrailingSlash(pattern);
  const isAnchored = body.includes('/');

  if (!isAnchored) return `**/${body}`;

  const isRootAnchored = body.startsWith('/');

  if (isRootAnchored) return body.slice(1);

  return body;
};

const toIgnoreGlobs = (pattern: string): string[] => {
  const isNegated = pattern.startsWith(NEGATION);
  const body = withoutNegation(pattern);
  const glob = toGlob(body);
  const prefix = isNegated ? NEGATION : '';
  const globs = [`${prefix}${glob}`, `${prefix}${glob}/**`];

  return globs;
};

export const toEslintIgnores = (patterns: string[]): string[] => {
  return patterns.flatMap(toIgnoreGlobs);
};

export const isIgnoredPath = (
  patterns: string[],
  posixPath: string
): boolean => {
  const globs = toEslintIgnores(patterns);
  let isIgnored = false;

  for (const glob of globs) {
    const isNegated = glob.startsWith(NEGATION);
    const body = withoutNegation(glob);
    const matches = posix.matchesGlob(posixPath, body);

    if (matches) {
      isIgnored = !isNegated;
    }
  }

  return isIgnored;
};
