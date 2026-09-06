import assert from 'node:assert/strict';

import { RuleTester } from 'eslint';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, test } from 'vitest';

import type { MemberCase } from './common/explicit-accessibility.type.ts';
import { typescript } from '../../typescript.ts';
import {
  accessibilityError,
  inClass,
  member,
  suggestion
} from './test/utils/explicit-accessibility-cases.spec.util.ts';

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

const plainMethodCase = member(
  'method',
  inClass((m) => `${m}method(): void {}`)
);
const decoratedPropertyCase = member(
  'name',
  inClass((m) => `@Input() ${m}name = '';`)
);
const adjacentDecoratorCase = member(
  'name',
  inClass((m) => `@Input()${m ? ` ${m}` : ''}name = '';`)
);
const readonlyPropertyCase = member(
  'x',
  inClass((m) => `${m}readonly x = 1;`)
);
const staticPropertyCase = member(
  'x',
  inClass((m) => `${m}static x = 1;`)
);
const overridePropertyCase = member(
  'x',
  inClass((m) => `${m}override x = 1;`)
);
const declarePropertyCase = member(
  'x',
  inClass((m) => `${m}declare x: string;`)
);
const asyncMethodCase = member(
  'run',
  inClass((m) => `${m}async run(): Promise<void> {}`)
);
const generatorMethodCase = member(
  'gen',
  inClass((m) => `${m}*gen(): Generator<number> {}`)
);
const getterCase = member(
  'v',
  inClass((m) => `${m}get v(): number { return 1; }`)
);
const setterCase = member(
  'v',
  inClass((m) => `${m}set v(_: number) {}`)
);
const computedKeyMethodCase = member(
  'Symbol.iterator',
  inClass((m) => `${m}[Symbol.iterator](): void {}`)
);
const abstractMethodCase = member(
  'run',
  inClass((m) => `${m}abstract run(): void;`, true)
);
const abstractPropertyCase = member(
  'field',
  inClass((m) => `${m}abstract field: string;`, true)
);
const accessorPropertyCase = member(
  'acc',
  inClass((m) => `${m}accessor acc = 1;`)
);
const classExpressionMethodCase = member(
  'method',
  (m) => `const A = class { ${m}method(): void {} };`
);
const constructorDefaultPrivateCase = member(
  'constructor',
  inClass((m) => `${m}constructor() {}`),
  { defaultAccessibility: 'private' },
  'public'
);
const readonlyParameterPropertyCase = member(
  'dep',
  inClass((m) => `public constructor(${m}readonly dep: string) {}`)
);
const privateParameterPropertyCase = member(
  'dep',
  inClass((m) => `public constructor(${m}readonly dep: string) {}`),
  { defaultAccessibility: 'private' }
);
const defaultedParameterPropertyCase = member(
  'limit',
  inClass((m) => `public constructor(${m}readonly limit = 1) {}`)
);
const noFixFieldCase = member(
  'field',
  inClass((m) => `${m}field = 1;`),
  { defaultAccessibility: 'none' }
);
const noFixConstructorCase = member(
  'constructor',
  inClass((m) => `${m}constructor() {}`),
  { defaultAccessibility: 'none' }
);
const privateFieldCase = member(
  'field',
  inClass((m) => `${m}field = 1;`),
  { defaultAccessibility: 'private' }
);
const protectedFieldCase = member(
  'field',
  inClass((m) => `${m}field = 1;`),
  { defaultAccessibility: 'protected' }
);

const namedCase = (
  name: string,
  testCase: MemberCase
): RuleTester.InvalidTestCase => {
  const invalidCase: RuleTester.InvalidTestCase = { name, ...testCase };

  return invalidCase;
};

const pairCase: RuleTester.InvalidTestCase = {
  name: 'fixes a constructor and its parameter property together',
  code: `class A { constructor(readonly dep: string) {} }`,
  options: pairOptions,
  output: `class A { public constructor(private readonly dep: string) {} }`,
  errors: pairErrors
};

const invalid: RuleTester.InvalidTestCase[] = [
  namedCase(
    'fixes a plain method to public and suggests the other levels',
    plainMethodCase
  ),
  namedCase(
    'fixes a property after a decorator without doubling spaces',
    decoratedPropertyCase
  ),
  namedCase(
    'fixes a property directly adjacent to a decorator',
    adjacentDecoratorCase
  ),
  namedCase('fixes a readonly property', readonlyPropertyCase),
  namedCase('fixes a static property', staticPropertyCase),
  namedCase('fixes an override property', overridePropertyCase),
  namedCase('fixes a declare property', declarePropertyCase),
  namedCase('fixes an async method', asyncMethodCase),
  namedCase('fixes a generator method', generatorMethodCase),
  namedCase('fixes a getter', getterCase),
  namedCase('fixes a setter', setterCase),
  namedCase('fixes a computed key method', computedKeyMethodCase),
  namedCase('fixes an abstract method', abstractMethodCase),
  namedCase('fixes an abstract property', abstractPropertyCase),
  namedCase('fixes an accessor property', accessorPropertyCase),
  namedCase('fixes a class expression member', classExpressionMethodCase),
  namedCase(
    'fixes a constructor to public even when the default is private',
    constructorDefaultPrivateCase
  ),
  namedCase(
    'fixes a readonly parameter property with the default',
    readonlyParameterPropertyCase
  ),
  namedCase(
    'fixes a parameter property with the private option',
    privateParameterPropertyCase
  ),
  namedCase(
    'fixes a defaulted parameter property and reports its name',
    defaultedParameterPropertyCase
  ),
  pairCase,
  namedCase(
    'reports without a fix and suggests all levels under none',
    noFixFieldCase
  ),
  namedCase(
    'reports a constructor without a fix under none',
    noFixConstructorCase
  ),
  namedCase('uses the private option for ordinary members', privateFieldCase),
  namedCase(
    'uses the protected option for ordinary members',
    protectedFieldCase
  )
];

ruleTester.run('local/explicit-accessibility', rule, { valid, invalid });
