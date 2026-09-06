import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import { typescript } from '../../typescript.ts';

const rule = typescript.map((config) => config.plugins?.['local']).find(Boolean)
  ?.rules?.['util-purity'];

assert.ok(rule, 'typescript preset must register local/util-purity');

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

const ruleTester = new RuleTester({ languageOptions });

const UTIL_FILE = '/p/feature/utils/parse-line.util.ts';
const SPEC_UTIL_FILE = '/p/feature/utils/parse-line.spec.util.ts';
const NON_UTIL_FILE = '/p/feature/service.ts';

const impureImportData = { source: 'fs' };
const impureImportError: RuleTester.TestCaseError = {
  messageId: 'impureImport',
  data: impureImportData
};

const moduleLetError: RuleTester.TestCaseError = { messageId: 'moduleLet' };

const moduleStateError: RuleTester.TestCaseError = {
  messageId: 'moduleState'
};

const ambientAccessData = { name: 'process' };
const ambientAccessError: RuleTester.TestCaseError = {
  messageId: 'ambientAccess',
  data: ambientAccessData
};

const nondeterministicData = { name: 'Date.now' };
const nondeterministicError: RuleTester.TestCaseError = {
  messageId: 'nondeterministic',
  data: nondeterministicData
};

const impureCallData = { name: 'setTimeout' };
const impureCallError: RuleTester.TestCaseError = {
  messageId: 'impureCall',
  data: impureCallData
};

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'ignores a non-util file entirely',
    filename: NON_UTIL_FILE,
    code: `import fs from 'fs';`
  },
  {
    name: 'ignores a .spec.util.ts file',
    filename: SPEC_UTIL_FILE,
    code: `import fs from 'fs';`
  },
  {
    name: 'allows a non-banned import in a util file',
    filename: UTIL_FILE,
    code: `import { z } from 'zod';`
  },
  {
    name: 'allows a module-level const primitive',
    filename: UTIL_FILE,
    code: `const limit = 10;`
  },
  {
    name: 'allows a Map created inside a function body',
    filename: UTIL_FILE,
    code: `function build() {\n  const cache = new Map();\n  return cache;\n}`
  },
  {
    name: 'allows plain member access unrelated to ambient globals',
    filename: UTIL_FILE,
    code: `const value = { a: 1 };\nconst a = value.a;`
  },
  {
    name: 'allows a plain function call',
    filename: UTIL_FILE,
    code: `const parsed = parseLine('x');`
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'reports an import of a banned module',
    filename: UTIL_FILE,
    code: `import fs from 'fs';`,
    errors: [impureImportError]
  },
  {
    name: 'reports a module-level let',
    filename: UTIL_FILE,
    code: `let counter = 0;`,
    errors: [moduleLetError]
  },
  {
    name: 'reports a module-level Map',
    filename: UTIL_FILE,
    code: `const cache = new Map();`,
    errors: [moduleStateError]
  },
  {
    name: 'reports ambient access on process',
    filename: UTIL_FILE,
    code: `const env = process.env;`,
    errors: [ambientAccessError]
  },
  {
    name: 'reports a nondeterministic Date.now call',
    filename: UTIL_FILE,
    code: `const now = Date.now();`,
    errors: [nondeterministicError]
  },
  {
    name: 'reports an impure setTimeout call',
    filename: UTIL_FILE,
    code: `setTimeout(() => {}, 10);`,
    errors: [impureCallError]
  }
];

ruleTester.run('local/util-purity', rule, { valid, invalid });
