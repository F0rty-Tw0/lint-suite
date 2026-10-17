import { isDeepStrictEqual } from 'node:util';

import { enabledRules, mismatch } from './parity-message.spec.util.ts';
import {
  ALWAYS_ON_PLUGINS,
  DEFAULT_PLUGINS
} from '../../common/oxlint-plugins.const.ts';
import { DROPPED_SETTINGS_PREFIX } from '../common/parity.const.ts';
import type { ParityInput } from '../common/parity.type.ts';

const prefixOf = (oxlintRule: string): string => {
  const index = oxlintRule.lastIndexOf('/');

  if (index < 0) return 'eslint';

  return oxlintRule.slice(0, index);
};

const WRITABLE_VALUES: unknown[] = [true, 'writable', 'writeable'];
const READONLY_VALUES: unknown[] = [false, 'readonly', 'readable'];

const normalizeGlobal = (value: unknown): unknown => {
  const isWritable = WRITABLE_VALUES.includes(value);

  if (isWritable) return 'writable';

  const isReadonly = READONLY_VALUES.includes(value);

  if (isReadonly) return 'readonly';

  return value;
};

export const pluginDiff = (input: ParityInput): string[] => {
  const diffs: string[] = [];
  const loaded = [
    ...ALWAYS_ON_PLUGINS,
    ...DEFAULT_PLUGINS,
    ...input.oxlint.plugins,
    ...input.oxlint.jsPlugins
  ];
  const oxlintRules = enabledRules(input.oxlint.rules);

  for (const [oxlintRule] of oxlintRules) {
    const prefix = prefixOf(oxlintRule);
    const reason = `plugin (${prefix} is not loaded)`;
    const isLoaded = loaded.includes(prefix);

    if (!isLoaded) {
      diffs.push(mismatch(input, oxlintRule, reason));
    }
  }

  return diffs;
};

export const settingsDiff = (input: ParityInput): string[] => {
  const diffs: string[] = [];
  const reason = 'settings (missing or different in oxlint)';

  for (const [key, value] of Object.entries(input.eslint.settings)) {
    const isDropped = key.startsWith(DROPPED_SETTINGS_PREFIX);
    const isEqual = isDeepStrictEqual(input.oxlint.settings[key], value);

    if (!isDropped && !isEqual) {
      diffs.push(mismatch(input, key, reason));
    }
  }

  return diffs;
};

export const globalsDiff = (input: ParityInput): string[] => {
  const eslintGlobals = input.eslint.globals;
  const oxlintGlobals = input.oxlint.globals;
  const eslintNames = Object.keys(eslintGlobals);
  const oxlintNames = Object.keys(oxlintGlobals);
  const uniqueNames = new Set([...eslintNames, ...oxlintNames]);
  const names = Array.from(uniqueNames);
  const isDifferent = (name: string): boolean => {
    const eslintValue = normalizeGlobal(eslintGlobals[name]);
    const oxlintValue = normalizeGlobal(oxlintGlobals[name]);

    return !isDeepStrictEqual(eslintValue, oxlintValue);
  };
  const differing = names.filter(isDifferent);
  const shown = differing.slice(0, 10).join(', ');
  const reason = `${differing.length} names differ (${shown})`;
  const diffs = [mismatch(input, 'globals', reason)];

  if (differing.length === 0) return [];

  return diffs;
};
