import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { ESLint, Linter } from 'eslint';
import { describe, test, vi } from 'vitest';

import { angular } from '../../../angular.ts';
import { LINTER_CONFIG_STUB } from '../common/stubs/linter-config.stub.ts';

type LintConfigOptions = {
  readonly analysis: 'local' | 'project';
  readonly directory?: string;
  readonly options?: Record<string, boolean>;
};

const angularPlugins = angular.map(
  (config) => config.plugins?.['lint-suite-angular']
);
const angularPlugin = angularPlugins.find(Boolean);
const registeredRule = angularPlugin?.rules?.['no-unused-instance-fields'];

assert.ok(
  registeredRule,
  'angular preset must register lint-suite-angular/no-unused-instance-fields'
);

vi.setConfig({ testTimeout: 120_000 });

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

export const rule: NonNullable<ESLint.Plugin['rules']>[string] = registeredRule;

export const ruleName = 'lint-suite-angular/no-unused-instance-fields';

export const ruleTester = new RuleTester({
  languageOptions: LINTER_CONFIG_STUB.languageOptions
});

const projectLanguageOptions = (
  directory: string | undefined
): Linter.LanguageOptions => {
  if (directory === undefined) {
    const localOptions: Linter.LanguageOptions = {};

    return localOptions;
  }

  const parserOptions = { projectService: true, tsconfigRootDir: directory };
  const projectOptions: Linter.LanguageOptions = { parserOptions };

  return projectOptions;
};

export const projectRuleTester = (directory: string): RuleTester => {
  const parserOptions = { projectService: true, tsconfigRootDir: directory };
  const languageOptions: Linter.LanguageOptions = {
    ...LINTER_CONFIG_STUB.languageOptions,
    parserOptions
  };

  return new RuleTester({ languageOptions });
};

export const lintConfig = ({
  analysis,
  directory,
  options
}: LintConfigOptions): Linter.Config => {
  const directoryOptions = projectLanguageOptions(directory);
  const languageOptions: Linter.LanguageOptions = {
    ...LINTER_CONFIG_STUB.languageOptions,
    ...directoryOptions
  };
  const rulesUnderTest = { 'no-unused-instance-fields': rule };
  const pluginUnderTest: ESLint.Plugin = { rules: rulesUnderTest };
  const plugins = { 'lint-suite-angular': pluginUnderTest };
  const ruleOptions = { analysis, ...options };
  const ruleEntry: Linter.RuleEntry = ['error', ruleOptions];
  const rules: Linter.RulesRecord = { [ruleName]: ruleEntry };
  const linterConfig: Linter.Config = {
    ...LINTER_CONFIG_STUB,
    languageOptions,
    plugins,
    rules
  };

  return linterConfig;
};
