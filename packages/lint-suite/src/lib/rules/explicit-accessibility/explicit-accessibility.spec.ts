import assert from 'node:assert/strict';
import { describe, test } from 'vitest';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';

import {
  accessibilityError,
  inClass,
  member,
  suggestion
} from './utils/explicit-accessibility-cases.spec.util.js';
import { typescript } from '../../typescript.js';

const rule = typescript.map((config) => config.plugins?.['local']).find(Boolean)
  ?.rules?.['explicit-accessibility'];

assert.ok(rule, 'typescript preset must register local/explicit-accessibility');

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const languageOptions: Linter.LanguageOptions = {
  ecmaVersion: 'latest',
  parser: tseslint.parser,
  sourceType: 'module'
};

const ruleTester = new RuleTester({ languageOptions });

const constructorSuggestions: RuleTester.SuggestionOutput[] = [
  suggestion(
    'private',
    `class A { private constructor(readonly dep: string) {} }`
  ),
  suggestion(
    'protected',
    `class A { protected constructor(readonly dep: string) {} }`
  )
];
const dependencySuggestions: RuleTester.SuggestionOutput[] = [
  suggestion(
    'public',
    `class A { constructor(public readonly dep: string) {} }`
  ),
  suggestion(
    'protected',
    `class A { constructor(protected readonly dep: string) {} }`
  )
];
const pairErrors: RuleTester.TestCaseError[] = [
  accessibilityError('constructor', constructorSuggestions),
  accessibilityError('dep', dependencySuggestions)
];
const pairOptions = [{ defaultAccessibility: 'private' }];

const valid: RuleTester.ValidTestCase[] = [
  {
    name: 'accepts members that already declare accessibility',
    code: `
        class A {
          public field = 1;
          private readonly other = 2;
          protected static counter = 0;
          public override label = '';
          private declare typed: string;
          public accessor acc = 1;
          @Input() public decorated = '';
          public constructor(private readonly dep: string, protected optional = 1) {}
          public method(): void {}
          private async run(): Promise<void> {}
          protected *gen(): Generator<number> {}
          public get value(): number { return 1; }
          public set value(_: number) {}
          public [Symbol.iterator](): void {}
        }
      `
  },
  {
    name: 'accepts abstract members that declare accessibility',
    code: `
        abstract class A {
          protected abstract field: string;
          public abstract run(): void;
          protected abstract accessor acc: number;
        }
      `
  },
  {
    name: 'ignores #private fields and methods',
    code: `
        class A {
          #secret = 1;
          #hidden(): void {}
        }
      `
  },
  {
    name: 'ignores object literal members',
    code: `
        const value = {
          field: 1,
          method(): void {},
          get value(): number { return 1; }
        };
      `
  },
  {
    name: 'ignores static blocks',
    code: `class A { static { console.log('init'); } }`
  }
];

const invalid: RuleTester.InvalidTestCase[] = [
  {
    name: 'fixes a plain method to public and suggests the other levels',
    ...member(
      'method',
      inClass((m) => `${m}method(): void {}`)
    )
  },
  {
    name: 'fixes a property after a decorator without doubling spaces',
    ...member(
      'name',
      inClass((m) => `@Input() ${m}name = '';`)
    )
  },
  {
    name: 'fixes a property directly adjacent to a decorator',
    ...member(
      'name',
      inClass((m) => `@Input()${m ? ` ${m}` : ''}name = '';`)
    )
  },
  {
    name: 'fixes a readonly property',
    ...member(
      'x',
      inClass((m) => `${m}readonly x = 1;`)
    )
  },
  {
    name: 'fixes a static property',
    ...member(
      'x',
      inClass((m) => `${m}static x = 1;`)
    )
  },
  {
    name: 'fixes an override property',
    ...member(
      'x',
      inClass((m) => `${m}override x = 1;`)
    )
  },
  {
    name: 'fixes a declare property',
    ...member(
      'x',
      inClass((m) => `${m}declare x: string;`)
    )
  },
  {
    name: 'fixes an async method',
    ...member(
      'run',
      inClass((m) => `${m}async run(): Promise<void> {}`)
    )
  },
  {
    name: 'fixes a generator method',
    ...member(
      'gen',
      inClass((m) => `${m}*gen(): Generator<number> {}`)
    )
  },
  {
    name: 'fixes a getter',
    ...member(
      'v',
      inClass((m) => `${m}get v(): number { return 1; }`)
    )
  },
  {
    name: 'fixes a setter',
    ...member(
      'v',
      inClass((m) => `${m}set v(_: number) {}`)
    )
  },
  {
    name: 'fixes a computed key method',
    ...member(
      'Symbol.iterator',
      inClass((m) => `${m}[Symbol.iterator](): void {}`)
    )
  },
  {
    name: 'fixes an abstract method',
    ...member(
      'run',
      inClass((m) => `${m}abstract run(): void;`, true)
    )
  },
  {
    name: 'fixes an abstract property',
    ...member(
      'field',
      inClass((m) => `${m}abstract field: string;`, true)
    )
  },
  {
    name: 'fixes an accessor property',
    ...member(
      'acc',
      inClass((m) => `${m}accessor acc = 1;`)
    )
  },
  {
    name: 'fixes a class expression member',
    ...member('method', (m) => `const A = class { ${m}method(): void {} };`)
  },
  {
    name: 'fixes a constructor to public even when the default is private',
    ...member(
      'constructor',
      inClass((m) => `${m}constructor() {}`),
      { defaultAccessibility: 'private' },
      'public'
    )
  },
  {
    name: 'fixes a readonly parameter property with the default',
    ...member(
      'dep',
      inClass((m) => `public constructor(${m}readonly dep: string) {}`)
    )
  },
  {
    name: 'fixes a parameter property with the private option',
    ...member(
      'dep',
      inClass((m) => `public constructor(${m}readonly dep: string) {}`),
      { defaultAccessibility: 'private' }
    )
  },
  {
    name: 'fixes a defaulted parameter property and reports its name',
    ...member(
      'limit',
      inClass((m) => `public constructor(${m}readonly limit = 1) {}`)
    )
  },
  {
    name: 'fixes a constructor and its parameter property together',
    code: `class A { constructor(readonly dep: string) {} }`,
    options: pairOptions,
    output: `class A { public constructor(private readonly dep: string) {} }`,
    errors: pairErrors
  },
  {
    name: 'reports without a fix and suggests all levels under none',
    ...member(
      'field',
      inClass((m) => `${m}field = 1;`),
      { defaultAccessibility: 'none' }
    )
  },
  {
    name: 'reports a constructor without a fix under none',
    ...member(
      'constructor',
      inClass((m) => `${m}constructor() {}`),
      { defaultAccessibility: 'none' }
    )
  },
  {
    name: 'uses the private option for ordinary members',
    ...member(
      'field',
      inClass((m) => `${m}field = 1;`),
      { defaultAccessibility: 'private' }
    )
  },
  {
    name: 'uses the protected option for ordinary members',
    ...member(
      'field',
      inClass((m) => `${m}field = 1;`),
      { defaultAccessibility: 'protected' }
    )
  }
];

ruleTester.run('local/explicit-accessibility', rule, { valid, invalid });
