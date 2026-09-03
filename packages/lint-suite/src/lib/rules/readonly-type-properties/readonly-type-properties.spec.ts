import assert from 'node:assert/strict';
import { describe, test } from 'vitest';

import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';

import { typescript } from '../../typescript.js';

const rule = typescript.map((config) => config.plugins?.['local']).find(Boolean)
  ?.rules?.['readonly-type-properties'];

assert.ok(
  rule,
  'typescript preset must register local/readonly-type-properties'
);

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    parser: tseslint.parser,
    sourceType: 'module'
  }
});

ruleTester.run('local/readonly-type-properties', rule, {
  valid: [
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
      name: 'ignores a ReadonlyArray<T> property',
      code: `type A = { roles: ReadonlyArray<string> }`
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
  ],
  invalid: [
    {
      name: 'fixes all primitive properties in a type alias',
      code: `type A = { name: string; count: number; ok: boolean };`,
      output: `type A = { readonly name: string; readonly count: number; readonly ok: boolean };`,
      errors: [
        { messageId: 'missingReadonly', data: { name: 'name' } },
        { messageId: 'missingReadonly', data: { name: 'count' } },
        { messageId: 'missingReadonly', data: { name: 'ok' } }
      ]
    },
    {
      name: 'reports only the primitive property, leaving array and reference properties untouched',
      code: `type A = { roles: string[]; role: Role; name: string };`,
      output: `type A = { roles: string[]; role: Role; readonly name: string };`,
      errors: [{ messageId: 'missingReadonly', data: { name: 'name' } }]
    },
    {
      name: 'fixes a literal-union property',
      code: `type A = { kind: 'a' | 'b' };`,
      output: `type A = { readonly kind: 'a' | 'b' };`,
      errors: [{ messageId: 'missingReadonly', data: { name: 'kind' } }]
    },
    {
      name: 'fixes properties with null/undefined unions',
      code: `type A = { id: string | null; label?: string | undefined };`,
      output: `type A = { readonly id: string | null; readonly label?: string | undefined };`,
      errors: [
        { messageId: 'missingReadonly', data: { name: 'id' } },
        { messageId: 'missingReadonly', data: { name: 'label' } }
      ]
    },
    {
      name: 'fixes bigint, symbol, and template-literal properties',
      code: 'type A = { big: bigint; sym: symbol; tpl: `id-${string}` };',
      output:
        'type A = { readonly big: bigint; readonly sym: symbol; readonly tpl: `id-${string}` };',
      errors: [
        { messageId: 'missingReadonly', data: { name: 'big' } },
        { messageId: 'missingReadonly', data: { name: 'sym' } },
        { messageId: 'missingReadonly', data: { name: 'tpl' } }
      ]
    },
    {
      name: 'fixes a nested primitive property without touching the outer object property',
      code: `type A = { item: { name: string } };`,
      output: `type A = { item: { readonly name: string } };`,
      errors: [{ messageId: 'missingReadonly', data: { name: 'name' } }]
    },
    {
      name: 'fixes a primitive interface member',
      code: `interface A { name: string; roles: string[] }`,
      output: `interface A { readonly name: string; roles: string[] }`,
      errors: [{ messageId: 'missingReadonly', data: { name: 'name' } }]
    },
    {
      name: 'fixes a primitive property in an inline parameter object type',
      code: `function f(opts: { a: string; list: number[] }): void {}`,
      output: `function f(opts: { readonly a: string; list: number[] }): void {}`,
      errors: [{ messageId: 'missingReadonly', data: { name: 'a' } }]
    },
    {
      name: 'fixes a string-literal key',
      code: `type A = { 'my-key': string };`,
      output: `type A = { readonly 'my-key': string };`,
      errors: [{ messageId: 'missingReadonly', data: { name: "'my-key'" } }]
    },
    {
      name: 'fixes a computed key',
      code: `type A = { [Symbol.iterator]: number };`,
      output: `type A = { readonly [Symbol.iterator]: number };`,
      errors: [
        { messageId: 'missingReadonly', data: { name: 'Symbol.iterator' } }
      ]
    },
    {
      name: 'reports only the missing primitive property in a mixed type',
      code: `type A = { readonly a: string; b: string };`,
      output: `type A = { readonly a: string; readonly b: string };`,
      errors: [{ messageId: 'missingReadonly', data: { name: 'b' } }]
    }
  ]
});
