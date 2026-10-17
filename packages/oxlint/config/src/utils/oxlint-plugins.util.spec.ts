import type { OxlintConfig, OxlintOverride } from 'oxlint';
import { describe, expect, it } from 'vitest';

import {
  enabledBuiltInPlugins,
  isRulePluginEnabled,
  overrideRunnableRules,
  runnableRules
} from './oxlint-plugins.util.ts';

type PluginTreeCase = {
  readonly tree: string;
  readonly config: OxlintConfig;
  readonly expected: string[];
};

const DEFAULT_SET: string[] = ['eslint', 'unicorn', 'typescript', 'oxc'];

const importOnly: OxlintConfig = { plugins: ['import'] };
const vitestOnly: OxlintConfig = { plugins: ['vitest'] };
const noPlugins: OxlintConfig = { plugins: [] };
const extendsImport: OxlintConfig = { extends: [importOnly] };
const vitestOverImport: OxlintConfig = {
  extends: [importOnly],
  plugins: ['vitest']
};
const emptyConfig: OxlintConfig = {};
const vitestOverEmpty: OxlintConfig = {
  extends: [emptyConfig],
  plugins: ['vitest']
};

describe('FEATURE: oxlint plugins, probed with --print-config on oxlint 1.88', () => {
  describe('GIVEN plugin fields across the config tree', () => {
    it.each<PluginTreeCase>([
      { tree: 'no plugins field', config: {}, expected: DEFAULT_SET },
      {
        tree: 'an empty plugins field',
        config: noPlugins,
        expected: ['eslint']
      },
      {
        tree: 'a root plugins field',
        config: vitestOnly,
        expected: ['eslint', 'vitest']
      },
      {
        tree: 'a root without plugins extending one with plugins',
        config: extendsImport,
        expected: ['eslint', 'import', 'unicorn', 'typescript', 'oxc']
      },
      {
        tree: 'a root with plugins extending one with plugins',
        config: vitestOverImport,
        expected: ['eslint', 'import', 'vitest']
      },
      {
        tree: 'a root with plugins extending one without',
        config: vitestOverEmpty,
        expected: ['eslint', 'unicorn', 'typescript', 'oxc', 'vitest']
      }
    ])(
      'WHEN the tree has $tree THEN the enabled plugins match',
      ({ config, expected }) => {
        const plugins = enabledBuiltInPlugins(config);

        expect(plugins).toEqual(expected);
      }
    );
  });

  describe('GIVEN the enabled plugins eslint and typescript', () => {
    const plugins = ['eslint', 'typescript'];

    it.each([
      ['eslint/no-console', true],
      ['typescript/no-explicit-any', true],
      ['unicorn/no-null', false],
      ['import/no-self-import', false],
      ['local/one-line-guard', true]
    ])(
      'WHEN %s is checked THEN its plugin is enabled is %s',
      (key, expected) => {
        const isEnabled = isRulePluginEnabled(key, plugins);

        expect(isEnabled).toBe(expected);
      }
    );

    it('WHEN a rules record is filtered THEN only rules of enabled or JS plugins remain', () => {
      const rules = {
        'eslint/no-console': 'error',
        'unicorn/no-null': 'off',
        'local/one-line-guard': 'error'
      };

      const runnable = runnableRules(rules, plugins);

      expect(runnable).toEqual({
        'eslint/no-console': 'error',
        'local/one-line-guard': 'error'
      });
    });
  });

  describe('GIVEN an override that enables unicorn and import, probed with real runs on oxlint 1.88', () => {
    const override: OxlintOverride = {
      files: ['scripts/**'],
      plugins: ['unicorn', 'import']
    };
    const rules = {
      'unicorn/no-null': 'error',
      'import/no-namespace': 'error',
      'import/no-self-import': 'error',
      'vitest/no-focused-tests': 'error'
    };

    it('WHEN the base plugins lack import THEN module-graph import rules do not run', () => {
      const runnable = overrideRunnableRules(rules, ['eslint'], override);

      expect(runnable).toEqual({
        'unicorn/no-null': 'error',
        'import/no-namespace': 'error'
      });
    });

    it('WHEN the base plugins include import THEN module-graph import rules run', () => {
      const basePlugins = ['eslint', 'import'];

      const runnable = overrideRunnableRules(rules, basePlugins, override);

      expect(runnable).toEqual({
        'unicorn/no-null': 'error',
        'import/no-namespace': 'error',
        'import/no-self-import': 'error'
      });
    });
  });
});
