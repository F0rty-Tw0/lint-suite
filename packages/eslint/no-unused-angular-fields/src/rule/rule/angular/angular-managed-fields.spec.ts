import type { RuleTester } from 'eslint';

import { LOCAL_ANALYSIS_OPTIONS_STUB } from '../../test/stubs/local-analysis-options.stub.ts';
import { component } from '../../test/utils/component-source.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester
} from '../../test/utils/rule-under-test.spec.util.ts';
import { unusedFieldError } from '../../test/utils/unused-member-error.spec.util.ts';

const exemptsOutputFromObservableWithoutOption: RuleTester.ValidTestCase = {
  options: LOCAL_ANALYSIS_OPTIONS_STUB,
  name: 'exempts an unread outputFromObservable field when allowRxjsInteropFields is omitted',
  code: `import { Component } from '@angular/core';
        import { outputFromObservable } from '@angular/core/rxjs-interop';
        @Component({ template: '' }) class TestComponent {
          readonly changed = outputFromObservable({} as never);
        }`
};

const exemptsSignalInputsWithNgOnChanges: RuleTester.ValidTestCase = {
  options: LOCAL_ANALYSIS_OPTIONS_STUB,
  name: 'exempts unread signal inputs and models of a class declaring ngOnChanges',
  code: `import * as ng from '@angular/core';
        @ng.Component({ template: '' }) class TestComponent {
          readonly name = ng.input(''); readonly id = ng.input.required<string>();
          readonly checked = ng.model(false);
          ngOnChanges(): void {}
        }`
};

const exemptsComponentRefTypedField: RuleTester.ValidTestCase = {
  options: LOCAL_ANALYSIS_OPTIONS_STUB,
  name: 'exempts unread fields typed with an Angular ComponentRef import',
  code: `import { Component } from '@angular/core';
        import type { ComponentRef } from '@angular/core';
        @Component({ template: '' }) class TestComponent {
          private readonly ref!: ComponentRef;
        }`
};

const exemptsComponentRefTypedFieldUnderShadowingValue: RuleTester.ValidTestCase =
  {
    options: LOCAL_ANALYSIS_OPTIONS_STUB,
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

const reportsUnreadSignalBindings: RuleTester.InvalidTestCase = {
  options: LOCAL_ANALYSIS_OPTIONS_STUB,
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

const reportsUnreadSignalQueries: RuleTester.InvalidTestCase = {
  options: LOCAL_ANALYSIS_OPTIONS_STUB,
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

const reportsNamespaceSignalOutputWithNgOnChanges: RuleTester.InvalidTestCase =
  {
    options: LOCAL_ANALYSIS_OPTIONS_STUB,
    name: 'reports an unread namespace-imported signal output of a class declaring ngOnChanges',
    code: `import * as ng from '@angular/core';
        @ng.Component({ template: '' }) class TestComponent {
          readonly changed = ng.output<string>();
          ngOnChanges(): void {}
        }`,
    errors: [unusedFieldError('changed')]
  };

const reportsLocalComponentRefTypedField: RuleTester.InvalidTestCase = {
  options: LOCAL_ANALYSIS_OPTIONS_STUB,
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
  exemptsComponentRefTypedField,
  exemptsComponentRefTypedFieldUnderShadowingValue
];

const invalid: RuleTester.InvalidTestCase[] = [
  reportsUnreadSignalBindings,
  reportsUnreadSignalQueries,
  reportsNamespaceSignalOutputWithNgOnChanges,
  reportsLocalComponentRefTypedField
];

ruleTester.run(ruleName, rule, { valid, invalid });
