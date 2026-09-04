import type { RuleTester } from 'eslint';

import { component } from '../../utils/component-source.spec.util.js';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.js';
import {
  unusedFieldError,
  unusedMethodError
} from '../../utils/unused-member-error.spec.util.js';

const ignoresExportedDirectiveMethods: RuleTester.ValidTestCase = {
  name: 'conservatively ignores externally exposed directive methods',
  code: component(
    `public externallyReadable(): void {}`,
    `selector: '[example]', exportAs: 'example'`,
    'Directive',
    'Directive'
  )
};

const exemptsNonConcreteMethodKinds: RuleTester.ValidTestCase = {
  name: 'exempts lifecycle and non-concrete method kinds',
  code: `import { Component, Input } from '@angular/core';
        @Component({ template: '' }) class TestComponent {
          constructor() {} get value(): string { return ''; } set value(next: string) {}
          static shared(): void {} override inherited(): void {} @Input() decorated(): void {}
          ['computed'](): void {} ngOnChanges(): void {} ngOnInit(): void {} ngDoCheck(): void {}
          ngAfterContentInit(): void {} ngAfterContentChecked(): void {} ngAfterViewInit(): void {}
          ngAfterViewChecked(): void {} ngOnDestroy(): void {}
        }
        @Component({ template: '' }) abstract class AbstractComponent {
          abstract pending(): void;
        }
        @Component({ template: '' }) declare class DeclaredComponent {
          declared(): void;
        }`
};

const exemptsNonConcreteFields: RuleTester.ValidTestCase = {
  name: 'exempts static and non-concrete fields',
  code: `
        import { Component } from '@angular/core';
        class Base { public inherited = ''; }
        @Component({ template: '' }) abstract class TestComponent extends Base {
          public static shared = ''; public abstract pending: string;
          public declare supplied: string; public override inherited = '';
        }
      `
};

const ignoresExportedDirectiveFields: RuleTester.ValidTestCase = {
  name: 'conservatively ignores externally exposed directive fields',
  code: `import { Directive } from '@angular/core'; @Directive({ selector: '[example]', exportAs: 'example' })
        class TestDirective { public externallyReadable = 'used'; }`
};

const ignoresAbstractNonPrivateMembers: RuleTester.ValidTestCase = {
  name: 'conservatively ignores non-private members of abstract components',
  code: component(
    `protected forSubclass = 'used elsewhere'; helper(): void {}`,
    "template: ''",
    'Component',
    'Component',
    'abstract class BaseComponent'
  )
};

const exemptsImplementedFormsMethods: RuleTester.ValidTestCase = {
  name: 'exempts Angular forms interface methods declared via implements',
  code: component(
    `writeValue(value: unknown): void {}
         registerOnChange(fn: unknown): void {}
         registerOnTouched(fn: unknown): void {}
         setDisabledState(disabled: boolean): void {}`,
    "template: ''",
    'Component',
    'Component',
    'class TestComponent implements ControlValueAccessor'
  )
};

const reportsUnreadPublicComponentMethod: RuleTester.InvalidTestCase = {
  name: 'reports an unread public component method',
  code: component(`public unusedMethod(): void {}`),
  errors: [unusedMethodError('unusedMethod')]
};

const reportsPrivateDirectiveField: RuleTester.InvalidTestCase = {
  name: 'reports a private unused directive field',
  code: `import { Directive } from '@angular/core'; @Directive({ selector: '[example]' })
        class TestDirective { private internalOnly = 'unused'; }`,
  errors: [unusedFieldError('internalOnly')]
};

const reportsPrivateDirectiveMethod: RuleTester.InvalidTestCase = {
  name: 'reports a private unused directive method',
  code: component(
    `private internalOnly(): void {}`,
    `selector: '[example]'`,
    'Directive',
    'Directive'
  ),
  errors: [unusedMethodError('internalOnly')]
};

const reportsAbstractPrivateMembers: RuleTester.InvalidTestCase = {
  name: 'reports private unused members of abstract components',
  code: component(
    `private internal = 'unused'; private helper(): void {}`,
    "template: ''",
    'Component',
    'Component',
    'abstract class BaseComponent'
  ),
  errors: [unusedFieldError('internal'), unusedMethodError('helper')]
};

const reportsValidateWithoutFormsInterface: RuleTester.InvalidTestCase = {
  name: 'reports an unread validate method when no forms interface is implemented',
  code: component(`validate(): null { return null; }`),
  errors: [unusedMethodError('validate')]
};

const valid: RuleTester.ValidTestCase[] = [
  ignoresExportedDirectiveMethods,
  exemptsNonConcreteMethodKinds,
  exemptsNonConcreteFields,
  ignoresExportedDirectiveFields,
  ignoresAbstractNonPrivateMembers,
  exemptsImplementedFormsMethods
];

const invalid: RuleTester.InvalidTestCase[] = [
  reportsUnreadPublicComponentMethod,
  reportsPrivateDirectiveField,
  reportsPrivateDirectiveMethod,
  reportsAbstractPrivateMembers,
  reportsValidateWithoutFormsInterface
];

ruleTester.run(ruleName, rule, { valid, invalid });
