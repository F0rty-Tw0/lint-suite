import type { OxlintConfig } from 'oxlint';

import { isRecord } from './record.spec.util.ts';
import { JS_PLUGINS } from '../../common/js-plugin.const.ts';
import type { JsPluginEntry } from '../../common/oxlint-config.type.ts';
import { DEFAULT_PLUGINS } from '../../common/oxlint-plugins.const.ts';
import type { Severity } from '../../common/rule-name.type.ts';
import {
  resolveOxlintConfig,
  topLevelRules
} from '../../utils/resolve-oxlint-config.util.ts';
import { isEnabled, normalizeSeverity } from '../../utils/rule-name.util.ts';
import type { PrintedConfig } from '../common/smoke.type.ts';

const ESLINT_PREFIX = 'eslint/';
const PROBE_FILE = 'src/a.ts';

const toRulePrefix = (plugin: JsPluginEntry): string => `${plugin.name}/`;

const JS_PLUGIN_PREFIXES = JS_PLUGINS.map(toRulePrefix);

const isNative = (ruleName: string): boolean => {
  const hasPrefix = (prefix: string): boolean => ruleName.startsWith(prefix);
  const isJsPlugin = JS_PLUGIN_PREFIXES.some(hasPrefix);

  return !isJsPlugin;
};

const bareName = (ruleName: string): string => {
  const isCore = ruleName.startsWith(ESLINT_PREFIX);

  if (!isCore) return ruleName;

  return ruleName.slice(ESLINT_PREFIX.length);
};

const enabledNativeRules = (
  rules: Readonly<Record<string, unknown>>
): Map<string, Severity> => {
  const enabled = new Map<string, Severity>();

  for (const [ruleName, entry] of Object.entries(rules)) {
    const isOn = isEnabled(entry);
    const isNativeRule = isNative(ruleName);

    if (isOn && isNativeRule) {
      const name = bareName(ruleName);
      const severity = normalizeSeverity(entry);

      enabled.set(name, severity);
    }
  }

  return enabled;
};

const rulesDiff = (
  printed: Map<string, Severity>,
  expected: Map<string, Severity>
): string[] => {
  const printedNames = printed.keys();
  const expectedNames = expected.keys();
  const names = new Set([...printedNames, ...expectedNames]);
  const sortedNames = Array.from(names).sort();
  const diffs: string[] = [];

  for (const name of sortedNames) {
    const printedEntry = printed.get(name);
    const expectedEntry = expected.get(name);
    const printedSeverity = printedEntry ?? 'absent';
    const expectedSeverity = expectedEntry ?? 'absent';
    const reason = `${name}: expected ${expectedSeverity}, printed ${printedSeverity}`;

    if (printedSeverity !== expectedSeverity) {
      diffs.push(reason);
    }
  }

  return diffs;
};

const pluginsDiff = (printed: string[], expected: string[]): string[] => {
  const printedSorted = printed.toSorted();
  const expectedSorted = expected.toSorted();
  const printedText = printedSorted.join(',');
  const expectedText = expectedSorted.join(',');
  const diffs = [`plugins: expected ${expectedText}, printed ${printedText}`];

  if (printedText === expectedText) return [];

  return diffs;
};

export const parsePrintedConfig = (stdout: string): PrintedConfig => {
  const printed: unknown = JSON.parse(stdout);

  if (!isRecord(printed)) throw new Error('printed config is not an object');

  const { plugins, rules } = printed;

  if (!Array.isArray(plugins)) throw new Error('printed config has no plugins');

  if (!isRecord(rules)) throw new Error('printed config has no rules');

  const pluginNames = plugins.map(String);
  const parsed: PrintedConfig = { plugins: pluginNames, rules };

  return parsed;
};

export const printedConfigDiff = (
  printed: PrintedConfig,
  config: OxlintConfig
): string[] => {
  const resolved = resolveOxlintConfig(config, PROBE_FILE);
  const declared = [...resolved.plugins, ...DEFAULT_PLUGINS];
  const uniqueDeclared = new Set(declared);
  const expectedPlugins = Array.from(uniqueDeclared);
  const baseRules = topLevelRules(config);
  const printedRules = enabledNativeRules(printed.rules);
  const expectedRules = enabledNativeRules(baseRules);
  const pluginDiffs = pluginsDiff(printed.plugins, expectedPlugins);
  const ruleDiffs = rulesDiff(printedRules, expectedRules);

  return [...pluginDiffs, ...ruleDiffs];
};
