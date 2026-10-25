import { describe, expect, it } from 'vitest';

import localPlugin from './local-plugin.ts';

const EXPECTED = [
  'arrow-fits-line',
  'chain-fits-line',
  'chain-receiver-name',
  'explicit-accessibility',
  'max-condition-operands',
  'no-grouped-condition',
  'no-inline-object-types',
  'no-inline-return-object',
  'no-nested-object-value',
  'no-spread-expression',
  'one-line-guard',
  'readonly-type-properties',
  'ternary-branch-shape',
  'test-file-shape',
  'type-placement',
  'util-purity'
];

describe('FEATURE: local plugin', () => {
  describe('GIVEN the plugin module', () => {
    it('WHEN it is loaded THEN meta.name is local', () => {
      const name = localPlugin.meta?.name;

      expect(name).toBe('local');
    });

    it('WHEN it is loaded THEN it holds the 16 type-free rules', () => {
      const rules = localPlugin.rules ?? {};

      const ruleNames = Object.keys(rules).sort();

      expect(ruleNames).toEqual(EXPECTED);
    });
  });
});
