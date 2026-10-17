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
    name: 'suggests a parenthesised keyof array for ReadonlyArray<keyof T>',
    code: `type A<T> = ReadonlyArray<keyof T>;`,
    output: null,
    errors: [readonlyArray('(keyof T)[]', `type A<T> = (keyof T)[];`)]
  },
  {
    name: 'suggests a parenthesised constructor array for ReadonlyArray<new () => T>',
    code: `type A<T> = ReadonlyArray<new () => T>;`,
    output: null,
    errors: [readonlyArray('(new () => T)[]', `type A<T> = (new () => T)[];`)]
  },
  {
    name: 'suggests a parenthesised infer array for ReadonlyArray<infer U>',
    code: `type A<T> = T extends ReadonlyArray<infer U> ? U : never;`,
    output: null,
    errors: [
      readonlyArray(
        '(infer U)[]',
        `type A<T> = T extends (infer U)[] ? U : never;`
      )
    ]
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
