import type { Linter, RuleTester } from 'eslint';

import { UTIL_FILE } from './test/common/util-purity.const.ts';
import {
  rule,
  ruleName,
  ruleTester
} from './test/utils/rule-under-test.spec.util.ts';

const newDateData = { name: 'new Date()' };
const newDateError: RuleTester.TestCaseError = {
  messageId: 'nondeterministic',
  data: newDateData
};

const callError = (name: string): RuleTester.TestCaseError => {
  const data = { name };
  const error: RuleTester.TestCaseError = { messageId: 'impureCall', data };

  return error;
};

const aliasError = (name: string): RuleTester.TestCaseError => {
  const data = { name };
  const error: RuleTester.TestCaseError = { messageId: 'ambientAccess', data };

  return error;
};

const fetchGlobals: Linter.Globals = { fetch: 'readonly' };
const fetchGlobalOptions: Linter.LanguageOptions = { globals: fetchGlobals };

const queueMicrotaskError = callError('queueMicrotask');
const setImmediateError = callError('setImmediate');
const requestAnimationFrameError = callError('requestAnimationFrame');
const fetchCallError = callError('fetch');
const processAliasError = aliasError('process');
const fetchAliasError = aliasError('fetch');
const setTimeoutAliasError = aliasError('setTimeout');
const queueMicrotaskAliasError = aliasError('queueMicrotask');
const globalThisAliasError = aliasError('globalThis');

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'allows new Date with an argument',
    filename: UTIL_FILE,
    code: `const epoch = new Date(0);`
  },
  {
    name: 'allows a module binding that shadows fetch',
    filename: UTIL_FILE,
    code: `const fetch = (url) => url;\nconst get = fetch;`
  },
  {
    name: 'allows a parameter that shadows process',
    filename: UTIL_FILE,
    code: `const read = (process) => process;`
  },
  {
    name: 'allows process in a type query',
    filename: UTIL_FILE,
    code: `type Env = typeof process;`
  },
  {
    name: 'allows process in a qualified type query',
    filename: UTIL_FILE,
    code: `type Env = typeof process.env;`
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'reports new Date without arguments',
    filename: UTIL_FILE,
    code: `const now = new Date();`,
    errors: [newDateError]
  },
  {
    name: 'reports a queueMicrotask call',
    filename: UTIL_FILE,
    code: `queueMicrotask(() => {});`,
    errors: [queueMicrotaskError]
  },
  {
    name: 'reports a setImmediate call',
    filename: UTIL_FILE,
    code: `setImmediate(() => {});`,
    errors: [setImmediateError]
  },
  {
    name: 'reports a requestAnimationFrame call',
    filename: UTIL_FILE,
    code: `requestAnimationFrame(() => {});`,
    errors: [requestAnimationFrameError]
  },
  {
    name: 'reports a direct fetch call once',
    filename: UTIL_FILE,
    code: `const load = (url) => fetch(url);`,
    errors: [fetchCallError]
  },
  {
    name: 'reports process assigned to an alias',
    filename: UTIL_FILE,
    code: `const p = process;`,
    errors: [processAliasError]
  },
  {
    name: 'reports process destructured into locals',
    filename: UTIL_FILE,
    code: `const { env } = process;`,
    errors: [processAliasError]
  },
  {
    name: 'reports fetch assigned to an alias',
    filename: UTIL_FILE,
    code: `const get = fetch;`,
    errors: [fetchAliasError]
  },
  {
    name: 'reports fetch aliased when declared through language globals',
    filename: UTIL_FILE,
    code: `const get = fetch;`,
    languageOptions: fetchGlobalOptions,
    errors: [fetchAliasError]
  },
  {
    name: 'reports setTimeout assigned to an alias',
    filename: UTIL_FILE,
    code: `const later = setTimeout;`,
    errors: [setTimeoutAliasError]
  },
  {
    name: 'reports queueMicrotask passed as a callback',
    filename: UTIL_FILE,
    code: `const run = (tasks) => tasks.forEach(queueMicrotask);`,
    errors: [queueMicrotaskAliasError]
  },
  {
    name: 'reports globalThis assigned to an alias',
    filename: UTIL_FILE,
    code: `const root = globalThis;`,
    errors: [globalThisAliasError]
  }
];

ruleTester.run(ruleName, rule, { valid, invalid });
