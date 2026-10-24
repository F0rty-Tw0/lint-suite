import type { Linter } from 'eslint';
import type { OxlintConfig } from 'oxlint';
import type { CompatibleConfigArray } from 'typescript-eslint';

import { eslintConfigFor } from './eslint-sample-config.spec.util.ts';
import { oxlintOverlap } from '../../eslint.ts';
import { enabledEslintNames } from '../../utils/enabled-eslint-names.util.ts';
import { resolveOxlintConfig } from '../../utils/resolve-oxlint-config.util.ts';
import { normalizeSeverity } from '../../utils/rule-name.util.ts';
import { CONSOLE_ON } from '../common/overlap.const.ts';

const isOff = (entry: unknown): boolean => {
  return entry === 'off';
};

const blockOffNames = (block: Linter.Config): string[] => {
  const entries = Object.entries(block.rules ?? {});
  const offEntries = entries.filter(([, entry]) => isOff(entry));

  return offEntries.map(([name]) => name);
};

const oxlintEnabledNames = (config: OxlintConfig, sample: string): string[] => {
  const resolved = resolveOxlintConfig(config, sample);

  return enabledEslintNames(resolved.rules);
};

export const overlapOffNames = (config: OxlintConfig): string[] => {
  const blocks = oxlintOverlap(config);
  const names = blocks.flatMap(blockOffNames);
  const unique = Array.from(new Set(names));

  return unique.sort();
};

export const resolvedEnabledNames = (
  config: OxlintConfig,
  samples: string[]
): string[] => {
  const namesFor = (sample: string): string[] => {
    return oxlintEnabledNames(config, sample);
  };
  const names = samples.flatMap(namesFor);
  const unique = Array.from(new Set(names));

  return unique.sort();
};

export const enabledInBoth = async (
  eslint: CompatibleConfigArray,
  oxlint: OxlintConfig,
  sample: string
): Promise<string[]> => {
  const sampleConfig = await eslintConfigFor(eslint, sample);
  const eslintOn = enabledEslintNames(sampleConfig.rules);
  const oxlintOn = oxlintEnabledNames(oxlint, sample);

  return eslintOn.filter((name) => oxlintOn.includes(name));
};

export const enabledAfterOverlap = async (
  eslint: CompatibleConfigArray,
  oxlint: OxlintConfig,
  sample: string
): Promise<string[]> => {
  const overlay = oxlintOverlap(oxlint);
  const combined: CompatibleConfigArray = [...eslint, ...overlay];

  return enabledInBoth(combined, oxlint, sample);
};

export const lostAgainstPlain = async (
  plain: CompatibleConfigArray,
  mirrored: CompatibleConfigArray,
  oxlint: OxlintConfig,
  sample: string
): Promise<string[]> => {
  const plainConfig = await eslintConfigFor(plain, sample);
  const mirroredConfig = await eslintConfigFor(mirrored, sample);
  const plainOn = enabledEslintNames(plainConfig.rules);
  const mirroredOn = enabledEslintNames(mirroredConfig.rules);
  const oxlintOn = oxlintEnabledNames(oxlint, sample);
  const isLost = (name: string): boolean => {
    const isOnInMirrored = mirroredOn.includes(name);
    const isOnInOxlint = oxlintOn.includes(name);

    return !isOnInMirrored && !isOnInOxlint;
  };

  return plainOn.filter(isLost);
};

export const lostAfterOverlap = async (
  eslint: CompatibleConfigArray,
  oxlint: OxlintConfig,
  sample: string
): Promise<string[]> => {
  const overlay = oxlintOverlap(oxlint);
  const combined: CompatibleConfigArray = [...eslint, ...overlay];

  return lostAgainstPlain(eslint, combined, oxlint, sample);
};

/** The no-console severity ESLint gives `sample` once `config` is overlapped onto a no-console block. */
export const consoleSeverity = async (
  config: OxlintConfig,
  sample: string
): Promise<string> => {
  const overlay = oxlintOverlap(config);
  const combined = [CONSOLE_ON, ...overlay];
  const sampleConfig = await eslintConfigFor(combined, sample);
  const entry = sampleConfig.rules['no-console'];

  return normalizeSeverity(entry);
};
