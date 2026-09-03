import { component } from '../../utils/component-source.spec.util.js';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.js';

ruleTester.run(ruleName, rule, {
  valid: [
    {
      name: 'exempts Angular signal APIs and decorator-managed fields',
      code: component(
        `@Input() public decoratedInput = ''; @ViewChild('content') private content: unknown;
        public signalInput = inputSignal(''); public signalOutput = output<void>(); public signalModel = model(false);`,
        "template: ''",
        'Component, Input, ViewChild, input as inputSignal, model, output'
      )
    },
    {
      name: 'accepts an unread Angular effect field when allowEffectFields is true',
      code: component(
        `private readonly cleanup = effect(() => undefined);`,
        `template: ''`,
        'Component, effect'
      ),
      options: [{ allowEffectFields: true }]
    },
    {
      name: 'allows auto-cleaned Angular effect fields with no call options when enabled',
      code: component(
        `private readonly titleEffect = createEffect(() => undefined);`,
        `template: ''`,
        'Component, effect as createEffect'
      ),
      options: [{ allowEffectFields: true }]
    },
    {
      name: 'allows auto-cleaned Angular effect fields with known inline options when enabled',
      code: component(
        `private readonly titleEffect = effect(() => undefined, { injector: undefined });`,
        `template: ''`,
        'Component, effect'
      ),
      options: [{ allowEffectFields: true }]
    },
    {
      name: 'allows namespace-imported auto-cleaned Angular effect fields when enabled',
      code: `import * as ng from '@angular/core';
        @ng.Component({ template: '' }) class TestComponent {
          private readonly titleEffect = ng.effect(() => undefined);
        }`,
      options: [{ allowEffectFields: true }]
    },
    {
      name: 'treats Angular signal query fields as managed',
      code: component(
        `private readonly view = viewChild<unknown>('view');
        private readonly views = viewChildren<unknown>('view');
        private readonly content = contentChild<unknown>('content');
        private readonly contents = contentChildren<unknown>('content');`,
        `template: ''`,
        'Component, viewChild, viewChildren, contentChild, contentChildren'
      )
    },
    {
      name: 'exempts unread fields typed with an Angular ComponentRef import',
      code: `import { Component } from '@angular/core';
        import type { ComponentRef } from '@angular/core';
        @Component({ template: '' }) class TestComponent {
          private readonly ref!: ComponentRef;
        }`
    },
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
    }
  ],
  invalid: [
    {
      name: 'reports auto-cleaned Angular effect fields when allowEffectFields is omitted',
      code: component(
        `private readonly titleEffect = effect(() => undefined);`,
        `template: ''`,
        'Component, effect'
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'titleEffect' } }]
    },
    {
      name: 'reports an unread Angular effect field when allowEffectFields is false',
      code: component(
        `private readonly cleanup = effect(() => undefined);`,
        `template: ''`,
        'Component, effect'
      ),
      options: [{ allowEffectFields: false }],
      errors: [{ messageId: 'unusedField', data: { name: 'cleanup' } }]
    },
    {
      name: 'reports an unread same-named non-Angular effect field when allowEffectFields is true',
      code: `import { Component } from '@angular/core';
        function effect(callback: () => void): unknown { callback(); return {}; }
        @Component({ template: '' }) class TestComponent {
          private readonly cleanup = effect(() => undefined);
        }`,
      options: [{ allowEffectFields: true }],
      errors: [{ messageId: 'unusedField', data: { name: 'cleanup' } }]
    },
    {
      name: 'reports an unread Angular effect field shadowed by an enclosing parameter when allowEffectFields is true',
      code: `import { Component, effect } from '@angular/core';
        function createComponent(effect: unknown) {
          @Component({ template: '' }) class TestComponent {
            private readonly cleanup = effect(() => undefined);
          }
        }`,
      options: [{ allowEffectFields: true }],
      errors: [{ messageId: 'unusedField', data: { name: 'cleanup' } }]
    },
    {
      name: 'reports manual-cleanup Angular effect fields when enabled',
      code: component(
        `private readonly titleEffect = effect(() => undefined, { manualCleanup: true });`,
        `template: ''`,
        'Component, effect'
      ),
      options: [{ allowEffectFields: true }],
      errors: [{ messageId: 'unusedField', data: { name: 'titleEffect' } }]
    },
    {
      name: 'reports effect fields when variable options may require manual cleanup',
      code: `import { Component, effect } from '@angular/core';
        const effectOptions = { manualCleanup: true };
        @Component({ template: '' }) class TestComponent {
          private readonly titleEffect = effect(() => undefined, effectOptions);
        }`,
      options: [{ allowEffectFields: true }],
      errors: [{ messageId: 'unusedField', data: { name: 'titleEffect' } }]
    },
    {
      name: 'reports effect fields when inline options have an unknown spread',
      code: `import { Component, effect } from '@angular/core';
        const effectOptions = { manualCleanup: true };
        @Component({ template: '' }) class TestComponent {
          private readonly titleEffect = effect(() => undefined, { ...effectOptions });
        }`,
      options: [{ allowEffectFields: true }],
      errors: [{ messageId: 'unusedField', data: { name: 'titleEffect' } }]
    },
    {
      name: 'reports effect fields when inline options have an unknown computed property',
      code: `import { Component, effect } from '@angular/core';
        const cleanupOption = 'manualCleanup';
        @Component({ template: '' }) class TestComponent {
          private readonly titleEffect = effect(() => undefined, { [cleanupOption]: true });
        }`,
      options: [{ allowEffectFields: true }],
      errors: [{ messageId: 'unusedField', data: { name: 'titleEffect' } }]
    },
    {
      name: 'reports effect fields with a string-keyed manual cleanup option',
      code: component(
        `private readonly titleEffect = effect(() => undefined, { 'manualCleanup': true });`,
        `template: ''`,
        'Component, effect'
      ),
      options: [{ allowEffectFields: true }],
      errors: [{ messageId: 'unusedField', data: { name: 'titleEffect' } }]
    },
    {
      name: 'reports unread subscription fields when allowEffectFields is enabled',
      code: component(
        `private readonly subscription = ({ subscribe: () => undefined }).subscribe();`
      ),
      options: [{ allowEffectFields: true }],
      errors: [{ messageId: 'unusedField', data: { name: 'subscription' } }]
    },
    {
      name: 'reports unread fields whose local type is named ComponentRef',
      code: `import { Component } from '@angular/core';
        interface ComponentRef {}
        @Component({ template: '' }) class TestComponent {
          private readonly ref!: ComponentRef;
        }`,
      errors: [{ messageId: 'unusedField', data: { name: 'ref' } }]
    }
  ]
});
