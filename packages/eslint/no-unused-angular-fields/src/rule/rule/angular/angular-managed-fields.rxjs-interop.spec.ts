import type { RuleTester } from 'eslint';

import { LOCAL_ANALYSIS_OPTIONS_STUB } from '../../test/stubs/local-analysis-options.stub.ts';
import {
  rule,
  ruleName,
  ruleTester
} from '../../test/utils/rule-under-test.spec.util.ts';
import { unusedFieldError } from '../../test/utils/unused-member-error.spec.util.ts';
import type { RuleOptions } from '../common/no-unused-angular-fields.type.ts';

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

const reportsToSignalFieldWithoutOption: RuleTester.InvalidTestCase = {
  options: LOCAL_ANALYSIS_OPTIONS_STUB,
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

const valid: RuleTester.ValidTestCase[] = [
  acceptsUnreadToSignalFieldWhenAllowed,
  allowsAliasedToObservableField,
  allowsNamespaceImportedToSignal
];

const invalid: RuleTester.InvalidTestCase[] = [
  reportsToSignalFieldWithoutOption,
  reportsToSignalFieldWhenDenied,
  reportsLocalToSignalField,
  reportsTakeUntilDestroyedField
];

ruleTester.run(ruleName, rule, { valid, invalid });
