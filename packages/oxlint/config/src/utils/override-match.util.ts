import { posix } from 'node:path';

import type { OxlintOverride } from 'oxlint';

export const toPosixPath = (filePath: string): string => {
  return filePath.replaceAll('\\', '/');
};

const DOT_SEGMENT_START = /(^|\/)\./g;

const DOT_PLACEHOLDER = '$1\u0000';

const unhideDotSegments = (value: string): string => {
  return value.replaceAll(DOT_SEGMENT_START, DOT_PLACEHOLDER);
};

/** Bare patterns match the basename, others the whole path; dot segments are matchable. */
export const matchesOverride = (
  override: OxlintOverride,
  posixPath: string
): boolean => {
  const baseName = posix.basename(posixPath);
  const matchesPattern = (pattern: string): boolean => {
    const isBare = !pattern.includes('/');
    const target = isBare ? baseName : posixPath;
    const visibleTarget = unhideDotSegments(target);
    const visiblePattern = unhideDotSegments(pattern);

    return posix.matchesGlob(visibleTarget, visiblePattern);
  };

  return override.files.some(matchesPattern);
};
