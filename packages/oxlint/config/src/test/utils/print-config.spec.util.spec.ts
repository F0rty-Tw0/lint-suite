import type { DummyRuleMap, OxlintConfig } from 'oxlint';
import { describe, expect, it } from 'vitest';

import {
  parsePrintedConfig,
  printedConfigDiff
} from './print-config.spec.util.ts';
import type { PrintedConfig } from '../common/smoke.type.ts';

const consoleOptions = { allow: ['warn'] };
const configRules: DummyRuleMap = {
  'eslint/no-console': ['warn', consoleOptions],
  'import/export': 'error',
  'local/one-line-guard': 'error',
  'eslint/no-debugger': 'off'
};
const config: OxlintConfig = { plugins: ['import'], rules: configRules };
const printedRules = { 'no-console': 'warn', 'import/export': 'deny' };
const printed: PrintedConfig = {
  plugins: ['unicorn', 'typescript', 'oxc', 'import'],
  rules: printedRules
};

describe('FEATURE: print-config comparison', () => {
  describe('GIVEN a printed config that mirrors the resolved top level', () => {
    it('WHEN the two are compared THEN there is no difference', () => {
      const diffs = printedConfigDiff(printed, config);

      expect(diffs).toEqual([]);
    });
  });

  describe('GIVEN a printed config that drifted', () => {
    it('WHEN a plugin is missing THEN the plugins differ', () => {
      const drifted: PrintedConfig = { ...printed, plugins: ['oxc'] };

      const diffs = printedConfigDiff(drifted, config);

      expect(diffs).toEqual([
        'plugins: expected import,oxc,typescript,unicorn, printed oxc'
      ]);
    });

    it('WHEN a severity differs THEN that rule is reported', () => {
      const rules = { ...printedRules, 'import/export': 'warn' };
      const drifted: PrintedConfig = { ...printed, rules };

      const diffs = printedConfigDiff(drifted, config);

      expect(diffs).toEqual(['import/export: expected error, printed warn']);
    });

    it('WHEN a default-category rule leaks THEN it is reported as unexpected', () => {
      const rules = { ...printedRules, 'no-eval': 'deny' };
      const drifted: PrintedConfig = { ...printed, rules };

      const diffs = printedConfigDiff(drifted, config);

      expect(diffs).toEqual(['no-eval: expected absent, printed error']);
    });

    it('WHEN a native rule is dropped THEN it is reported as missing', () => {
      const drifted: PrintedConfig = { ...printed, rules: {} };

      const diffs = printedConfigDiff(drifted, config);

      expect(diffs).toEqual([
        'import/export: expected error, printed absent',
        'no-console: expected warn, printed absent'
      ]);
    });
  });

  describe('GIVEN printed output', () => {
    it('WHEN it lists plugins and rules THEN both are parsed', () => {
      const denyRules = { a: 'deny' };
      const printedConfig = { plugins: ['oxc'], rules: denyRules };
      const output = JSON.stringify(printedConfig);

      const parsed = parsePrintedConfig(output);

      expect(parsed).toEqual(printedConfig);
    });

    it('WHEN plugins are missing THEN parsing throws', () => {
      const parse = (): unknown => parsePrintedConfig('{"rules":{}}');

      expect(parse).toThrow('no plugins');
    });

    it('WHEN rules are missing THEN parsing throws', () => {
      const parse = (): unknown => parsePrintedConfig('{"plugins":[]}');

      expect(parse).toThrow('no rules');
    });

    it('WHEN the output is not an object THEN parsing throws', () => {
      const parse = (): unknown => parsePrintedConfig('1');

      expect(parse).toThrow('not an object');
    });
  });
});
