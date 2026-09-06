import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { afterAll, describe, test } from 'vitest';

import { typescript } from '../../typescript.ts';

const rule = typescript.map((config) => config.plugins?.['local']).find(Boolean)
  ?.rules?.['sibling-spec'];

assert.ok(rule, 'typescript preset must register local/sibling-spec');

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

const ruleTester = new RuleTester({ languageOptions });

const FIXTURE_DIR = join(
  import.meta.dirname,
  'test',
  'fixtures',
  'sibling-spec'
);

const PROJECT_DIR = mkdtempSync(join(tmpdir(), 'lint-suite-sibling-spec-'));

cpSync(FIXTURE_DIR, PROJECT_DIR, { recursive: true });

afterAll(() => {
  rmSync(PROJECT_DIR, { recursive: true, force: true });
});

const caseFile = (name: string): string => join(PROJECT_DIR, name);

const posixCaseFile = (name: string): string =>
  caseFile(name).replaceAll('\\', '/');

const caseCode = (name: string): string => readFileSync(caseFile(name), 'utf8');

const missingSpecError = (spec: string): RuleTester.TestCaseError => {
  const data = { spec };
  const error: RuleTester.TestCaseError = { messageId: 'missingSpec', data };

  return error;
};

const customExemptOptions = [{ exempt: ['**/custom.ts'] }];

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts a file with a direct sibling spec',
    code: caseCode('with-spec.ts'),
    filename: posixCaseFile('with-spec.ts')
  },
  {
    name: 'accepts an entry file with an integration spec sibling',
    code: caseCode('entry.ts'),
    filename: posixCaseFile('entry.ts')
  },
  {
    name: 'accepts a Windows-style backslash path to a file with a sibling spec',
    code: caseCode('with-spec.ts'),
    filename: caseFile('with-spec.ts')
  },
  {
    name: 'exempts a .type.ts file by suffix',
    code: 'export type Foo = number;',
    filename: 'src/app/settings.type.ts'
  },
  {
    name: 'exempts a file under a fixtures directory',
    code: 'export const x = 1;',
    filename: 'src/app/fixtures/orphan.ts'
  },
  {
    name: 'exempts a file under a test directory',
    code: 'export const x = 1;',
    filename: 'src/app/test/utils/x.ts'
  },
  {
    name: 'exempts a non-.ts file',
    code: 'export const x = 1;',
    filename: 'src/app/user.tsx'
  },
  {
    name: 'exempts test-setup files via the default exempt glob',
    code: 'export const setup = 1;',
    filename: 'src/test-setup.base.ts'
  },
  {
    name: 'exempts main.ts via the default exempt glob',
    code: 'export const x = 1;',
    filename: 'src/app/main.ts'
  },
  {
    name: 'exempts a file matched by a custom exempt glob',
    code: 'export const x = 1;',
    filename: 'src/app/custom.ts',
    options: customExemptOptions
  },
  {
    name: 'does not report when the directory cannot be read',
    code: 'export const x = 1;',
    filename: 'this-directory-does-not-exist-xyz/mystery.ts'
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'reports a file with neither a direct nor an integration sibling spec',
    code: caseCode('orphan.ts'),
    filename: caseFile('orphan.ts'),
    errors: [missingSpecError('orphan.spec.ts')]
  }
];

ruleTester.run('local/sibling-spec', rule, { valid, invalid });
