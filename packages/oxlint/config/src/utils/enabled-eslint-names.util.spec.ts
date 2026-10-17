import { describe, expect, it } from 'vitest';

import { enabledEslintNames } from './enabled-eslint-names.util.ts';

const H_OPTIONS = { x: 1 };

describe('FEATURE: enabledEslintNames', () => {
  describe('GIVEN oxlint rules', () => {
    it('WHEN severities use every spelling THEN only enabled rules are listed', () => {
      const names = enabledEslintNames({
        'eslint/a': 'error',
        'eslint/b': 'warn',
        'eslint/c': 'off',
        'eslint/d': 0,
        'eslint/e': 2,
        'eslint/f': 'allow',
        'eslint/g': 'deny',
        'eslint/h': ['error', H_OPTIONS],
        'eslint/i': ['off']
      });

      expect(names).toEqual(['a', 'b', 'e', 'g', 'h']);
    });

    it('WHEN a rule has an ESLint and a TypeScript name THEN both are listed', () => {
      const names = enabledEslintNames({ 'eslint/no-shadow': 'error' });

      expect(names).toEqual(['no-shadow', '@typescript-eslint/no-shadow']);
    });

    it('WHEN two rules map to one name THEN it is listed once', () => {
      const names = enabledEslintNames({
        'eslint/no-shadow': 'error',
        'typescript/no-shadow': 'error'
      });

      expect(names).toEqual(['no-shadow', '@typescript-eslint/no-shadow']);
    });

    it('WHEN a rule is from a JS plugin THEN its name is kept', () => {
      const names = enabledEslintNames({ 'local/one-line-guard': 'error' });

      expect(names).toEqual(['local/one-line-guard']);
    });

    it('WHEN there are no rules THEN the result is empty', () => {
      const names = enabledEslintNames(undefined);

      expect(names).toEqual([]);
    });
  });
});
