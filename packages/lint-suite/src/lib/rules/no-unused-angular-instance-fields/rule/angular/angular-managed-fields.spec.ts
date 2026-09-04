import type { RuleTester } from 'eslint';

import { component } from '../../utils/component-source.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.ts';
import { unusedFieldError } from '../../utils/unused-member-error.spec.util.ts';
import type { RuleOptions } from '../common/no-unused-angular-instance-fields.type.ts';

const effectFieldsAllowed: RuleOptions = { allowEffectFields: true };
const allowEffectFieldsOptions = [effectFieldsAllowed];
const effectFieldsDenied: RuleOptions = { allowEffectFields: false };
const denyEffectFieldsOptions = [effectFieldsDenied];

const exemptsSignalAndDecoratorFields: RuleTester.ValidTestCase = {
  name: 'exempts Angular signal APIs and decorator-managed fields',
  code: component(
    `@Input() public decoratedInput = ''; @ViewChild('content') private content: unknown;
        public signalInput = inputSignal(''); public signalOutput = output<void>(); public signalModel = model(false);`,
    {
      metadata: "template: ''",
      imports:
        'Component, Input, ViewChild, input as inputSignal, model, output'
    }
  )
};

const acceptsUnreadEffectFieldWhenAllowed: RuleTester.ValidTestCase = {
  name: 'accepts an unread Angular effect field when allowEffectFields is true',
  code: component(`private readonly cleanup = effect(() => undefined);`, {
    metadata: `template: ''`,
    imports: 'Component, effect'
  }),
  options: allowEffectFieldsOptions
};

const allowsAutoCleanedEffectWithoutOptions: RuleTester.ValidTestCase = {
  name: 'allows auto-cleaned Angular effect fields with no call options when enabled',
  code: component(
    `private readonly titleEffect = createEffect(() => undefined);`,
    { metadata: `template: ''`, imports: 'Component, effect as createEffect' }
  ),
  options: allowEffectFieldsOptions
};

const allowsAutoCleanedEffectWithInlineOptions: RuleTester.ValidTestCase = {
  name: 'allows auto-cleaned Angular effect fields with known inline options when enabled',
  code: component(
    `private readonly titleEffect = effect(() => undefined, { injector: undefined });`,
    { metadata: `template: ''`, imports: 'Component, effect' }
  ),
  options: allowEffectFieldsOptions
};

const allowsNamespaceImportedEffect: RuleTester.ValidTestCase = {
  name: 'allows namespace-imported auto-cleaned Angular effect fields when enabled',
  code: `import * as ng from '@angular/core';
        @ng.Component({ template: '' }) class TestComponent {
          private readonly titleEffect = ng.effect(() => undefined);
        }`,
  options: allowEffectFieldsOptions
};

const treatsSignalQueriesAsManaged: RuleTester.ValidTestCase = {
  name: 'treats Angular signal query fields as managed',
  code: component(
    `private readonly view = viewChild<unknown>('view');
        private readonly views = viewChildren<unknown>('view');
        private readonly content = contentChild<unknown>('content');
        private readonly contents = contentChildren<unknown>('content');`,
    {
      metadata: `template: ''`,
      imports:
        'Component, viewChild, viewChildren, contentChild, contentChildren'
    }
  )
};

const exemptsComponentRefTypedField: RuleTester.ValidTestCase = {
  name: 'exempts unread fields typed with an Angular ComponentRef import',
  code: `import { Component } from '@angular/core';
        import type { ComponentRef } from '@angular/core';
        @Component({ template: '' }) class TestComponent {
          private readonly ref!: ComponentRef;
        }`
};

const exemptsComponentRefTypedFieldUnderShadowingValue: RuleTester.ValidTestCase =
  {
    name: 'exempts unread fields typed with an Angular ComponentRef import despite an enclosing same-named value',
    code: `import { Component } from '@angular/core';
        import type { ComponentRef } from '@angular/core';
        function createComponent() {
          const ComponentRef = undefined;
          @Component({ template: '' }) class TestComponent {
            private readonly ref!: ComponentRef;
          }
          return TestComponent;
        }`
  };

const reportsEffectFieldWithoutOption: RuleTester.InvalidTestCase = {
  name: 'reports auto-cleaned Angular effect fields when allowEffectFields is omitted',
  code: component(`private readonly titleEffect = effect(() => undefined);`, {
    metadata: `template: ''`,
    imports: 'Component, effect'
  }),
  errors: [unusedFieldError('titleEffect')]
};

const reportsEffectFieldWhenDenied: RuleTester.InvalidTestCase = {
  name: 'reports an unread Angular effect field when allowEffectFields is false',
  code: component(`private readonly cleanup = effect(() => undefined);`, {
    metadata: `template: ''`,
    imports: 'Component, effect'
  }),
  options: denyEffectFieldsOptions,
  errors: [unusedFieldError('cleanup')]
};

const reportsLocalEffectField: RuleTester.InvalidTestCase = {
  name: 'reports an unread same-named non-Angular effect field when allowEffectFields is true',
  code: `import { Component } from '@angular/core';
        function effect(callback: () => void): unknown { callback(); return {}; }
        @Component({ template: '' }) class TestComponent {
          private readonly cleanup = effect(() => undefined);
        }`,
  options: allowEffectFieldsOptions,
  errors: [unusedFieldError('cleanup')]
};

const reportsShadowedEffectField: RuleTester.InvalidTestCase = {
  name: 'reports an unread Angular effect field shadowed by an enclosing parameter when allowEffectFields is true',
  code: `import { Component, effect } from '@angular/core';
        function createComponent(effect: unknown) {
          @Component({ template: '' }) class TestComponent {
            private readonly cleanup = effect(() => undefined);
          }
        }`,
  options: allowEffectFieldsOptions,
  errors: [unusedFieldError('cleanup')]
};

const reportsManualCleanupEffectField: RuleTester.InvalidTestCase = {
  name: 'reports manual-cleanup Angular effect fields when enabled',
  code: component(
    `private readonly titleEffect = effect(() => undefined, { manualCleanup: true });`,
    { metadata: `template: ''`, imports: 'Component, effect' }
  ),
  options: allowEffectFieldsOptions,
  errors: [unusedFieldError('titleEffect')]
};

const reportsEffectFieldWithVariableOptions: RuleTester.InvalidTestCase = {
  name: 'reports effect fields when variable options may require manual cleanup',
  code: `import { Component, effect } from '@angular/core';
        const effectOptions = { manualCleanup: true };
        @Component({ template: '' }) class TestComponent {
          private readonly titleEffect = effect(() => undefined, effectOptions);
        }`,
  options: allowEffectFieldsOptions,
  errors: [unusedFieldError('titleEffect')]
};

const reportsEffectFieldWithSpreadOptions: RuleTester.InvalidTestCase = {
  name: 'reports effect fields when inline options have an unknown spread',
  code: `import { Component, effect } from '@angular/core';
        const effectOptions = { manualCleanup: true };
        @Component({ template: '' }) class TestComponent {
          private readonly titleEffect = effect(() => undefined, { ...effectOptions });
        }`,
  options: allowEffectFieldsOptions,
  errors: [unusedFieldError('titleEffect')]
};

const reportsEffectFieldWithComputedOption: RuleTester.InvalidTestCase = {
  name: 'reports effect fields when inline options have an unknown computed property',
  code: `import { Component, effect } from '@angular/core';
        const cleanupOption = 'manualCleanup';
        @Component({ template: '' }) class TestComponent {
          private readonly titleEffect = effect(() => undefined, { [cleanupOption]: true });
        }`,
  options: allowEffectFieldsOptions,
  errors: [unusedFieldError('titleEffect')]
};

const reportsEffectFieldWithStringKeyedOption: RuleTester.InvalidTestCase = {
  name: 'reports effect fields with a string-keyed manual cleanup option',
  code: component(
    `private readonly titleEffect = effect(() => undefined, { 'manualCleanup': true });`,
    { metadata: `template: ''`, imports: 'Component, effect' }
  ),
  options: allowEffectFieldsOptions,
  errors: [unusedFieldError('titleEffect')]
};

const reportsUnreadSubscriptionField: RuleTester.InvalidTestCase = {
  name: 'reports unread subscription fields when allowEffectFields is enabled',
  code: component(
    `private readonly subscription = ({ subscribe: () => undefined }).subscribe();`
  ),
  options: allowEffectFieldsOptions,
  errors: [unusedFieldError('subscription')]
};

const reportsLocalComponentRefTypedField: RuleTester.InvalidTestCase = {
  name: 'reports unread fields whose local type is named ComponentRef',
  code: `import { Component } from '@angular/core';
        interface ComponentRef {}
        @Component({ template: '' }) class TestComponent {
          private readonly ref!: ComponentRef;
        }`,
  errors: [unusedFieldError('ref')]
};

const valid: RuleTester.ValidTestCase[] = [
  exemptsSignalAndDecoratorFields,
  acceptsUnreadEffectFieldWhenAllowed,
  allowsAutoCleanedEffectWithoutOptions,
  allowsAutoCleanedEffectWithInlineOptions,
  allowsNamespaceImportedEffect,
  treatsSignalQueriesAsManaged,
  exemptsComponentRefTypedField,
  exemptsComponentRefTypedFieldUnderShadowingValue
];

const invalid: RuleTester.InvalidTestCase[] = [
  reportsEffectFieldWithoutOption,
  reportsEffectFieldWhenDenied,
  reportsLocalEffectField,
  reportsShadowedEffectField,
  reportsManualCleanupEffectField,
  reportsEffectFieldWithVariableOptions,
  reportsEffectFieldWithSpreadOptions,
  reportsEffectFieldWithComputedOption,
  reportsEffectFieldWithStringKeyedOption,
  reportsUnreadSubscriptionField,
  reportsLocalComponentRefTypedField
];

ruleTester.run(ruleName, rule, { valid, invalid });
