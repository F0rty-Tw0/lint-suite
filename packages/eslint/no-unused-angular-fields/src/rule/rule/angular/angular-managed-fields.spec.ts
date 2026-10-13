import type { RuleTester } from 'eslint';

import { component } from '../../test/utils/component-source.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester
} from '../../test/utils/rule-under-test.spec.util.ts';
import { unusedFieldError } from '../../test/utils/unused-member-error.spec.util.ts';
import type { RuleOptions } from '../common/no-unused-angular-instance-fields.type.ts';

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
const rxjsInteropFieldsAllowed: RuleOptions = {
  analysis: 'local',
  allowRxjsInteropFields: true
};
const allowRxjsInteropFieldsOptions = [rxjsInteropFieldsAllowed];
const rxjsInteropFieldsDenied: RuleOptions = {
  analysis: 'local',
  allowRxjsInteropFields: false
};
const denyRxjsInteropFieldsOptions = [rxjsInteropFieldsDenied];

const exemptsOutputFromObservableWithoutOption: RuleTester.ValidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'exempts an unread outputFromObservable field when allowRxjsInteropFields is omitted',
  code: `import { Component } from '@angular/core';
        import { outputFromObservable } from '@angular/core/rxjs-interop';
        @Component({ template: '' }) class TestComponent {
          readonly changed = outputFromObservable({} as never);
        }`
};

const exemptsSignalInputsWithNgOnChanges: RuleTester.ValidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'exempts unread signal inputs and models of a class declaring ngOnChanges',
  code: `import * as ng from '@angular/core';
        @ng.Component({ template: '' }) class TestComponent {
          readonly name = ng.input(''); readonly id = ng.input.required<string>();
          readonly checked = ng.model(false);
          ngOnChanges(): void {}
        }`
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

const acceptsUnreadToSignalFieldWhenAllowed: RuleTester.ValidTestCase = {
  name: 'accepts an unread Angular toSignal field when allowRxjsInteropFields is true',
  code: `import { Component } from '@angular/core';
        import { toSignal } from '@angular/core/rxjs-interop';
        @Component({ template: '' }) class TestComponent {
          private readonly value = toSignal({ subscribe: () => undefined } as never);
        }`,
  options: allowRxjsInteropFieldsOptions
};

const allowsAliasedToObservableField: RuleTester.ValidTestCase = {
  name: 'allows an aliased Angular toObservable field when enabled',
  code: `import { Component } from '@angular/core';
        import { toObservable as asObservable } from '@angular/core/rxjs-interop';
        @Component({ template: '' }) class TestComponent {
          private readonly source = asObservable({} as never);
        }`,
  options: allowRxjsInteropFieldsOptions
};

const allowsNamespaceImportedToSignal: RuleTester.ValidTestCase = {
  name: 'allows a namespace-imported Angular toSignal field when enabled',
  code: `import { Component } from '@angular/core';
        import * as interop from '@angular/core/rxjs-interop';
        @Component({ template: '' }) class TestComponent {
          private readonly value = interop.toSignal({ subscribe: () => undefined } as never);
        }`,
  options: allowRxjsInteropFieldsOptions
};

const reportsUnreadSignalQueries: RuleTester.InvalidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'reports unread Angular signal query fields',
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
  ),
  errors: [
    unusedFieldError('view'),
    unusedFieldError('views'),
    unusedFieldError('content'),
    unusedFieldError('contents')
  ]
};

const exemptsComponentRefTypedField: RuleTester.ValidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'exempts unread fields typed with an Angular ComponentRef import',
  code: `import { Component } from '@angular/core';
        import type { ComponentRef } from '@angular/core';
        @Component({ template: '' }) class TestComponent {
          private readonly ref!: ComponentRef;
        }`
};

const exemptsComponentRefTypedFieldUnderShadowingValue: RuleTester.ValidTestCase =
  {
    options: [{ analysis: 'local' }],
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
  options: [{ analysis: 'local' }],
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

const reportsToSignalFieldWithoutOption: RuleTester.InvalidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'reports Angular toSignal fields when allowRxjsInteropFields is omitted',
  code: `import { Component } from '@angular/core';
        import { toSignal } from '@angular/core/rxjs-interop';
        @Component({ template: '' }) class TestComponent {
          private readonly value = toSignal({ subscribe: () => undefined } as never);
        }`,
  errors: [unusedFieldError('value')]
};

const reportsToSignalFieldWhenDenied: RuleTester.InvalidTestCase = {
  name: 'reports an unread Angular toSignal field when allowRxjsInteropFields is false',
  code: `import { Component } from '@angular/core';
        import { toSignal } from '@angular/core/rxjs-interop';
        @Component({ template: '' }) class TestComponent {
          private readonly value = toSignal({ subscribe: () => undefined } as never);
        }`,
  options: denyRxjsInteropFieldsOptions,
  errors: [unusedFieldError('value')]
};

const reportsLocalToSignalField: RuleTester.InvalidTestCase = {
  name: 'reports an unread same-named non-Angular toSignal field when allowRxjsInteropFields is true',
  code: `import { Component } from '@angular/core';
        function toSignal(source: unknown): unknown { return source; }
        @Component({ template: '' }) class TestComponent {
          private readonly value = toSignal({});
        }`,
  options: allowRxjsInteropFieldsOptions,
  errors: [unusedFieldError('value')]
};

const reportsTakeUntilDestroyedField: RuleTester.InvalidTestCase = {
  name: 'reports an unread Angular takeUntilDestroyed field even when allowRxjsInteropFields is true',
  code: `import { Component } from '@angular/core';
        import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
        @Component({ template: '' }) class TestComponent {
          private readonly guard = takeUntilDestroyed();
        }`,
  options: allowRxjsInteropFieldsOptions,
  errors: [unusedFieldError('guard')]
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

const reportsUnreadSignalBindings: RuleTester.InvalidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'reports unread signal inputs, models and outputs',
  code: component(
    `public signalInput = inputSignal(''); public required = inputSignal.required<string>();
        public signalOutput = output<void>(); public signalModel = model(false);`,
    {
      metadata: "template: ''",
      imports: 'Component, input as inputSignal, model, output'
    }
  ),
  errors: [
    unusedFieldError('signalInput'),
    unusedFieldError('required'),
    unusedFieldError('signalOutput'),
    unusedFieldError('signalModel')
  ]
};

const reportsNamespaceSignalOutputWithNgOnChanges: RuleTester.InvalidTestCase =
  {
    options: [{ analysis: 'local' }],
    name: 'reports an unread namespace-imported signal output of a class declaring ngOnChanges',
    code: `import * as ng from '@angular/core';
        @ng.Component({ template: '' }) class TestComponent {
          readonly changed = ng.output<string>();
          ngOnChanges(): void {}
        }`,
    errors: [unusedFieldError('changed')]
  };

const reportsLocalComponentRefTypedField: RuleTester.InvalidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'reports unread fields whose local type is named ComponentRef',
  code: `import { Component } from '@angular/core';
        interface ComponentRef {}
        @Component({ template: '' }) class TestComponent {
          private readonly ref!: ComponentRef;
        }`,
  errors: [unusedFieldError('ref')]
};

const valid: RuleTester.ValidTestCase[] = [
  exemptsOutputFromObservableWithoutOption,
  exemptsSignalInputsWithNgOnChanges,
  acceptsUnreadEffectFieldWhenAllowed,
  allowsAutoCleanedEffectWithoutOptions,
  allowsAutoCleanedEffectWithInlineOptions,
  allowsNamespaceImportedEffect,
  acceptsUnreadToSignalFieldWhenAllowed,
  allowsAliasedToObservableField,
  allowsNamespaceImportedToSignal,
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
  reportsToSignalFieldWithoutOption,
  reportsToSignalFieldWhenDenied,
  reportsLocalToSignalField,
  reportsTakeUntilDestroyedField,
  reportsToSignalFieldWhenOnlyEffectFieldsAllowed,
  reportsUnreadSignalBindings,
  reportsUnreadSignalQueries,
  reportsNamespaceSignalOutputWithNgOnChanges,
  reportsLocalComponentRefTypedField
];

ruleTester.run(ruleName, rule, { valid, invalid });
