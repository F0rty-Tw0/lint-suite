import type { ExternalPluginEntry, OxlintConfig } from 'oxlint';

import { resolveOxlintConfig } from '../../utils/resolve-oxlint-config.util.ts';

const specifierOf = (entry: ExternalPluginEntry): string => {
  if (typeof entry === 'string') return entry;

  return entry.specifier;
};

export const ruleAt = (
  config: OxlintConfig,
  file: string,
  rule: string
): unknown => {
  const resolved = resolveOxlintConfig(config, file);

  return resolved.rules[rule];
};

const isFileUrl = (specifier: string): boolean => {
  return specifier.startsWith('file://');
};

export const specifiersOf = (config: OxlintConfig): string[] => {
  const entries = config.jsPlugins ?? [];

  return entries.map(specifierOf);
};

export const fileUrlFlags = (config: OxlintConfig): boolean[] => {
  const specifiers = specifiersOf(config);

  return specifiers.map(isFileUrl);
};
