import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from 'node:test';

import { Linter } from 'eslint';
import type { Program } from 'typescript';
import tseslint from 'typescript-eslint';

import { angular } from '../../angular.js';
import { projectUsage } from './project-usage/project-usage.js';

const rule = angular
  .map((config) => config.plugins?.['lint-suite-angular'])
  .find(Boolean)?.rules?.['no-unused-instance-fields'];

assert.ok(rule, 'angular preset must register no-unused-instance-fields');

const fixturesDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  'fixtures'
);
const projectDirectory = join(fixturesDirectory, 'project');
const ruleId = 'lint-suite-angular/no-unused-instance-fields';
const plugin = {
  'lint-suite-angular': { rules: { 'no-unused-instance-fields': rule } }
};

const expectationPattern = /\/\/ expect (unusedField|unusedMethod): (\w+)/gu;
const optionsPattern = /\/\/ options: (.+)/u;

const expectations = (code: string): string[] =>
  [...code.matchAll(expectationPattern)]
    .map(([, messageId, name]) => `${messageId}:${name}`)
    .sort();

const fixtureOptions = (code: string): Record<string, boolean> =>
  Object.fromEntries(
    (optionsPattern.exec(code)?.[1] ?? '')
      .split(',')
      .map((option) => option.trim())
      .filter(Boolean)
      .map((option) => [option, true])
  );

const actual = (messages: Linter.LintMessage[]): string[] =>
  messages
    .map((message) => {
      assert.ok(
        message.messageId,
        `unexpected non-rule message: ${message.message}`
      );

      return `${message.messageId}:${/'([^']+)'/u.exec(message.message)?.[1]}`;
    })
    .sort();

const tsFiles = (directory: string): string[] =>
  readdirSync(directory)
    .filter((file) => file.endsWith('.ts'))
    .sort();

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

        assert.deepEqual(actual(messages), expectations(code));
      });
    }
  });
};

const localLinter = new Linter();
const localConfig = (options: Record<string, boolean>): Linter.Config => ({
  files: ['**/*.ts'],
  languageOptions: {
    ecmaVersion: 'latest',
    parser: tseslint.parser,
    sourceType: 'module'
  },
  plugins: plugin,
  rules: { [ruleId]: ['error', { analysis: 'local', ...options }] }
});

for (const kind of ['valid', 'invalid']) {
  lintFixtures(
    `local ${kind}`,
    join(fixturesDirectory, 'local', kind),
    localLinter,
    localConfig
  );
}

const projectLinter = new Linter({ cwd: projectDirectory });
const projectLanguageOptions: Linter.Config['languageOptions'] = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  parserOptions: { projectService: true, tsconfigRootDir: projectDirectory },
  sourceType: 'module'
};
const projectConfig = (options: Record<string, boolean>): Linter.Config => ({
  files: ['**/*.ts'],
  languageOptions: projectLanguageOptions,
  plugins: plugin,
  rules: { [ruleId]: ['error', { analysis: 'project', ...options }] }
});

test('project fixture index builds', () => {
  let program: Program | undefined;
  const filename = join(projectDirectory, 'src', 'unread-members.component.ts');

  projectLinter.verify(
    readFileSync(filename, 'utf8'),
    {
      files: ['**/*.ts'],
      languageOptions: projectLanguageOptions,
      plugins: {
        probe: {
          rules: {
            program: {
              create(context) {
                program = (
                  context.sourceCode as unknown as {
                    parserServices?: { program?: Program };
                  }
                ).parserServices?.program;
                return {};
              }
            }
          }
        }
      },
      rules: { 'probe/program': 'error' }
    },
    { filename }
  );

  assert.ok(program, 'parser services must expose a program');
  assert.notEqual(projectUsage(program), null, 'project index must build');
});

lintFixtures(
  'project',
  join(projectDirectory, 'src'),
  projectLinter,
  projectConfig
);
