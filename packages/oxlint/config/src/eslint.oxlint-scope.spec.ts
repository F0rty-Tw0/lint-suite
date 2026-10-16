import type { Linter } from 'eslint';
import type { DummyRuleMap, OxlintConfig, OxlintOverride } from 'oxlint';
import { describe, expect, it } from 'vitest';

import { oxlintOverlap } from './eslint.ts';
import { OXLINT_GLOBS } from './test/common/oxlint-globs.const.ts';
import { eslintConfigFor } from './test/utils/eslint-sample-config.spec.util.ts';
import { overlapOffNames } from './test/utils/overlap.spec.util.ts';
import { defineLintSuiteConfig } from './utils/define-lint-suite-config.util.ts';
import { normalizeSeverity } from './utils/rule-name.util.ts';

const coreRules: Linter.RulesRecord = {
  'no-console': 'error',
  'default-param-last': 'error'
};

const coreRulesOn: Linter.Config = { files: ['**/*.ts'], rules: coreRules };

const severityAfterOverlap = async (
  config: OxlintConfig,
  rule: string,
  sample: string
): Promise<string> => {
  const overlay = oxlintOverlap(config);
  const combined = [coreRulesOn, ...overlay];
  const sampleConfig = await eslintConfigFor(combined, sample);
  const entry = sampleConfig.rules[rule];

  return normalizeSeverity(entry);
};

const consoleError: DummyRuleMap = { 'eslint/no-console': 'error' };

const bareConsoleOff: DummyRuleMap = { 'no-console': 'off' };

const noNullOff: DummyRuleMap = { 'unicorn/no-null': 'off' };

const selfImportAndNoNull: DummyRuleMap = {
  'import/no-self-import': 'error',
  'unicorn/no-null': 'error'
};

const importPlugins: OxlintConfig = { plugins: ['import'] };

const paramLastError: DummyRuleMap = { 'eslint/default-param-last': 'error' };

const tsParamLastOff: DummyRuleMap = { 'typescript/default-param-last': 'off' };

const scriptsParamLastOff: OxlintOverride = {
  files: ['scripts/**'],
  rules: tsParamLastOff
};

const aliasOffConfig: OxlintConfig = {
  rules: paramLastError,
  overrides: [scriptsParamLastOff]
};

const selfImportError: DummyRuleMap = { 'import/no-self-import': 'error' };

const selfImportXOff: DummyRuleMap = { 'import-x/no-self-import': 'off' };

const scriptsSelfImportOff: OxlintOverride = {
  files: ['scripts/**'],
  rules: selfImportXOff
};

const scopedAliasOffConfig: OxlintConfig = {
  plugins: ['import'],
  rules: selfImportError,
  overrides: [scriptsSelfImportOff]
};

const consoleErrorConfig: OxlintConfig = { rules: consoleError };

const bareConsoleOffConfig: OxlintConfig = { rules: bareConsoleOff };

const bareOffConfig = defineLintSuiteConfig(
  consoleErrorConfig,
  bareConsoleOffConfig
);

const typescriptOnlyRules: DummyRuleMap = {
  'unicorn/no-null': 'error',
  'import/no-self-import': 'error',
  'typescript/no-explicit-any': 'error',
  'eslint/no-console': 'error'
};

const typescriptOnlyConfig: OxlintConfig = {
  plugins: ['typescript'],
  rules: typescriptOnlyRules
};

const defaultPluginsRules: DummyRuleMap = {
  'unicorn/no-null': 'error',
  'oxc/erasing-op': 'error',
  'jest/no-focused-tests': 'error'
};

const defaultPluginsConfig: OxlintConfig = { rules: defaultPluginsRules };

const extendedImportConfig: OxlintConfig = {
  extends: [importPlugins],
  rules: selfImportAndNoNull
};

const ownPluginsConfig: OxlintConfig = {
  extends: [importPlugins],
  plugins: ['vitest'],
  rules: selfImportAndNoNull
};

const scriptsPluginRules: DummyRuleMap = {
  'unicorn/no-null': 'error',
  'import/no-namespace': 'error',
  'import/no-self-import': 'error'
};

const scriptsPluginsOverride: OxlintOverride = {
  files: ['scripts/**'],
  plugins: ['unicorn', 'import'],
  rules: scriptsPluginRules
};

const oldScriptsOffOverride: OxlintOverride = {
  files: ['scripts/old/**'],
  rules: noNullOff
};

const overridePluginsConfig: OxlintConfig = {
  plugins: ['typescript'],
  overrides: [scriptsPluginsOverride, oldScriptsOffOverride]
};

const hasNoNull = (block: Linter.Config): boolean => {
  const rules = block.rules ?? {};

  return 'unicorn/no-null' in rules;
};

const withScripts = (glob: string): string[] => {
  const pair = ['scripts/**', glob];

  return pair;
};

const scriptsFiles = OXLINT_GLOBS.map(withScripts);

const scriptsBlockRules: Linter.RulesRecord = {
  'unicorn/no-null': 'off',
  'import-x/no-namespace': 'off'
};

const scriptsBlock: Linter.Config = {
  files: scriptsFiles,
  rules: scriptsBlockRules
};

const ignorePatternsConfig: OxlintConfig = {
  ignorePatterns: ['generated/**', 'gen', 'src/**', '!src/keep.ts']
};

const ignoredConfig = defineLintSuiteConfig(
  consoleErrorConfig,
  ignorePatternsConfig
);

describe('FEATURE: oxlintOverlap follows how oxlint resolves rule keys, plugins and ignores', () => {
  describe('GIVEN a top-level rule turned off in an override under an alias oxlint treats as the same rule', () => {
    it('WHEN ESLint evaluates scripts/a.ts THEN the rule stays on', async () => {
      const severity = await severityAfterOverlap(
        aliasOffConfig,
        'default-param-last',
        'scripts/a.ts'
      );

      expect(severity).toBe('error');
    });

    it('WHEN ESLint evaluates src/a.ts THEN the rule is off', async () => {
      const severity = await severityAfterOverlap(
        aliasOffConfig,
        'default-param-last',
        'src/a.ts'
      );

      expect(severity).toBe('off');
    });

    it('WHEN the alias is a plugin prefix THEN the rule block ignores the override files', () => {
      const blocks = oxlintOverlap(scopedAliasOffConfig);

      const selfImportOff = { 'import-x/no-self-import': 'off' };
      const expected = [
        { files: OXLINT_GLOBS, ignores: ['scripts/**'], rules: selfImportOff }
      ];

      expect(blocks).toEqual(expected);
    });
  });

  describe('GIVEN a rule key without a plugin prefix', () => {
    it('WHEN it is overlapped THEN it throws naming the key and its place', () => {
      const overlap = (): Linter.Config[] => oxlintOverlap(bareOffConfig);

      expect(overlap).toThrow(
        "Bare rule name 'no-console' in extends[1].rules"
      );
    });
  });

  describe('GIVEN plugins set to typescript only', () => {
    it('WHEN it is overlapped THEN rules of plugins oxlint skips are not turned off', () => {
      const names = overlapOffNames(typescriptOnlyConfig);

      expect(names).toEqual([
        '@typescript-eslint/no-explicit-any',
        'no-console'
      ]);
    });
  });

  describe('GIVEN no plugins field anywhere', () => {
    it('WHEN it is overlapped THEN rules of the default plugins are turned off and others are not', () => {
      const names = overlapOffNames(defaultPluginsConfig);

      expect(names).toEqual(['oxc/erasing-op', 'unicorn/no-null']);
    });
  });

  describe('GIVEN an extended config that sets plugins and a root that does not', () => {
    it('WHEN it is overlapped THEN the extended plugins join the default plugins', () => {
      const names = overlapOffNames(extendedImportConfig);

      expect(names).toEqual(['import-x/no-self-import', 'unicorn/no-null']);
    });
  });

  describe('GIVEN a root that sets its own plugins', () => {
    it('WHEN it is overlapped THEN the default plugins are dropped', () => {
      const names = overlapOffNames(ownPluginsConfig);

      expect(names).toEqual(['import-x/no-self-import']);
    });
  });

  describe('GIVEN an override that enables plugins the root does not, probed on oxlint 1.88', () => {
    it('WHEN it is overlapped THEN its rules are turned off except the module-graph rules oxlint skips there', () => {
      const names = overlapOffNames(overridePluginsConfig);

      expect(names).toEqual(['import-x/no-namespace', 'unicorn/no-null']);
    });

    it('WHEN a later override turns a rule off without enabling its plugin THEN the block does not ignore its files', () => {
      const blocks = oxlintOverlap(overridePluginsConfig);
      const noNullBlock = blocks.find(hasNoNull);

      expect(noNullBlock).toEqual(scriptsBlock);
    });
  });

  describe('GIVEN ignorePatterns hoisted to the root', () => {
    it.each([
      ['generated/a.ts', 'error'],
      ['gen/a.ts', 'error'],
      ['x/gen/a.ts', 'error'],
      ['src/a.ts', 'error'],
      ['src/keep.ts', 'off'],
      ['lib/a.ts', 'off']
    ])(
      'WHEN ESLint evaluates %s THEN no-console is %s',
      async (sample, severity) => {
        const actual = await severityAfterOverlap(
          ignoredConfig,
          'no-console',
          sample
        );

        expect(actual).toBe(severity);
      }
    );
  });
});
