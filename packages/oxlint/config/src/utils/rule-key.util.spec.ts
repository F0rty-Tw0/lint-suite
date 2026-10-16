import type { DummyRuleMap, OxlintConfig, OxlintOverride } from 'oxlint';
import { describe, expect, it } from 'vitest';

import {
  assertPrefixedRuleKeys,
  canonicalRules,
  pluginOfRuleKey,
  toCanonicalRuleKey
} from './rule-key.util.ts';

const ALIAS_CASES: [string, string][] = [
  ['eslint/no-console', 'eslint/no-console'],
  ['typescript/default-param-last', 'eslint/default-param-last'],
  ['@typescript-eslint/no-explicit-any', 'typescript/no-explicit-any'],
  ['import-x/no-self-import', 'import/no-self-import'],
  ['eslint-plugin-unicorn/no-null', 'unicorn/no-null'],
  ['react-hooks/exhaustive-deps', 'react/exhaustive-deps'],
  ['jsx_a11y/alt-text', 'jsx-a11y/alt-text'],
  [
    'react_perf/jsx-no-new-object-as-prop',
    'react-perf/jsx-no-new-object-as-prop'
  ],
  ['@next/next/no-img-element', 'nextjs/no-img-element'],
  [
    'deepscan/bad-array-method-on-arguments',
    'oxc/bad-array-method-on-arguments'
  ]
];

const JS_PLUGIN_KEYS: string[] = [
  'local/one-line-guard',
  '@angular-eslint/no-output-rename',
  '@smarttools/rxjs/no-index',
  'eslint-plugin-custom/rule'
];

describe('FEATURE: rule keys', () => {
  describe('GIVEN keys oxlint resolves through a plugin alias, probed on oxlint 1.88', () => {
    it.each(ALIAS_CASES)(
      'WHEN %s is made canonical THEN it is %s',
      (key, expected) => {
        const canonical = toCanonicalRuleKey(key);

        expect(canonical).toBe(expected);
      }
    );
  });

  describe('GIVEN keys of JS plugins', () => {
    it.each(JS_PLUGIN_KEYS)(
      'WHEN %s is made canonical THEN it is unchanged',
      (key) => {
        const canonical = toCanonicalRuleKey(key);

        expect(canonical).toBe(key);
      }
    );
  });

  describe('GIVEN a key without a plugin prefix', () => {
    it('WHEN it is in the top-level rules THEN it throws naming the key, its place and the fix', () => {
      const rules: DummyRuleMap = { 'no-null': 'error' };
      const config: OxlintConfig = { rules };

      const assertKeys = (): void => assertPrefixedRuleKeys(config);

      expect(assertKeys).toThrow(
        "Bare rule name 'no-null' in rules is not supported: oxlint resolves it through its own rule registry. Write it with its plugin prefix, e.g. 'eslint/no-null' or 'unicorn/no-null'."
      );
    });

    it('WHEN it is in an override of an extended config THEN the error names that override', () => {
      const rules: DummyRuleMap = { 'no-null': 'off' };
      const override: OxlintOverride = { files: ['**/*.ts'], rules };
      const parent: OxlintConfig = { overrides: [override] };
      const config: OxlintConfig = { extends: [parent] };

      const assertKeys = (): void => assertPrefixedRuleKeys(config);

      expect(assertKeys).toThrow(
        "Bare rule name 'no-null' in extends[0].overrides[0].rules"
      );
    });

    it('WHEN every key has a prefix THEN nothing is thrown', () => {
      const rules: DummyRuleMap = { 'unicorn/no-null': 'error' };
      const config: OxlintConfig = { rules };

      const assertKeys = (): void => assertPrefixedRuleKeys(config);

      expect(assertKeys).not.toThrow();
    });
  });

  describe('GIVEN canonical keys', () => {
    it.each([
      ['eslint/no-console', 'eslint'],
      ['@smarttools/rxjs/no-index', '@smarttools/rxjs']
    ])('WHEN the plugin of %s is read THEN it is %s', (key, expected) => {
      const plugin = pluginOfRuleKey(key);

      expect(plugin).toBe(expected);
    });
  });

  describe('GIVEN a rules record', () => {
    it('WHEN its keys are made canonical THEN a later alias overwrites an earlier spelling', () => {
      const rules = {
        'eslint/default-param-last': 'error',
        'typescript/default-param-last': 'off'
      };

      const canonical = canonicalRules(rules);

      expect(canonical).toEqual({ 'eslint/default-param-last': 'off' });
    });

    it('WHEN it is missing THEN the result is empty', () => {
      const canonical = canonicalRules(undefined);

      expect(canonical).toEqual({});
    });
  });
});
