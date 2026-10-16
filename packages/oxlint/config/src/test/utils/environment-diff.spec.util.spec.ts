import { describe, expect, it } from 'vitest';

import { globalsDiff } from './environment-diff.spec.util.ts';
import type { ResolvedOxlintConfig } from '../../common/oxlint-config.type.ts';
import type { EslintSampleConfig, ParityInput } from '../common/parity.type.ts';
import { RESOLVED_OXLINT_CONFIG_STUB } from '../stubs/oxlint-config.stub.ts';
import {
  ESLINT_SAMPLE_CONFIG_STUB,
  PARITY_INPUT_STUB
} from '../stubs/parity.stub.ts';

const inputWith = (
  eslintGlobals: Readonly<Record<string, unknown>>,
  oxlintGlobals: Readonly<Record<string, unknown>>
): ParityInput => {
  const eslint: EslintSampleConfig = {
    ...ESLINT_SAMPLE_CONFIG_STUB,
    globals: eslintGlobals
  };
  const oxlint: ResolvedOxlintConfig = {
    ...RESOLVED_OXLINT_CONFIG_STUB,
    globals: oxlintGlobals
  };
  const input: ParityInput = {
    ...PARITY_INPUT_STUB,
    sample: 'src/a.js',
    eslint,
    oxlint
  };

  return input;
};

describe('FEATURE: globalsDiff', () => {
  describe('GIVEN ESLint flags and the matching oxlint strings', () => {
    it('WHEN they are compared THEN there is no diff', () => {
      const input = inputWith(
        { window: false, location: true },
        { window: 'readonly', location: 'writable' }
      );

      const diffs = globalsDiff(input);

      expect(diffs).toEqual([]);
    });
  });

  describe('GIVEN ESLint legacy spellings', () => {
    it('WHEN they are compared THEN readable and writeable match readonly and writable', () => {
      const input = inputWith(
        { window: 'readable', location: 'writeable' },
        { window: 'readonly', location: 'writable' }
      );

      const diffs = globalsDiff(input);

      expect(diffs).toEqual([]);
    });
  });

  describe('GIVEN a writable name that oxlint holds as readonly', () => {
    it('WHEN they are compared THEN one diff is reported', () => {
      const input = inputWith({ location: true }, { location: 'readonly' });

      const diffs = globalsDiff(input);

      expect(diffs).toEqual([
        '[pass] src/a.js globals: 1 names differ (location)'
      ]);
    });
  });

  describe('GIVEN a name that only one side has', () => {
    it('WHEN they are compared THEN one diff is reported', () => {
      const input = inputWith({ window: false }, {});

      const diffs = globalsDiff(input);

      expect(diffs).toEqual([
        '[pass] src/a.js globals: 1 names differ (window)'
      ]);
    });
  });

  describe('GIVEN an off name on both sides', () => {
    it('WHEN they are compared THEN there is no diff', () => {
      const input = inputWith({ Promise: 'off' }, { Promise: 'off' });

      const diffs = globalsDiff(input);

      expect(diffs).toEqual([]);
    });
  });
});
