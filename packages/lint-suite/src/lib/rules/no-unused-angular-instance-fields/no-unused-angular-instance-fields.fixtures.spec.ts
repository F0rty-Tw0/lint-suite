import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';

import { Linter } from 'eslint';
import type { Program } from 'typescript';

import { projectUsage } from './project-usage/project-usage.js';
import { fixtureDirectory } from './utils/fixture-project.spec.util.js';
import { reportedMembers } from './utils/lint-messages.spec.util.js';
import { lintConfig } from './utils/rule-under-test.spec.util.js';

const localDirectory = fixtureDirectory('local');
const projectDirectory = fixtureDirectory('project');

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

        assert.deepEqual(reportedMembers(messages), expectations(code));
      });
    }
  });
};

const localLinter = new Linter();
const localConfig = (options: Record<string, boolean>): Linter.Config =>
  lintConfig({ analysis: 'local', options });

for (const kind of ['valid', 'invalid']) {
  lintFixtures(
    `local ${kind}`,
    join(localDirectory, kind),
    localLinter,
    localConfig
  );
}

const projectLinter = new Linter({ cwd: projectDirectory });
const projectLanguageOptions = lintConfig({
  analysis: 'project',
  directory: projectDirectory
}).languageOptions;
const projectConfig = (options: Record<string, boolean>): Linter.Config =>
  lintConfig({ analysis: 'project', directory: projectDirectory, options });

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

                const noListeners = {};

                return noListeners;
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
