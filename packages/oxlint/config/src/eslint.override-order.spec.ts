import type { Linter } from 'eslint';
import type { DummyRuleMap, OxlintConfig, OxlintOverride } from 'oxlint';
import { describe, expect, it } from 'vitest';

import { oxlintOverlap } from './eslint.ts';
import { CONSOLE_ON } from './test/common/overlap.const.ts';
import {
  MINIFIED_GLOBS,
  OXLINT_GLOBS
} from './test/common/oxlint-globs.const.ts';
import { eslintConfigFor } from './test/utils/eslint-sample-config.spec.util.ts';
import { consoleSeverity } from './test/utils/overlap.spec.util.ts';
import { normalizeSeverity } from './utils/rule-name.util.ts';

const CONSOLE_ERROR: DummyRuleMap = { 'eslint/no-console': 'error' };

const CONSOLE_OFF: DummyRuleMap = { 'eslint/no-console': 'off' };

const ESLINT_CONSOLE_OFF: Linter.RulesRecord = { 'no-console': 'off' };

const BARE_GLOB_OVERRIDE: OxlintOverride = {
  files: ['*.ts'],
  rules: CONSOLE_ERROR
};

const BARE_GLOB_CONFIG: OxlintConfig = { overrides: [BARE_GLOB_OVERRIDE] };

describe('FEATURE: oxlintOverlap override order', () => {
  describe('GIVEN a later override that turns a rule back on', () => {
    const scriptsOff: OxlintOverride = {
      files: ['scripts/**'],
      rules: CONSOLE_OFF
    };
    const keepOn: OxlintOverride = {
      files: ['scripts/keep/**'],
      rules: CONSOLE_ERROR
    };
    const overrides = [scriptsOff, keepOn];
    const config: OxlintConfig = { rules: CONSOLE_ERROR, overrides };

    it('WHEN it is overlapped THEN the re-enabling override gets its own block', () => {
      const keepFiles = [
        ['scripts/keep/**', '**/*.js'],
        ['scripts/keep/**', '**/*.jsx'],
        ['scripts/keep/**', '**/*.cjs'],
        ['scripts/keep/**', '**/*.mjs'],
        ['scripts/keep/**', '**/*.ts'],
        ['scripts/keep/**', '**/*.tsx'],
        ['scripts/keep/**', '**/*.cts'],
        ['scripts/keep/**', '**/*.mts']
      ];
      const scriptsIgnores = ['scripts/**', ...MINIFIED_GLOBS];
      const expected = [
        {
          files: OXLINT_GLOBS,
          ignores: scriptsIgnores,
          rules: ESLINT_CONSOLE_OFF
        },
        { files: keepFiles, ignores: MINIFIED_GLOBS, rules: ESLINT_CONSOLE_OFF }
      ];

      const blocks = oxlintOverlap(config);

      expect(blocks).toEqual(expected);
    });

    it.each([
      ['scripts/a.ts', 'error'],
      ['scripts/keep/a.ts', 'off']
    ])(
      'WHEN ESLint evaluates %s THEN no-console is %s',
      async (sample, severity) => {
        const actual = await consoleSeverity(config, sample);

        expect(actual).toBe(severity);
      }
    );
  });

  describe('GIVEN an override rule that a later override turns off', () => {
    const tsOn: OxlintOverride = { files: ['**/*.ts'], rules: CONSOLE_ERROR };
    const specOff: OxlintOverride = {
      files: ['**/*.spec.ts'],
      rules: CONSOLE_OFF
    };
    const config: OxlintConfig = { overrides: [tsOn, specOff] };

    it('WHEN it is overlapped THEN its block ignores the later override files', () => {
      const specIgnores = ['**/*.spec.ts', ...MINIFIED_GLOBS];
      const expected = [
        {
          files: ['**/*.ts'],
          ignores: specIgnores,
          rules: ESLINT_CONSOLE_OFF
        }
      ];

      const blocks = oxlintOverlap(config);

      expect(blocks).toEqual(expected);
    });
  });

  describe('GIVEN a config that extends another', () => {
    const parentRules: DummyRuleMap = {
      'eslint/no-console': 'error',
      'eslint/no-debugger': 'error'
    };
    const eqeqeqRules: DummyRuleMap = { 'eslint/eqeqeq': 'error' };
    const varRules: DummyRuleMap = { 'eslint/no-var': 'error' };
    const debuggerOff: DummyRuleMap = { 'eslint/no-debugger': 'off' };
    const jsOverride: OxlintOverride = {
      files: ['**/*.js'],
      rules: eqeqeqRules
    };
    const tsOverride: OxlintOverride = { files: ['**/*.ts'], rules: varRules };
    const parent: OxlintConfig = {
      rules: parentRules,
      overrides: [jsOverride]
    };
    const child: OxlintConfig = {
      extends: [parent],
      rules: debuggerOff,
      overrides: [tsOverride]
    };

    it('WHEN it is overlapped THEN a later layer turning a rule off wins and override order is kept', () => {
      const eqeqeqOff = { eqeqeq: 'off' };
      const varOff = { 'no-var': 'off' };
      const expected = [
        {
          files: OXLINT_GLOBS,
          ignores: MINIFIED_GLOBS,
          rules: ESLINT_CONSOLE_OFF
        },
        { files: ['**/*.js'], ignores: MINIFIED_GLOBS, rules: eqeqeqOff },
        { files: ['**/*.ts'], ignores: MINIFIED_GLOBS, rules: varOff }
      ];

      const blocks = oxlintOverlap(child);

      expect(blocks).toEqual(expected);
    });
  });

  describe('GIVEN an override with excludeFiles', () => {
    const override: OxlintOverride = {
      files: ['**/*.ts'],
      excludeFiles: ['**/*.spec.ts'],
      rules: CONSOLE_ERROR
    };
    const config: OxlintConfig = { overrides: [override] };

    it('WHEN it is overlapped THEN it throws', () => {
      const overlap = (): Linter.Config[] => oxlintOverlap(config);

      expect(overlap).toThrow('excludeFiles is not supported');
    });
  });

  describe('GIVEN override files with and without a slash', () => {
    const slashedOverride: OxlintOverride = {
      files: ['src/*.ts', 'src/**/*.js'],
      rules: CONSOLE_ERROR
    };
    const slashed: OxlintConfig = { overrides: [slashedOverride] };

    it('WHEN a pattern has no slash THEN the ESLint files match it at any depth', () => {
      const [scoped] = oxlintOverlap(BARE_GLOB_CONFIG);

      expect(scoped?.files).toEqual(['**/*.ts']);
    });

    it('WHEN a pattern has a slash THEN it is copied unchanged', () => {
      const [scoped] = oxlintOverlap(slashed);

      expect(scoped?.files).toEqual(['src/*.ts', 'src/**/*.js']);
    });

    it.each(['a.ts', 'src/b.ts', 'src/x/c.ts'])(
      'WHEN ESLint evaluates %s with a bare *.ts override overlapped THEN the rule is off',
      async (sample) => {
        const severity = await consoleSeverity(BARE_GLOB_CONFIG, sample);

        expect(severity).toBe('off');
      }
    );

    it('WHEN the bare files are copied verbatim instead THEN ESLint keeps the rule on in src/b.ts', async () => {
      const verbatim: Linter.Config = {
        files: ['*.ts'],
        rules: ESLINT_CONSOLE_OFF
      };

      const combined = [CONSOLE_ON, verbatim];

      const sampleConfig = await eslintConfigFor(combined, 'src/b.ts');
      const severity = normalizeSeverity(sampleConfig.rules['no-console']);

      expect(severity).toBe('error');
    });
  });
});
