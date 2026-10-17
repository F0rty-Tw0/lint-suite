import type { Linter } from 'eslint';
import type { DummyRuleMap, OxlintConfig, OxlintOverride } from 'oxlint';
import { describe, expect, it } from 'vitest';

import { oxlintOverlap } from './eslint.ts';
import {
  MINIFIED_GLOBS,
  OXLINT_GLOBS
} from './test/common/oxlint-globs.const.ts';
import { eslintConfigFor } from './test/utils/eslint-sample-config.spec.util.ts';
import {
  consoleSeverity,
  overlapOffNames
} from './test/utils/overlap.spec.util.ts';
import { normalizeSeverity } from './utils/rule-name.util.ts';

describe('FEATURE: oxlintOverlap', () => {
  describe('GIVEN top-level rules, some enabled', () => {
    const unusedVarsOptions = { args: 'none' };
    const rules: DummyRuleMap = {
      'eslint/no-console': 'error',
      'eslint/no-debugger': 0,
      'eslint/no-unused-vars': ['warn', unusedVarsOptions],
      'typescript/no-explicit-any': 'deny',
      'local/one-line-guard': 'error'
    };
    const config: OxlintConfig = { rules };

    it('WHEN it is overlapped THEN one block over the oxlint files turns every enabled rule off under all its ESLint names', () => {
      const offRules = {
        'no-console': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'local/one-line-guard': 'off'
      };
      const expected = [
        { files: OXLINT_GLOBS, ignores: MINIFIED_GLOBS, rules: offRules }
      ];

      const blocks = oxlintOverlap(config);

      expect(blocks).toEqual(expected);
    });

    it('WHEN it is overlapped THEN a rule set to off is not touched', () => {
      const names = overlapOffNames(config);

      expect(names).not.toContain('no-debugger');
    });

    it('WHEN ESLint evaluates a file oxlint never lints THEN the rule stays on', async () => {
      const htmlRules: Linter.RulesRecord = { 'no-console': 'error' };
      const htmlOn: Linter.Config = { files: ['**/*.html'], rules: htmlRules };
      const overlay = oxlintOverlap(config);
      const combined = [htmlOn, ...overlay];

      const sampleConfig = await eslintConfigFor(combined, 'src/a.html');
      const severity = normalizeSeverity(sampleConfig.rules['no-console']);

      expect(severity).toBe('error');
    });
  });

  describe('GIVEN a rule that is off at top level and on in an override', () => {
    const rules: DummyRuleMap = { 'eslint/no-console': 'off' };
    const overrideRules: DummyRuleMap = {
      'eslint/no-console': 'error',
      'eslint/no-debugger': 'error'
    };
    const override: OxlintOverride = {
      files: ['src/**/*.spec.ts'],
      rules: overrideRules
    };
    const config: OxlintConfig = { rules, overrides: [override] };

    it('WHEN it is overlapped THEN the only block has the override files and turns it off', () => {
      const offRules = { 'no-console': 'off', 'no-debugger': 'off' };
      const files = ['src/**/*.spec.ts'];
      const expected = [{ files, ignores: MINIFIED_GLOBS, rules: offRules }];

      const blocks = oxlintOverlap(config);

      expect(blocks).toEqual(expected);
    });
  });

  describe('GIVEN a rule enabled at top level and again in an override', () => {
    const rules: DummyRuleMap = { 'eslint/no-console': 'error' };
    const overrideRules: DummyRuleMap = {
      'eslint/no-console': 'warn',
      'eslint/no-debugger': 'error'
    };
    const override: OxlintOverride = {
      files: ['**/*.ts'],
      rules: overrideRules
    };
    const config: OxlintConfig = { rules, overrides: [override] };

    it('WHEN it is overlapped THEN the override block holds only the override-only rule', () => {
      const offRules = { 'no-debugger': 'off' };
      const files = ['**/*.ts'];
      const expected = { files, ignores: MINIFIED_GLOBS, rules: offRules };

      const [, scoped] = oxlintOverlap(config);

      expect(scoped).toEqual(expected);
    });
  });

  describe('GIVEN overrides that turn top-level rules off', () => {
    const rules: DummyRuleMap = {
      'eslint/no-var': 'error',
      'eslint/no-console': 'error',
      'eslint/no-debugger': 'error',
      'eslint/eqeqeq': 'error'
    };
    const specRules: DummyRuleMap = {
      'eslint/no-console': 'off',
      'eslint/no-debugger': 'off'
    };
    const scriptRules: DummyRuleMap = { 'eslint/eqeqeq': 'off' };
    const specOverride: OxlintOverride = {
      files: ['*.spec.ts'],
      rules: specRules
    };
    const scriptOverride: OxlintOverride = {
      files: ['scripts/**'],
      rules: scriptRules
    };
    const overrides = [specOverride, scriptOverride];
    const config: OxlintConfig = { rules, overrides };

    it('WHEN it is overlapped THEN rules with the same turned-off files share a block that ignores those files', () => {
      const varOff = { 'no-var': 'off' };
      const consoleOff = { 'no-console': 'off', 'no-debugger': 'off' };
      const eqeqeqOff = { eqeqeq: 'off' };
      const specIgnores = ['**/*.spec.ts', ...MINIFIED_GLOBS];
      const scriptsIgnores = ['scripts/**', ...MINIFIED_GLOBS];
      const expected = [
        { files: OXLINT_GLOBS, ignores: MINIFIED_GLOBS, rules: varOff },
        { files: OXLINT_GLOBS, ignores: specIgnores, rules: consoleOff },
        { files: OXLINT_GLOBS, ignores: scriptsIgnores, rules: eqeqeqOff }
      ];

      const blocks = oxlintOverlap(config);

      expect(blocks).toEqual(expected);
    });

    it.each([
      ['src/a.ts', 'off'],
      ['src/a.spec.ts', 'error'],
      ['a.spec.ts', 'error'],
      ['src/a.min.ts', 'error'],
      ['src/a-min.ts', 'error'],
      ['src/a_min.ts', 'error']
    ])(
      'WHEN ESLint evaluates %s THEN no-console is %s',
      async (sample, severity) => {
        const actual = await consoleSeverity(config, sample);

        expect(actual).toBe(severity);
      }
    );
  });
});
