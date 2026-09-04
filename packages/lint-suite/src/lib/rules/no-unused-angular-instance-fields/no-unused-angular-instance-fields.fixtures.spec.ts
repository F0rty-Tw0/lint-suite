import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { TSESLint } from '@typescript-eslint/utils';
import { Linter } from 'eslint';
import type { Program } from 'typescript';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import { projectUsage } from './project-usage/project-usage.ts';
import { fixtureDirectory } from './utils/fixture-project.spec.util.ts';
import { reportedMembers } from './utils/lint-messages.spec.util.ts';
import { lintConfig } from './utils/rule-under-test.spec.util.ts';

const localDirectory = fixtureDirectory('local');
const projectDirectory = fixtureDirectory('project');

const expectationPattern = /\/\/ expect (unusedField|unusedMethod): (\w+)/gu;
const optionsPattern = /\/\/ options: (.+)/u;

const expectations = (code: string): string[] => {
  const matches = [...code.matchAll(expectationPattern)];
  const reported = matches.map(([, messageId, name]) => `${messageId}:${name}`);

  return reported.sort();
};

const fixtureOptions = (code: string): Record<string, boolean> => {
  const optionsMatch = optionsPattern.exec(code);
  const optionsText = optionsMatch?.[1] ?? '';
  const names = optionsText.split(',').map((option) => option.trim());
  const enabled = (option: string): readonly [string, boolean] => {
    return [option, true];
  };
  const entries = names.filter(Boolean).map(enabled);

  return Object.fromEntries(entries);
};

const tsFiles = (directory: string): string[] => {
  const files = readdirSync(directory);
  const tsNames = files.filter((file) => file.endsWith('.ts'));

  return tsNames.sort();
};

const lintFixtures = (
  suite: string,
  directory: string,
  linter: Linter,
  config: (options: Record<string, boolean>) => Linter.Config
): void => {
  describe(suite, () => {
    for (const file of tsFiles(directory)) {
      test(file, () => {
        const filename = join(directory, file);
        const code = readFileSync(filename, 'utf8');
        const messages = linter.verify(code, config(fixtureOptions(code)), {
          filename
        });

        assert.deepEqual(reportedMembers(messages), expectations(code));
      });
    }
  });
};

const localLinter = new Linter();
const localConfig = (options: Record<string, boolean>): Linter.Config => {
  return lintConfig({ analysis: 'local', options });
};

for (const kind of ['valid', 'invalid']) {
  lintFixtures(
    `local ${kind}`,
    join(localDirectory, kind),
    localLinter,
    localConfig
  );
}

const projectLinter = new Linter({ cwd: projectDirectory });
const projectConfig = (options: Record<string, boolean>): Linter.Config => {
  return lintConfig({
    analysis: 'project',
    directory: projectDirectory,
    options
  });
};

test('project fixture index builds', () => {
  let program: Program | undefined;
  const filename = join(projectDirectory, 'src', 'unread-members.component.ts');
  const captureProgram: TSESLint.AnyRuleCreateFunction = (context) => {
    program = context.sourceCode.parserServices?.program ?? undefined;

    const noListeners: TSESLint.RuleListener = {};

    return noListeners;
  };

  const probeMeta: TSESLint.AnyRuleModule['meta'] = {
    type: 'problem',
    messages: {},
    schema: []
  };
  const probeRule: TSESLint.AnyRuleModule = {
    meta: probeMeta,
    create: captureProgram
  };
  const probeRules = { program: probeRule };
  const probePlugin: TSESLint.FlatConfig.Plugin = { rules: probeRules };
  const plugins = { probe: probePlugin };
  const rules: TSESLint.FlatConfig.Rules = { 'probe/program': 'error' };
  const parserOptions = {
    projectService: true,
    tsconfigRootDir: projectDirectory
  };
  const languageOptions: TSESLint.FlatConfig.LanguageOptions = {
    ecmaVersion: 'latest',
    parser: tseslint.parser,
    parserOptions,
    sourceType: 'module'
  };
  const probeConfig: TSESLint.FlatConfig.Config = {
    files: ['**/*.ts'],
    languageOptions,
    plugins,
    rules
  };
  const probeLinter = new TSESLint.Linter({ cwd: projectDirectory });

  probeLinter.verify(readFileSync(filename, 'utf8'), probeConfig, { filename });

  assert.ok(program, 'parser services must expose a program');
  assert.notEqual(projectUsage(program), null, 'project index must build');
});

lintFixtures(
  'project',
  join(projectDirectory, 'src'),
  projectLinter,
  projectConfig
);
