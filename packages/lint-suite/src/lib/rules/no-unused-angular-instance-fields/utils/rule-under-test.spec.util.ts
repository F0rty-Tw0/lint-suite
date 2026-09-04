import assert from 'node:assert/strict';
import { describe, test, vi } from 'vitest';

import { RuleTester } from 'eslint';
import type { ESLint, Linter } from 'eslint';

import { angular } from '../../../angular.js';
import { LINTER_CONFIG_STUB } from '../common/stubs/linter-config.stub.js';

type LintConfigOptions = {
  readonly analysis: 'local' | 'project';
  readonly directory?: string;
  readonly options?: Record<string, boolean>;
};

const angularPlugin = angular
  .map((config) => config.plugins?.['lint-suite-angular'])
  .find(Boolean);
const registeredRule = angularPlugin?.rules?.['no-unused-instance-fields'];

assert.ok(
  registeredRule,
  'angular preset must register lint-suite-angular/no-unused-instance-fields'
);

// ponytail: a project-mode test builds a TypeScript program for its fixture
// project, and the sibling specs build many of them at once, so a single
// test can sit well past the default per-test timeout. Every spec that
// reaches a fixture project imports this module, so raising the timeout
// here covers them all.
vi.setConfig({ testTimeout: 120_000 });

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

export const rule: NonNullable<ESLint.Plugin['rules']>[string] = registeredRule;

export const ruleName = 'lint-suite-angular/no-unused-instance-fields';

export const ruleTester = new RuleTester({
  languageOptions: LINTER_CONFIG_STUB.languageOptions
});

export const projectRuleTester = (directory: string): RuleTester =>
  new RuleTester({
    languageOptions: {
      ...LINTER_CONFIG_STUB.languageOptions,
      parserOptions: { projectService: true, tsconfigRootDir: directory }
    }
  });

export const lintConfig = ({
  analysis,
  directory,
  options
}: LintConfigOptions): Linter.Config => {
  const projectParserOptions =
    directory === undefined
      ? {}
      : {
          parserOptions: { projectService: true, tsconfigRootDir: directory }
        };
  const linterConfig: Linter.Config = {
    ...LINTER_CONFIG_STUB,
    languageOptions: {
      ...LINTER_CONFIG_STUB.languageOptions,
      ...projectParserOptions
    },
    plugins: {
      'lint-suite-angular': { rules: { 'no-unused-instance-fields': rule } }
    },
    rules: { [ruleName]: ['error', { analysis, ...options }] }
  };

  return linterConfig;
};
