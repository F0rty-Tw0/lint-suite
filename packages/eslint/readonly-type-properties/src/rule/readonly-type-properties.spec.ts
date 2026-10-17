import type { RuleTester } from 'eslint';

import { missingReadonly } from './test/utils/readonly-type-properties-cases.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester
} from './test/utils/readonly-type-properties-tester.spec.util.ts';

const primitiveErrors: RuleTester.TestCaseError[] = [
  missingReadonly(
    'name',
    `type A = { readonly name: string; count: number; ok: boolean };`
  ),
  missingReadonly(
    'count',
    `type A = { name: string; readonly count: number; ok: boolean };`
  ),
  missingReadonly(
    'ok',
    `type A = { name: string; count: number; readonly ok: boolean };`
  )
];
const onlyPrimitiveErrors: RuleTester.TestCaseError[] = [
  missingReadonly(
    'name',
    `type A = { roles: string[]; role: Role; readonly name: string };`
  )
];
const kindErrors: RuleTester.TestCaseError[] = [
  missingReadonly('kind', `type A = { readonly kind: 'a' | 'b' };`)
];
const nullableErrors: RuleTester.TestCaseError[] = [
  missingReadonly(
    'id',
    `type A = { readonly id: string | null; label?: string | undefined };`
  ),
  missingReadonly(
    'label',
    `type A = { id: string | null; readonly label?: string | undefined };`
  )
];
const exoticErrors: RuleTester.TestCaseError[] = [
  missingReadonly(
    'big',
    'type A = { readonly big: bigint; sym: symbol; tpl: `id-${string}` };'
  ),
  missingReadonly(
    'sym',
    'type A = { big: bigint; readonly sym: symbol; tpl: `id-${string}` };'
  ),
  missingReadonly(
    'tpl',
    'type A = { big: bigint; sym: symbol; readonly tpl: `id-${string}` };'
  )
];
const nestedErrors: RuleTester.TestCaseError[] = [
  missingReadonly('name', `type A = { item: { readonly name: string } };`)
];
const interfaceErrors: RuleTester.TestCaseError[] = [
  missingReadonly(
    'name',
    `interface A { readonly name: string; roles: string[] }`
  )
];
const parameterErrors: RuleTester.TestCaseError[] = [
  missingReadonly(
    'a',
    `function f(opts: { readonly a: string; list: number[] }): void {}`
  )
];
const stringKeyErrors: RuleTester.TestCaseError[] = [
  missingReadonly("'my-key'", `type A = { readonly 'my-key': string };`)
];
const computedKeyErrors: RuleTester.TestCaseError[] = [
  missingReadonly(
    'Symbol.iterator',
    `type A = { readonly [Symbol.iterator]: number };`
  )
];
const mixedErrors: RuleTester.TestCaseError[] = [
  missingReadonly('b', `type A = { readonly a: string; readonly b: string };`)
];
const assignedErrors: RuleTester.TestCaseError[] = [
  missingReadonly(
    'n',
    `type S = { readonly n: number }; const s: S = { n: 1 }; s.n = 2;`
  )
];

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts all-readonly primitive properties',
    code: `type A = { readonly name: string; readonly count: number }`
  },
  {
    name: 'ignores an array-valued property',
    code: `type A = { roles: string[] }`
  },
  {
    name: 'ignores an Array<T> property',
    code: `type A = { roles: Array<string> }`
  },
  {
    name: 'ignores a type reference property',
    code: `type A = { role: Role }`
  },
  {
    name: 'ignores a function-typed property',
    code: `type A = { fn: () => void }`
  },
  {
    name: 'ignores a tuple-typed property',
    code: `type A = { pair: [string, number] }`
  },
  {
    name: 'ignores a Date-typed property',
    code: `type A = { when: Date }`
  },
  {
    name: 'ignores unknown, any, and object properties',
    code: `type A = { value: unknown; other: any; obj: object }`
  },
  {
    name: 'ignores keyof and typeof properties',
    code: `type A = { k: keyof Item; t: typeof x }`
  },
  {
    name: 'ignores a generic type parameter property',
    code: `type A<T> = { value: T }`
  },
  {
    name: 'ignores a union with a non-primitive member',
    code: `type A = { mixed: string | Role }`
  },
  {
    name: 'ignores non-primitive interface members but reports primitives',
    code: `interface A { readonly a: string; roles: string[] }`
  },
  {
    name: 'ignores a method signature without readonly',
    code: `type A = { method(): void };`
  },
  {
    name: 'ignores a mapped type',
    code: `type A = { [K in Keys]: string };`
  },
  {
    name: 'ignores an index signature',
    code: `type A = { [key: string]: string };`
  },
  {
    name: 'ignores a class property',
    code: `class A { public x = 1; }`
  },
  {
    name: 'ignores an object literal',
    code: `const a = { x: 1 };`
  },
  {
    name: 'accepts a readonly computed key',
    code: `type A = { readonly [Symbol.iterator]: number };`
  },
  {
    name: 'accepts a readonly optional property',
    code: `type A = { readonly a?: string };`
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'suggests readonly for each primitive property in a type alias',
    code: `type A = { name: string; count: number; ok: boolean };`,
    output: null,
    errors: primitiveErrors
  },
  {
    name: 'reports only the primitive property, leaving array and reference properties untouched',
    code: `type A = { roles: string[]; role: Role; name: string };`,
    output: null,
    errors: onlyPrimitiveErrors
  },
  {
    name: 'suggests readonly for a literal-union property',
    code: `type A = { kind: 'a' | 'b' };`,
    output: null,
    errors: kindErrors
  },
  {
    name: 'suggests readonly for properties with null/undefined unions',
    code: `type A = { id: string | null; label?: string | undefined };`,
    output: null,
    errors: nullableErrors
  },
  {
    name: 'suggests readonly for bigint, symbol, and template-literal properties',
    code: 'type A = { big: bigint; sym: symbol; tpl: `id-${string}` };',
    output: null,
    errors: exoticErrors
  },
  {
    name: 'suggests readonly for a nested primitive property without touching the outer object property',
    code: `type A = { item: { name: string } };`,
    output: null,
    errors: nestedErrors
  },
  {
    name: 'suggests readonly for a primitive interface member',
    code: `interface A { name: string; roles: string[] }`,
    output: null,
    errors: interfaceErrors
  },
  {
    name: 'suggests readonly for a primitive property in an inline parameter object type',
    code: `function f(opts: { a: string; list: number[] }): void {}`,
    output: null,
    errors: parameterErrors
  },
  {
    name: 'suggests readonly for a string-literal key',
    code: `type A = { 'my-key': string };`,
    output: null,
    errors: stringKeyErrors
  },
  {
    name: 'suggests readonly for a computed key',
    code: `type A = { [Symbol.iterator]: number };`,
    output: null,
    errors: computedKeyErrors
  },
  {
    name: 'reports only the missing primitive property in a mixed type',
    code: `type A = { readonly a: string; b: string };`,
    output: null,
    errors: mixedErrors
  },
  {
    name: 'does not autofix a property the code assigns, so --fix keeps it compiling',
    code: `type S = { n: number }; const s: S = { n: 1 }; s.n = 2;`,
    output: null,
    errors: assignedErrors
  }
];

ruleTester.run(ruleName, rule, { valid, invalid });
