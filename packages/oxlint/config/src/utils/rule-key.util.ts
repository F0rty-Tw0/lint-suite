import type { OxlintConfig } from 'oxlint';

import { BUILT_IN_PLUGINS } from '../common/oxlint-plugins.const.ts';
import {
  ESLINT_PLUGIN_PACKAGE_PREFIX,
  PLUGIN_PREFIX_ALIASES,
  TS_EXTENSION_RULES
} from '../common/rule-name.const.ts';

const ESLINT_PLUGIN = 'eslint';
const TYPESCRIPT_PLUGIN = 'typescript';

const withoutPackagePrefix = (prefix: string): string => {
  const isPackageName = prefix.startsWith(ESLINT_PLUGIN_PACKAGE_PREFIX);

  if (!isPackageName) return prefix;

  return prefix.slice(ESLINT_PLUGIN_PACKAGE_PREFIX.length);
};

const toBuiltInPlugin = (prefix: string): string => {
  const unprefixed = withoutPackagePrefix(prefix);
  const plugin = PLUGIN_PREFIX_ALIASES[unprefixed] ?? unprefixed;
  const isBuiltIn = BUILT_IN_PLUGINS.includes(plugin);

  if (!isBuiltIn) return prefix;

  return plugin;
};

const bareNameError = (key: string, location: string): Error => {
  const message = `Bare rule name '${key}' in ${location} is not supported: oxlint resolves it through its own rule registry. Write it with its plugin prefix, e.g. 'eslint/${key}' or 'unicorn/${key}'.`;

  return new Error(message);
};

export const toCanonicalRuleKey = (key: string): string => {
  const slashIndex = key.lastIndexOf('/');

  if (slashIndex === -1) return key;

  const prefix = key.slice(0, slashIndex);
  const rule = key.slice(slashIndex + 1);
  const plugin = toBuiltInPlugin(prefix);
  const isExtension = TS_EXTENSION_RULES.includes(rule);
  const isTsExtension = plugin === TYPESCRIPT_PLUGIN && isExtension;
  const canonicalPlugin = isTsExtension ? ESLINT_PLUGIN : plugin;

  return `${canonicalPlugin}/${rule}`;
};

export const pluginOfRuleKey = (key: string): string => {
  const slashIndex = key.lastIndexOf('/');

  return key.slice(0, slashIndex);
};

export const canonicalRules = (
  rules: Readonly<Record<string, unknown>> | undefined
): Record<string, unknown> => {
  const canonical: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(rules ?? {})) {
    const canonicalKey = toCanonicalRuleKey(key);

    canonical[canonicalKey] = entry;
  }

  return canonical;
};

const isBareRuleName = (key: string): boolean => !key.includes('/');

const assertPrefixedKeys = (
  rules: Readonly<Record<string, unknown>> | undefined,
  location: string
): void => {
  const keys = Object.keys(rules ?? {});
  const bareKey = keys.find(isBareRuleName);

  if (bareKey !== undefined) throw bareNameError(bareKey, location);
};

export const assertPrefixedRuleKeys = (
  config: OxlintConfig,
  path = ''
): void => {
  const extended = config.extends ?? [];
  const overrides = config.overrides ?? [];

  for (const [index, parent] of extended.entries()) {
    assertPrefixedRuleKeys(parent, `${path}extends[${index}].`);
  }

  assertPrefixedKeys(config.rules, `${path}rules`);

  for (const [index, override] of overrides.entries()) {
    assertPrefixedKeys(override.rules, `${path}overrides[${index}].rules`);
  }
};
