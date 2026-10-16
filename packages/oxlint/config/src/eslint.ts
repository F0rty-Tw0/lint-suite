import type { Linter } from 'eslint';
import type { OxlintConfig, OxlintOverride } from 'oxlint';

import type { EslintFilePattern } from './common/eslint-files.type.ts';
import {
  minifiedFileGlobs,
  oxlintFileGlobs,
  toEslintFiles,
  toOxlintScopedFiles
} from './utils/eslint-files.util.ts';
import { toEslintIgnores } from './utils/ignore-patterns.util.ts';
import {
  enabledBuiltInPlugins,
  overrideRunnableRules,
  runnableRules
} from './utils/oxlint-plugins.util.ts';
import {
  assertNoExcludeFiles,
  orderedOverrides,
  topLevelRules
} from './utils/resolve-oxlint-config.util.ts';
import {
  assertPrefixedRuleKeys,
  canonicalRules
} from './utils/rule-key.util.ts';
import { isEnabled, toEslintRuleNames } from './utils/rule-name.util.ts';

type OverlapLayer = {
  readonly files: string[];
  readonly blockFiles: EslintFilePattern[];
  readonly rules: Readonly<Record<string, unknown>>;
};

type OffGroup = {
  readonly ignores: string[];
  readonly names: string[];
};

const OXLINT_FILES: string[] = oxlintFileGlobs();

const MINIFIED_FILES: string[] = minifiedFileGlobs();

const NO_NAMES: ReadonlySet<string> = new Set();

const toOffRules = (names: string[]): Linter.RulesRecord => {
  const entries = names.map((name) => [name, 'off'] as const);

  return Object.fromEntries(entries);
};

const overrideLayerFor = (
  plugins: string[]
): ((override: OxlintOverride) => OverlapLayer) => {
  const toOverrideLayer = (override: OxlintOverride): OverlapLayer => {
    const files = toEslintFiles(override.files);
    const blockFiles = toOxlintScopedFiles(files);
    const canonical = canonicalRules(override.rules);
    const rules = overrideRunnableRules(canonical, plugins, override);
    const layer: OverlapLayer = { files, blockFiles, rules };

    return layer;
  };

  return toOverrideLayer;
};

const isTurnedOff = (layer: OverlapLayer, rule: string): boolean => {
  const entry = layer.rules[rule];

  if (entry === undefined) return false;

  return !isEnabled(entry);
};

const ignoresFor = (rule: string, laterLayers: OverlapLayer[]): string[] => {
  const turnsRuleOff = (layer: OverlapLayer): boolean => {
    return isTurnedOff(layer, rule);
  };
  const offLayers = laterLayers.filter(turnsRuleOff);
  const files = offLayers.flatMap((layer) => layer.files);
  const unique = new Set(files);

  return Array.from(unique);
};

const groupFor = (
  groups: Map<string, OffGroup>,
  ignores: string[]
): OffGroup => {
  const key = JSON.stringify(ignores);
  const known = groups.get(key);

  if (known !== undefined) return known;

  const names: string[] = [];
  const group: OffGroup = { ignores, names };

  groups.set(key, group);

  return group;
};

const layerGroups = (
  layer: OverlapLayer,
  laterLayers: OverlapLayer[],
  skipped: ReadonlySet<string>
): OffGroup[] => {
  const groups = new Map<string, OffGroup>();
  const isKept = (name: string): boolean => !skipped.has(name);

  groupFor(groups, []);

  for (const [rule, entry] of Object.entries(layer.rules)) {
    const isOn = isEnabled(entry);

    if (!isOn) continue;

    const ignores = ignoresFor(rule, laterLayers);
    const group = groupFor(groups, ignores);
    const eslintNames = toEslintRuleNames(rule);
    const names = eslintNames.filter(isKept);

    group.names.push(...names);
  }

  return Array.from(groups.values());
};

const hasNames = (group: OffGroup): boolean => {
  return group.names.length > 0;
};

const toBlocks = (
  files: EslintFilePattern[],
  pathIgnores: string[],
  groups: OffGroup[]
): Linter.Config[] => {
  const toBlock = (group: OffGroup): Linter.Config => {
    const rules = toOffRules(group.names);
    const ignores = [...pathIgnores, ...group.ignores];
    const block: Linter.Config = { files, ignores, rules };

    return block;
  };

  return groups.filter(hasNames).map(toBlock);
};

export const oxlintOverlap = (config: OxlintConfig): Linter.Config[] => {
  const overrides = orderedOverrides(config);

  assertNoExcludeFiles(overrides);
  assertPrefixedRuleKeys(config);

  const plugins = enabledBuiltInPlugins(config);
  const toOverrideLayer = overrideLayerFor(plugins);
  const overrideLayers = overrides.map(toOverrideLayer);
  const topRules = topLevelRules(config);
  const baseRules = runnableRules(topRules, plugins);
  const ignorePatterns = config.ignorePatterns ?? [];
  const patternIgnores = toEslintIgnores(ignorePatterns);
  const pathIgnores = [...MINIFIED_FILES, ...patternIgnores];
  const baseLayer: OverlapLayer = {
    files: OXLINT_FILES,
    blockFiles: OXLINT_FILES,
    rules: baseRules
  };
  const baseGroups = layerGroups(baseLayer, overrideLayers, NO_NAMES);
  const [everywhere] = baseGroups;
  const offEverywhere = new Set(everywhere?.names);
  const overrideBlocks = (
    layer: OverlapLayer,
    index: number
  ): Linter.Config[] => {
    const laterLayers = overrideLayers.slice(index + 1);
    const groups = layerGroups(layer, laterLayers, offEverywhere);

    return toBlocks(layer.blockFiles, pathIgnores, groups);
  };
  const baseBlocks = toBlocks(OXLINT_FILES, pathIgnores, baseGroups);
  const scopedBlocks = overrideLayers.flatMap(overrideBlocks);

  return [...baseBlocks, ...scopedBlocks];
};
