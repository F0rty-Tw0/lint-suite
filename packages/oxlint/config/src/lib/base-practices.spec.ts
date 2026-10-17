import { describe, expect, it } from 'vitest';

import { basePractices } from './base-practices.ts';
import { fileUrlFlags, ruleAt } from '../test/utils/preset.spec.util.ts';

const COMMENT_BLOCK = { exceptions: ['*'], balanced: false };

const COMMENT_STYLE = ['error', 'always', { block: COMMENT_BLOCK }];

describe('FEATURE: basePractices', () => {
  describe('GIVEN a TypeScript file', () => {
    it('WHEN eslint/no-console is read THEN it warns and allows warn and error', () => {
      const entry = ruleAt(basePractices, 'src/a.ts', 'eslint/no-console');

      expect(entry).toEqual(['warn', { allow: ['warn', 'error'] }]);
    });

    it('WHEN eslint-js/spaced-comment is read THEN it keeps the block exception', () => {
      const rule = 'eslint-js/spaced-comment';
      const entry = ruleAt(basePractices, 'src/a.ts', rule);

      expect(entry).toEqual(COMMENT_STYLE);
    });
  });

  describe('GIVEN a JavaScript file', () => {
    it('WHEN eslint/eqeqeq is read THEN it keeps the null exception', () => {
      const entry = ruleAt(basePractices, 'src/a.js', 'eslint/eqeqeq');

      expect(entry).toEqual(['error', 'always', { null: 'ignore' }]);
    });
  });

  describe('GIVEN the config', () => {
    it('WHEN its JS plugin specifiers are read THEN both are file URLs', () => {
      const flags = fileUrlFlags(basePractices);

      expect(flags).toEqual([true, true]);
    });
  });
});
