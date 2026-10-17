import type { OxlintConfig, OxlintOverride } from 'oxlint';

import { pluginOfRuleKey } from './rule-key.util.ts';
import {
  ALWAYS_ON_PLUGINS,
  BUILT_IN_PLUGINS,
  DEFAULT_PLUGINS,
  MODULE_GRAPH_PLUGIN,
  MODULE_GRAPH_RULES
} from '../common/oxlint-plugins.const.ts';

const treePlugins = (config: OxlintConfig): string[] => {
  const extended = config.extends ?? [];
  const inherited = extended.flatMap(treePlugins);
  const own = config.plugins ?? DEFAULT_PLUGINS;

  return [...inherited, ...own];
};

const pickRules = (
  rules: Readonly<Record<string, unknown>>,
  isRunnable: (key: string) => boolean
): Record<string, unknown> => {
  const runnable: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(rules)) {
    const isKept = isRunnable(key);

    if (isKept) {
      runnable[key] = entry;
    }
  }

  return runnable;
};

export const enabledBuiltInPlugins = (config: OxlintConfig): string[] => {
  const plugins = treePlugins(config);
  const unique = new Set([...ALWAYS_ON_PLUGINS, ...plugins]);

  return Array.from(unique);
};

export const isRulePluginEnabled = (
  key: string,
  plugins: string[]
): boolean => {
  const plugin = pluginOfRuleKey(key);
  const isBuiltIn = BUILT_IN_PLUGINS.includes(plugin);

  if (!isBuiltIn) return true;

  return plugins.includes(plugin);
};

export const runnableRules = (
  rules: Readonly<Record<string, unknown>>,
  plugins: string[]
): Record<string, unknown> => {
  const isRunnable = (key: string): boolean => {
    return isRulePluginEnabled(key, plugins);
  };

  return pickRules(rules, isRunnable);
};

export const overrideRunnableRules = (
  rules: Readonly<Record<string, unknown>>,
  basePlugins: string[],
  override: OxlintOverride
): Record<string, unknown> => {
  const ownPlugins = override.plugins ?? [];
  const layerPlugins = [...basePlugins, ...ownPlugins];
  const hasModuleGraph = basePlugins.includes(MODULE_GRAPH_PLUGIN);
  const isRunnable = (key: string): boolean => {
    const needsModuleGraph = MODULE_GRAPH_RULES.includes(key);

    if (needsModuleGraph && !hasModuleGraph) return false;

    return isRulePluginEnabled(key, layerPlugins);
  };

  return pickRules(rules, isRunnable);
};
