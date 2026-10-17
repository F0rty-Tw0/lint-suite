import { isDeepStrictEqual } from 'node:util';

import {
  globalsDiff,
  pluginDiff,
  settingsDiff
} from './environment-diff.spec.util.ts';
import { appliesToSample } from './missing-scope.spec.util.ts';
import { enabledRules, mismatch } from './parity-message.spec.util.ts';
import { lintsFile } from '../../utils/resolve-oxlint-config.util.ts';
import {
  isEnabled,
  normalizeSeverity,
  toEslintRuleNames,
  toOxlintRuleName
} from '../../utils/rule-name.util.ts';
import { TYPE_AWARE_ONLY_CAUSE } from '../common/parity.const.ts';
import type { ParityInput } from '../common/parity.type.ts';

const optionsOf = (entry: unknown): unknown[] => {
  if (!Array.isArray(entry)) return [];

  return entry.slice(1);
};

const isExpectedMissing = (input: ParityInput, rule: string): boolean => {
  const cause = input.missing.causes.get(rule);

  if (cause === undefined) return false;

  const isScoped = appliesToSample(input.missing, rule, input.sample);

  if (!isScoped) return false;

  if (cause !== TYPE_AWARE_ONLY_CAUSE) return true;

  return !input.typeAware;
};

const compareRule = (
  input: ParityInput,
  rule: string,
  eslintEntry: unknown
): string[] => {
  const oxlintName = toOxlintRuleName(rule);
  const oxlintEntry = input.oxlint.rules[oxlintName];
  const eslintSeverity = normalizeSeverity(eslintEntry);
  const oxlintSeverity = normalizeSeverity(oxlintEntry);
  const eslintOptions = optionsOf(eslintEntry);
  const oxlintOptions = optionsOf(oxlintEntry);
  const sameOptions = isDeepStrictEqual(eslintOptions, oxlintOptions);
  const isDeviation = input.missing.deviations.has(rule);
  const missingReason = `missing (expected ${oxlintName})`;
  const severityReason = `severity (eslint ${eslintSeverity}, oxlint ${oxlintSeverity})`;
  const optionsReason = `options (eslint ${JSON.stringify(eslintOptions)}, oxlint ${JSON.stringify(oxlintOptions)})`;
  const missing = [mismatch(input, rule, missingReason)];
  const diffs: string[] = [];

  if (oxlintSeverity === 'off') return missing;

  if (oxlintSeverity !== eslintSeverity) {
    diffs.push(mismatch(input, rule, severityReason));
  }

  if (!sameOptions && !isDeviation) {
    diffs.push(mismatch(input, rule, optionsReason));
  }

  return diffs;
};

const forwardDiff = (input: ParityInput): string[] => {
  const diffs: string[] = [];
  const eslintRules = enabledRules(input.eslint.rules);

  for (const [rule, entry] of eslintRules) {
    const isMissing = isExpectedMissing(input, rule);

    if (isMissing) continue;

    const ruleDiffs = compareRule(input, rule, entry);

    diffs.push(...ruleDiffs);
  }

  return diffs;
};

const listedRuleDiff = (input: ParityInput): string[] => {
  const diffs: string[] = [];

  for (const [rule, cause] of input.missing.causes) {
    const isPorted = cause === TYPE_AWARE_ONLY_CAUSE && input.typeAware;
    const isScoped = appliesToSample(input.missing, rule, input.sample);
    const oxlintName = toOxlintRuleName(rule);
    const isOn = isEnabled(input.oxlint.rules[oxlintName]);
    const reason = `reverse (listed under "${cause}", enabled in oxlint)`;

    if (isScoped && !isPorted && isOn) {
      diffs.push(mismatch(input, rule, reason));
    }
  }

  return diffs;
};

const unlistedRuleDiff = (input: ParityInput): string[] => {
  const diffs: string[] = [];
  const reason = 'reverse (enabled in oxlint, no enabled ESLint counterpart)';
  const isEnabledInEslint = (name: string): boolean => {
    return isEnabled(input.eslint.rules[name]);
  };
  const oxlintRules = enabledRules(input.oxlint.rules);

  for (const [oxlintRule] of oxlintRules) {
    const names = toEslintRuleNames(oxlintRule);
    const hasCounterpart = names.some(isEnabledInEslint);

    if (!hasCounterpart) {
      diffs.push(mismatch(input, oxlintRule, reason));
    }
  }

  return diffs;
};

export const parityDiff = (input: ParityInput): string[] => {
  const forward = forwardDiff(input);
  const listed = listedRuleDiff(input);
  const unlisted = unlistedRuleDiff(input);
  const plugins = pluginDiff(input);
  const common = [...forward, ...listed, ...unlisted, ...plugins];
  const isLinted = lintsFile(input.sample);

  if (!isLinted) return common;

  const settings = settingsDiff(input);
  const globals = globalsDiff(input);

  return [...common, ...settings, ...globals];
};
