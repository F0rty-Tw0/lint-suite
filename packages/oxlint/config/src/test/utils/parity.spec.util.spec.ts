import { describe, expect, it } from 'vitest';

import { parityDiff } from './parity.spec.util.ts';
import type { ResolvedOxlintConfig } from '../../common/oxlint-config.type.ts';
import type { MissingTable } from '../common/missing.type.ts';
import { TYPE_AWARE_ONLY_CAUSE } from '../common/parity.const.ts';
import type { EslintSampleConfig, ParityInput } from '../common/parity.type.ts';
import { MISSING_TABLE_STUB } from '../stubs/missing.stub.ts';
import { RESOLVED_OXLINT_CONFIG_STUB } from '../stubs/oxlint-config.stub.ts';
import {
  ESLINT_SAMPLE_CONFIG_STUB,
  PARITY_INPUT_STUB
} from '../stubs/parity.stub.ts';

const NEEDS_TYPE_INFO_CAUSE = 'Needs type info, no oxlint path';

const ALLOW_WARN_OPTIONS = { allow: ['warn'] };

const ESLINT_CONSOLE_RULES = { 'no-console': 'error' };

const ESLINT_CONSOLE_OPTIONS_RULES = {
  'no-console': ['error', ALLOW_WARN_OPTIONS]
};

const eslintConsole: EslintSampleConfig = {
  ...ESLINT_SAMPLE_CONFIG_STUB,
  rules: ESLINT_CONSOLE_RULES
};

const eslintConsoleOptions: EslintSampleConfig = {
  ...ESLINT_SAMPLE_CONFIG_STUB,
  rules: ESLINT_CONSOLE_OPTIONS_RULES
};

const OXLINT_ERROR_RULES = { 'eslint/no-console': 'error' };

const OXLINT_WARN_RULES = { 'eslint/no-console': 'warn' };

const oxlintError: ResolvedOxlintConfig = {
  ...RESOLVED_OXLINT_CONFIG_STUB,
  rules: OXLINT_ERROR_RULES
};

const oxlintWarn: ResolvedOxlintConfig = {
  ...RESOLVED_OXLINT_CONFIG_STUB,
  rules: OXLINT_WARN_RULES
};

const consoleDeviation: MissingTable = {
  ...MISSING_TABLE_STUB,
  deviations: new Set(['no-console'])
};

const consoleTypeAwareOnly: MissingTable = {
  ...MISSING_TABLE_STUB,
  causes: new Map([['no-console', TYPE_AWARE_ONLY_CAUSE]])
};

const consoleNeedsTypeInfo: MissingTable = {
  ...MISSING_TABLE_STUB,
  causes: new Map([['no-console', NEEDS_TYPE_INFO_CAUSE]])
};

describe('FEATURE: parityDiff', () => {
  describe('GIVEN a rule ESLint enables and oxlint does not', () => {
    it('WHEN the configs are compared THEN the rule is reported missing', () => {
      const input: ParityInput = {
        ...PARITY_INPUT_STUB,
        eslint: eslintConsole
      };

      const diffs = parityDiff(input);

      expect(diffs).toEqual([
        '[pass] src/a.ts no-console: missing (expected eslint/no-console)'
      ]);
    });
  });

  describe('GIVEN a rule both tools enable at different severities', () => {
    it('WHEN the configs are compared THEN the severity is reported', () => {
      const input: ParityInput = {
        ...PARITY_INPUT_STUB,
        eslint: eslintConsole,
        oxlint: oxlintWarn
      };

      const diffs = parityDiff(input);

      expect(diffs).toEqual([
        '[pass] src/a.ts no-console: severity (eslint error, oxlint warn)'
      ]);
    });
  });

  describe('GIVEN a rule both tools enable with different options', () => {
    it('WHEN the rule is not a deviation THEN the options are reported', () => {
      const input: ParityInput = {
        ...PARITY_INPUT_STUB,
        eslint: eslintConsoleOptions,
        oxlint: oxlintError
      };

      const diffs = parityDiff(input);

      expect(diffs).toEqual([
        '[pass] src/a.ts no-console: options (eslint [{"allow":["warn"]}], oxlint [])'
      ]);
    });

    it('WHEN the rule is an option deviation THEN nothing is reported', () => {
      const input: ParityInput = {
        ...PARITY_INPUT_STUB,
        eslint: eslintConsoleOptions,
        oxlint: oxlintError,
        missing: consoleDeviation
      };

      const diffs = parityDiff(input);

      expect(diffs).toEqual([]);
    });
  });

  describe('GIVEN a rule listed as type-aware only', () => {
    it('WHEN the pass is not type-aware and oxlint lacks the rule THEN nothing is reported', () => {
      const input: ParityInput = {
        ...PARITY_INPUT_STUB,
        eslint: eslintConsole,
        missing: consoleTypeAwareOnly
      };

      const diffs = parityDiff(input);

      expect(diffs).toEqual([]);
    });

    it('WHEN the pass is type-aware and oxlint has the rule THEN nothing is reported', () => {
      const input: ParityInput = {
        ...PARITY_INPUT_STUB,
        eslint: eslintConsole,
        oxlint: oxlintError,
        missing: consoleTypeAwareOnly,
        typeAware: true
      };

      const diffs = parityDiff(input);

      expect(diffs).toEqual([]);
    });

    it('WHEN the pass is type-aware and oxlint lacks the rule THEN the rule is reported missing', () => {
      const input: ParityInput = {
        ...PARITY_INPUT_STUB,
        eslint: eslintConsole,
        missing: consoleTypeAwareOnly,
        typeAware: true
      };

      const diffs = parityDiff(input);

      expect(diffs).toEqual([
        '[pass] src/a.ts no-console: missing (expected eslint/no-console)'
      ]);
    });
  });

  describe('GIVEN a rule listed in MISSING.md that oxlint enables', () => {
    it('WHEN the configs are compared THEN the listed rule is reported in reverse', () => {
      const input: ParityInput = {
        ...PARITY_INPUT_STUB,
        eslint: eslintConsole,
        oxlint: oxlintError,
        missing: consoleNeedsTypeInfo
      };

      const diffs = parityDiff(input);

      expect(diffs).toEqual([
        '[pass] src/a.ts no-console: reverse (listed under "Needs type info, no oxlint path", enabled in oxlint)'
      ]);
    });
  });

  describe('GIVEN a rule oxlint enables and ESLint does not', () => {
    it('WHEN the configs are compared THEN the unlisted rule is reported in reverse', () => {
      const input: ParityInput = { ...PARITY_INPUT_STUB, oxlint: oxlintError };

      const diffs = parityDiff(input);

      expect(diffs).toEqual([
        '[pass] src/a.ts eslint/no-console: reverse (enabled in oxlint, no enabled ESLint counterpart)'
      ]);
    });
  });
});
