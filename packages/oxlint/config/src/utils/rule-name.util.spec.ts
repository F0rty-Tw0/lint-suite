import { describe, expect, it } from 'vitest';

import {
  isEnabled,
  normalizeSeverity,
  toEslintRuleNames,
  toOxlintRuleName
} from './rule-name.util.ts';

const UNCHANGED_NAMES: string[] = [
  'local/one-line-guard',
  '@smarttools/rxjs/no-index',
  '@angular-eslint/x',
  'lint-suite-angular/x',
  'modular-boundaries/x',
  'boundaries/x',
  '@stylistic/x',
  'playwright/x',
  'storybook/x',
  'vitest/expect-expect',
  'mystery/rule'
];

const EXTENSION_NAMES: string[] = [
  'class-methods-use-this',
  'default-param-last',
  'init-declarations',
  'max-params',
  'no-array-constructor',
  'no-dupe-class-members',
  'no-empty-function',
  'no-loop-func',
  'no-loss-of-precision',
  'no-magic-numbers',
  'no-redeclare',
  'no-restricted-imports',
  'no-shadow',
  'no-unused-expressions',
  'no-unused-private-class-members',
  'no-unused-vars',
  'no-use-before-define',
  'no-useless-constructor',
  'prefer-destructuring'
];

const ESLINT_JS_NAMES: string[] = [
  'spaced-comment',
  'no-restricted-syntax',
  'no-octal',
  'no-dupe-args'
];

const ESLINT_TO_OXLINT: [string, string][] = [
  ['no-console', 'eslint/no-console'],
  ['@typescript-eslint/no-explicit-any', 'typescript/no-explicit-any'],
  ['import-x/no-duplicates', 'import/no-duplicates']
];

const OXLINT_TO_ESLINT: [string, string][] = [
  ['eslint/no-console', 'no-console'],
  ['typescript/no-explicit-any', '@typescript-eslint/no-explicit-any'],
  ['import/no-duplicates', 'import-x/no-duplicates']
];

describe('FEATURE: rule-name map', () => {
  describe('GIVEN an ESLint rule name', () => {
    it.each(ESLINT_TO_OXLINT)(
      'WHEN %s is mapped to oxlint THEN it is %s',
      (name, expected) => {
        const oxlintName = toOxlintRuleName(name);

        expect(oxlintName).toBe(expected);
      }
    );

    it.each(ESLINT_JS_NAMES)(
      'WHEN core rule %s oxlint lacks is mapped THEN it is eslint-js/x',
      (name) => {
        const oxlintName = toOxlintRuleName(name);

        expect(oxlintName).toBe(`eslint-js/${name}`);
      }
    );

    it.each(EXTENSION_NAMES)(
      'WHEN the typescript-eslint extension rule %s is mapped THEN it is eslint/x',
      (name) => {
        const oxlintName = toOxlintRuleName(`@typescript-eslint/${name}`);

        expect(oxlintName).toBe(`eslint/${name}`);
      }
    );

    it.each(EXTENSION_NAMES)(
      'WHEN the core rule %s is mapped THEN it is eslint/x',
      (name) => {
        const oxlintName = toOxlintRuleName(name);

        expect(oxlintName).toBe(`eslint/${name}`);
      }
    );

    it.each(UNCHANGED_NAMES)(
      'WHEN plugin rule %s is mapped THEN it is unchanged',
      (name) => {
        const oxlintName = toOxlintRuleName(name);

        expect(oxlintName).toBe(name);
      }
    );
  });

  describe('GIVEN an oxlint rule name', () => {
    it.each(OXLINT_TO_ESLINT)(
      'WHEN %s is mapped to ESLint THEN it is %s',
      (name, expected) => {
        const eslintNames = toEslintRuleNames(name);

        expect(eslintNames).toEqual([expected]);
      }
    );

    it.each(ESLINT_JS_NAMES)(
      'WHEN eslint-js/%s is mapped THEN it is the core rule',
      (name) => {
        const eslintNames = toEslintRuleNames(`eslint-js/${name}`);

        expect(eslintNames).toEqual([name]);
      }
    );

    it.each(EXTENSION_NAMES)(
      'WHEN eslint/%s is mapped THEN it is the core and the typescript-eslint rule',
      (name) => {
        const eslintNames = toEslintRuleNames(`eslint/${name}`);

        expect(eslintNames).toEqual([name, `@typescript-eslint/${name}`]);
      }
    );

    it.each(UNCHANGED_NAMES)(
      'WHEN plugin rule %s is mapped THEN it is unchanged',
      (name) => {
        const eslintNames = toEslintRuleNames(name);

        expect(eslintNames).toEqual([name]);
      }
    );
  });

  describe('GIVEN a rule config entry', () => {
    it.each([[2], ['deny'], [['error', {}]]])(
      'WHEN it is %j THEN severity is error',
      (entry) => {
        const severity = normalizeSeverity(entry);

        expect(severity).toBe('error');
      }
    );

    it.each([[1], ['warn'], [['warn']]])(
      'WHEN it is %j THEN severity is warn',
      (entry) => {
        const severity = normalizeSeverity(entry);

        expect(severity).toBe('warn');
      }
    );

    it.each([[0], ['allow'], ['off'], [undefined]])(
      'WHEN it is %j THEN severity is off',
      (entry) => {
        const severity = normalizeSeverity(entry);

        expect(severity).toBe('off');
      }
    );

    it.each([[2], ['warn'], [['error', {}]]])(
      'WHEN it is %j THEN the rule is enabled',
      (entry) => {
        const enabled = isEnabled(entry);

        expect(enabled).toBe(true);
      }
    );

    it.each([[0], ['off'], [['off']], [undefined]])(
      'WHEN it is %j THEN the rule is not enabled',
      (entry) => {
        const enabled = isEnabled(entry);

        expect(enabled).toBe(false);
      }
    );
  });
});
