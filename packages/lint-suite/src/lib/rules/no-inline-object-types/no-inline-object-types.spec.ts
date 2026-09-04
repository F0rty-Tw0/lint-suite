import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import { typescript } from '../../typescript.ts';

const rule = typescript.map((config) => config.plugins?.['local']).find(Boolean)
  ?.rules?.['no-inline-object-types'];

assert.ok(rule, 'typescript preset must register local/no-inline-object-types');

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

const ruleTester = new RuleTester({ languageOptions });

const inlineObjectType: RuleTester.TestCaseError = {
  messageId: 'inlineObjectType'
};

const oneError: RuleTester.TestCaseError[] = [inlineObjectType];
const twoErrors: RuleTester.TestCaseError[] = [
  inlineObjectType,
  inlineObjectType
];

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts a plain type alias object type',
    code: `type A = { readonly a: string };`
  },
  {
    name: 'accepts a type alias referencing another type',
    code: `type A = { readonly item: Item };`
  },
  {
    name: 'ignores an interface member',
    code: `interface A { item: { name: string } }`
  },
  {
    name: 'ignores a function parameter type',
    code: `function f(opts: { a: string }): void {}`
  },
  {
    name: 'ignores a function return type',
    code: `function f(): { a: string } { return { a: '' }; }`
  },
  {
    name: 'ignores a satisfies expression',
    code: `const cfg = { port: 1 } satisfies { port: number };`
  },
  {
    name: 'ignores an as expression',
    code: `const raw = x as { ok: boolean };`
  },
  {
    name: 'ignores a generic call argument',
    code: `const s = signal<{ open: boolean }>({ open: false });`
  },
  {
    name: 'ignores a declare module member',
    code: `declare module 'x' { export const y: { z: number }; }`
  },
  {
    name: 'ignores a class property type',
    code: `class A { public state: { open: boolean } = { open: false }; }`
  },
  {
    name: 'ignores an array type alias',
    code: `type A = Item[];`
  },
  {
    name: 'accepts a generic type alias object type',
    code: `type A<T> = { readonly value: T };`
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'reports a nested inline object property',
    code: `type A = { item: { name: string } };`,
    errors: oneError
  },
  {
    name: 'reports an inline object array element type',
    code: `type A = { items: { name: string }[] };`,
    errors: oneError
  },
  {
    name: 'reports an inline object union member',
    code: `type A = { item: { name: string } | null };`,
    errors: oneError
  },
  {
    name: 'reports both sides of an intersection',
    code: `type A = { a: string } & { b: string };`,
    errors: twoErrors
  },
  {
    name: 'reports an inline object generic argument in Readonly',
    code: `type A = Readonly<{ a: string }>;`,
    errors: oneError
  },
  {
    name: 'reports an inline object generic argument in Record',
    code: `type A = Record<string, { count: number }>;`,
    errors: oneError
  },
  {
    name: 'reports an inline object generic argument in Promise',
    code: `type A = Promise<{ a: string }>;`,
    errors: oneError
  },
  {
    name: 'reports each level of a deeply nested inline object',
    code: `type A = { a: { b: { c: string } } };`,
    errors: twoErrors
  },
  {
    name: 'reports a nested inline object in an exported type alias',
    code: `export type A = { item: { name: string } };`,
    errors: oneError
  }
];

ruleTester.run('local/no-inline-object-types', rule, { valid, invalid });
