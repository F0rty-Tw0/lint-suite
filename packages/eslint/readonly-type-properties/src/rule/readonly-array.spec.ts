import type { RuleTester } from 'eslint';

import { readonlyArray } from './test/utils/readonly-type-properties-cases.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester
} from './test/utils/readonly-type-properties-tester.spec.util.ts';

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts a T[] array type',
    code: `type A = { roles: string[] };`
  },
  {
    name: 'accepts an Array<T> type',
    code: `type A = Array<string>;`
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'suggests T[] for a readonly array type',
    code: `type A = readonly string[];`,
    output: null,
    errors: [readonlyArray('string[]', `type A = string[];`)]
  },
  {
    name: 'suggests T[] for a ReadonlyArray<T> property',
    code: `type A = { roles: ReadonlyArray<string> };`,
    output: null,
    errors: [readonlyArray('string[]', `type A = { roles: string[] };`)]
  },
  {
    name: 'suggests a parenthesised union array for ReadonlyArray<A | B>',
    code: `type A = ReadonlyArray<A | B>;`,
    output: null,
    errors: [readonlyArray('(A | B)[]', `type A = (A | B)[];`)]
  },
  {
    name: 'does not autofix a readonly array that holds a frozen value, so --fix keeps it compiling',
    code: `const a: readonly number[] = Object.freeze([1]);`,
    output: null,
    errors: [
      readonlyArray('number[]', `const a: number[] = Object.freeze([1]);`)
    ]
  }
];

ruleTester.run(ruleName, rule, { valid, invalid });
