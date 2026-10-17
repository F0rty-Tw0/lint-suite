import type { RuleTester } from 'eslint';

import { LOCAL_ANALYSIS_OPTIONS_STUB } from '../../test/stubs/local-analysis-options.stub.ts';
import { component } from '../../test/utils/component-source.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester
} from '../../test/utils/rule-under-test.spec.util.ts';
import { unusedFieldError } from '../../test/utils/unused-member-error.spec.util.ts';
import type { RuleOptions } from '../common/no-unused-angular-fields.type.ts';

const effectFieldsAllowed: RuleOptions = {
  analysis: 'local',
  allowEffectFields: true
};
const allowEffectFieldsOptions = [effectFieldsAllowed];
const effectFieldsDenied: RuleOptions = {
  analysis: 'local',
  allowEffectFields: false
};
const denyEffectFieldsOptions = [effectFieldsDenied];

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

const reportsEffectFieldWithoutOption: RuleTester.InvalidTestCase = {
  options: LOCAL_ANALYSIS_OPTIONS_STUB,
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

const reportsToSignalFieldWhenOnlyEffectFieldsAllowed: RuleTester.InvalidTestCase =
  {
    name: 'reports an unread Angular toSignal field when only allowEffectFields is true',
    code: `import { Component } from '@angular/core';
        import { toSignal } from '@angular/core/rxjs-interop';
        @Component({ template: '' }) class TestComponent {
          private readonly value = toSignal({ subscribe: () => undefined } as never);
        }`,
    options: allowEffectFieldsOptions,
    errors: [unusedFieldError('value')]
  };

const valid: RuleTester.ValidTestCase[] = [
  acceptsUnreadEffectFieldWhenAllowed,
  allowsAutoCleanedEffectWithoutOptions,
  allowsAutoCleanedEffectWithInlineOptions,
  allowsNamespaceImportedEffect
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
  reportsToSignalFieldWhenOnlyEffectFieldsAllowed
];

ruleTester.run(ruleName, rule, { valid, invalid });
