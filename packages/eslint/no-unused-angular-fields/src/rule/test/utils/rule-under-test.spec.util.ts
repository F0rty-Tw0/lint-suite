import assert from 'node:assert/strict';

import {
  LINTER_CONFIG_STUB,
  LINTER_LANGUAGE_OPTIONS_STUB
} from '@lint-suite/rule-test-support/stubs/linter-config.stub.ts';
import { RuleTester } from 'eslint';
import type { ESLint, Linter } from 'eslint';
import { describe, test, vi } from 'vitest';

import plugin from '../../../index.ts';

const pluginRule = plugin.rules?.['no-unused-instance-fields'];

assert.ok(pluginRule);

export const rule: NonNullable<ESLint.Plugin['rules']>[string] = pluginRule;

type Analysis = 'local' | 'project';

type LintConfigOptions = {
  readonly analysis?: Analysis;
  readonly directory?: string;
  readonly options?: Record<string, boolean>;
};

type LintRuleOptions = {
  readonly [option: string]: Analysis | boolean | undefined;
  readonly analysis?: Analysis;
};

vi.setConfig({ testTimeout: 120_000 });

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

export const ruleName = 'no-unused-instance-fields/no-unused-instance-fields';

export const ruleTester = new RuleTester({
  languageOptions: LINTER_LANGUAGE_OPTIONS_STUB
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

const ruleOptionsFor = (
  analysis: Analysis | undefined,
  options: Record<string, boolean> | undefined
): LintRuleOptions => {
  if (analysis === undefined) {
    const localOptions: LintRuleOptions = { ...options };

    return localOptions;
  }

  const projectOptions: LintRuleOptions = { analysis, ...options };

  return projectOptions;
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
  const plugins = { 'no-unused-instance-fields': plugin };
  const ruleOptions = ruleOptionsFor(analysis, options);
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
