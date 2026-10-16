import type { EslintFilePattern } from '../common/eslint-files.type.ts';
import { OXLINT_EXTENSIONS } from '../common/oxlint-files.const.ts';

const toEslintGlob = (pattern: string): string => {
  const hasSlash = pattern.includes('/');

  if (hasSlash) return pattern;

  return `**/${pattern}`;
};

const toExtensionGlob = (extension: string): string => `**/*${extension}`;

const endsWithOxlintExtension = (glob: string): boolean => {
  const isSuffix = (extension: string): boolean => glob.endsWith(extension);

  return OXLINT_EXTENSIONS.some(isSuffix);
};

export const toEslintFiles = (files: string[]): string[] => {
  return files.map(toEslintGlob);
};

export const oxlintFileGlobs = (): string[] => {
  return OXLINT_EXTENSIONS.map(toExtensionGlob);
};

const toOxlintScopedPatterns = (glob: string): EslintFilePattern[] => {
  const isOxlintOnly = endsWithOxlintExtension(glob);
  const unchanged: EslintFilePattern[] = [glob];

  if (isOxlintOnly) return unchanged;

  const pairWith = (extensionGlob: string): string[] => [glob, extensionGlob];
  const extensionGlobs = oxlintFileGlobs();

  return extensionGlobs.map(pairWith);
};

export const toOxlintScopedFiles = (globs: string[]): EslintFilePattern[] => {
  return globs.flatMap(toOxlintScopedPatterns);
};
