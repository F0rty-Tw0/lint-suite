import { extname } from 'node:path';

import type { ExternalPluginEntry, OxlintConfig, OxlintOverride } from 'oxlint';

import { isIgnoredPath } from './ignore-patterns.util.ts';
import { matchesOverride, toPosixPath } from './override-match.util.ts';
import {
  enabledBuiltInPlugins,
  overrideRunnableRules,
  runnableRules
} from './oxlint-plugins.util.ts';
import { assertPrefixedRuleKeys, canonicalRules } from './rule-key.util.ts';
import type { ResolvedOxlintConfig } from '../common/oxlint-config.type.ts';
import { OXLINT_EXTENSIONS } from '../common/oxlint-files.const.ts';

const EMPTY_RESOLVED: ResolvedOxlintConfig = {
  rules: {},
  plugins: [],
  jsPlugins: [],
  settings: {},
  globals: {}
};

const hasExcludeFiles = (override: OxlintOverride): boolean => {
  return override.excludeFiles !== undefined;
};

const uniqueNames = (names: string[]): string[] => {
  const unique = new Set(names);

  return Array.from(unique);
};

const treePlugins = (config: OxlintConfig): string[] => {
  const extended = config.extends ?? [];
  const inherited = extended.flatMap(treePlugins);
  const own = config.plugins ?? [];

  return [...inherited, ...own];
};

const aliasOf = (entry: ExternalPluginEntry): string => {
  if (typeof entry === 'string') return entry;

  return entry.name;
};

const treeJsPlugins = (config: OxlintConfig): string[] => {
  const extended = config.extends ?? [];
  const inherited = extended.flatMap(treeJsPlugins);
  const ownEntries = config.jsPlugins ?? [];
  const own = ownEntries.map(aliasOf);

  return [...inherited, ...own];
};

export const assertNoExcludeFiles = (overrides: OxlintOverride[]): void => {
  const hasExclusion = overrides.some(hasExcludeFiles);

  if (hasExclusion) throw new Error('excludeFiles is not supported');
};

export const topLevelRules = (
  config: OxlintConfig
): Readonly<Record<string, unknown>> => {
  const extended = config.extends ?? [];
  const merged: Record<string, unknown> = {};

  for (const parent of extended) {
    const parentRules = topLevelRules(parent);

    Object.assign(merged, parentRules);
  }

  const ownRules = canonicalRules(config.rules);

  Object.assign(merged, ownRules);

  return merged;
};

export const orderedOverrides = (config: OxlintConfig): OxlintOverride[] => {
  const extended = config.extends ?? [];
  const inherited = extended.flatMap(orderedOverrides);
  const own = config.overrides ?? [];

  return [...inherited, ...own];
};

export const lintsFile = (filePath: string): boolean => {
  const extension = extname(filePath);

  return OXLINT_EXTENSIONS.includes(extension);
};

/** The rules, plugins, settings and globals of `config` plus its `matching` overrides, in order. */
const mergedConfig = (
  config: OxlintConfig,
  matching: OxlintOverride[]
): ResolvedOxlintConfig => {
  const rules: Record<string, unknown> = {};
  const globals: Record<string, unknown> = {};
  const plugins = treePlugins(config);
  const jsPlugins = treeJsPlugins(config);
  const builtInPlugins = enabledBuiltInPlugins(config);
  const topRules = topLevelRules(config);
  const baseRules = runnableRules(topRules, builtInPlugins);

  Object.assign(rules, baseRules);
  Object.assign(globals, config.globals);

  for (const override of matching) {
    const overridePlugins = override.plugins ?? [];
    const overrideJsPlugins = override.jsPlugins ?? [];
    const overrideAliases = overrideJsPlugins.map(aliasOf);
    const canonical = canonicalRules(override.rules);
    const overrideRules = overrideRunnableRules(
      canonical,
      builtInPlugins,
      override
    );

    Object.assign(rules, overrideRules);
    Object.assign(globals, override.globals);
    plugins.push(...overridePlugins);
    jsPlugins.push(...overrideAliases);
  }

  const settings: Record<string, unknown> = { ...config.settings };
  const uniquePlugins = uniqueNames(plugins);
  const uniqueJsPlugins = uniqueNames(jsPlugins);
  const resolved: ResolvedOxlintConfig = {
    rules,
    plugins: uniquePlugins,
    jsPlugins: uniqueJsPlugins,
    settings,
    globals
  };

  return resolved;
};

export const resolveOxlintConfig = (
  config: OxlintConfig,
  filePath: string
): ResolvedOxlintConfig => {
  const overrides = orderedOverrides(config);

  assertNoExcludeFiles(overrides);
  assertPrefixedRuleKeys(config);

  const isLinted = lintsFile(filePath);

  if (!isLinted) return EMPTY_RESOLVED;

  const posixPath = toPosixPath(filePath);
  const ignorePatterns = config.ignorePatterns ?? [];
  const isIgnored = isIgnoredPath(ignorePatterns, posixPath);

  if (isIgnored) return EMPTY_RESOLVED;

  const matchesFile = (override: OxlintOverride): boolean => {
    return matchesOverride(override, posixPath);
  };
  const matching = overrides.filter(matchesFile);
  const resolved = mergedConfig(config, matching);

  return resolved;
};
