import type { RuleTester } from 'eslint';

import { UTIL_FILE } from './test/common/util-purity.const.ts';
import {
  rule,
  ruleName,
  ruleTester
} from './test/utils/rule-under-test.spec.util.ts';

const SPEC_UTIL_FILE = '/p/feature/test/utils/parse-line.spec.util.ts';
const UNPLACED_SPEC_UTIL_FILE = '/p/feature/utils/parse-line.spec.util.ts';
const NON_UTIL_FILE = '/p/feature/service.ts';

const impureImportData = { source: 'fs' };
const impureImportError: RuleTester.TestCaseError = {
  messageId: 'impureImport',
  data: impureImportData
};

const nodeFsImportData = { source: 'node:fs' };
const nodeFsImportError: RuleTester.TestCaseError = {
  messageId: 'impureImport',
  data: nodeFsImportData
};

const fetchCallData = { name: 'fetch' };
const fetchCallError: RuleTester.TestCaseError = {
  messageId: 'impureCall',
  data: fetchCallData
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
    name: 'ignores a .spec.util.ts file under test/',
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
  },
  {
    name: 'allows a re-export from a non-banned module',
    filename: UTIL_FILE,
    code: `export { parse } from './parse.util.ts';`
  },
  {
    name: 'allows a local export without a source',
    filename: UTIL_FILE,
    code: `export const limit = 10;`
  },
  {
    name: 'allows a dynamic import of a non-banned module',
    filename: UTIL_FILE,
    code: `const load = () => import('./parse.util.ts');`
  },
  {
    name: 'allows a type-only import of a banned module',
    filename: UTIL_FILE,
    code: `import type { Stats } from 'node:fs';`
  },
  {
    name: 'allows a type-only re-export from a banned module',
    filename: UTIL_FILE,
    code: `export type { Stats } from 'node:fs';`
  },
  {
    name: 'allows a type-only star re-export from a banned module',
    filename: UTIL_FILE,
    code: `export type * from 'node:fs';`
  },
  {
    name: 'allows a type-only import-equals require of a banned module',
    filename: UTIL_FILE,
    code: `import type fs = require('fs');`
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
    name: 'reports a .spec.util.ts file outside test/',
    filename: UNPLACED_SPEC_UTIL_FILE,
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
  },
  {
    name: 'reports I/O inside a non-exported helper called by an export',
    filename: UTIL_FILE,
    code: `const get = (url) => fetch(url);\nexport const load = (url) => get(url);`,
    errors: [fetchCallError]
  },
  {
    name: 'reports a dynamic import of a banned module',
    filename: UTIL_FILE,
    code: `const load = () => import('node:fs');`,
    errors: [nodeFsImportError]
  },
  {
    name: 'reports a named re-export from a banned module',
    filename: UTIL_FILE,
    code: `export { readFileSync } from 'node:fs';`,
    errors: [nodeFsImportError]
  },
  {
    name: 'reports a star re-export from a banned module',
    filename: UTIL_FILE,
    code: `export * from 'node:fs';`,
    errors: [nodeFsImportError]
  },
  {
    name: 'reports an import-equals require of a banned module',
    filename: UTIL_FILE,
    code: `import fs = require('fs');`,
    errors: [impureImportError]
  },
  {
    name: 'reports an import mixing type and value specifiers',
    filename: UTIL_FILE,
    code: `import { type Stats, readFileSync } from 'node:fs';`,
    errors: [nodeFsImportError]
  },
  {
    name: 'reports a default import next to a type specifier',
    filename: UTIL_FILE,
    code: `import fs, { type Stats } from 'node:fs';`,
    errors: [nodeFsImportError]
  },
  {
    name: 'reports a re-export mixing type and value specifiers',
    filename: UTIL_FILE,
    code: `export { type Stats, readFileSync } from 'node:fs';`,
    errors: [nodeFsImportError]
  },
  {
    name: 'reports an import whose every specifier is inline type-only',
    filename: UTIL_FILE,
    code: `import { type Stats, type Dirent } from 'node:fs';`,
    errors: [nodeFsImportError]
  },
  {
    name: 'reports a re-export whose every specifier is inline type-only',
    filename: UTIL_FILE,
    code: `export { type Stats } from 'node:fs';`,
    errors: [nodeFsImportError]
  },
  {
    name: 'reports a side-effect import of a banned module',
    filename: UTIL_FILE,
    code: `import 'node:fs';`,
    errors: [nodeFsImportError]
  }
];

ruleTester.run(ruleName, rule, { valid, invalid });
