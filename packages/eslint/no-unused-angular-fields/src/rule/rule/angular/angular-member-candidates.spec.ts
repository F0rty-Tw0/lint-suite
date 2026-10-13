import type { RuleTester } from 'eslint';

import { component } from '../../test/utils/component-source.spec.util.ts';
import {
  rule,
  ruleName,
  ruleTester
} from '../../test/utils/rule-under-test.spec.util.ts';
import {
  unusedFieldError,
  unusedMethodError
} from '../../test/utils/unused-member-error.spec.util.ts';

const ignoresExportedDirectiveMethods: RuleTester.ValidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'conservatively ignores externally exposed directive methods',
  code: component(`public externallyReadable(): void {}`, {
    metadata: `selector: '[example]', exportAs: 'example'`,
    imports: 'Directive',
    decorator: 'Directive'
  })
};

const exemptsNonConcreteMethodKinds: RuleTester.ValidTestCase = {
  options: [{ analysis: 'local' }],
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
  options: [{ analysis: 'local' }],
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
  options: [{ analysis: 'local' }],
  name: 'conservatively ignores externally exposed directive fields',
  code: `import { Directive } from '@angular/core'; @Directive({ selector: '[example]', exportAs: 'example' })
        class TestDirective { public externallyReadable = 'used'; }`
};

const ignoresAbstractNonPrivateMembers: RuleTester.ValidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'conservatively ignores non-private members of abstract components',
  code: component(
    `protected forSubclass = 'used elsewhere'; helper(): void {}`,
    {
      metadata: "template: ''",
      imports: 'Component',
      decorator: 'Component',
      classDeclaration: 'abstract class BaseComponent'
    }
  )
};

const exemptsImplementedFormsMethods: RuleTester.ValidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'exempts Angular forms interface methods declared via implements',
  code: component(
    `writeValue(value: unknown): void {}
         registerOnChange(fn: unknown): void {}
         registerOnTouched(fn: unknown): void {}
         setDisabledState(disabled: boolean): void {}`,
    {
      metadata: "template: ''",
      imports: 'Component',
      decorator: 'Component',
      classDeclaration: 'class TestComponent implements ControlValueAccessor'
    }
  )
};

const exemptsDecoratedInputsWithNgOnChanges: RuleTester.ValidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'exempts unread decorated inputs of a class declaring ngOnChanges',
  code: component(`@Input() name = ''; ngOnChanges(): void {}`, {
    metadata: "template: ''",
    imports: 'Component, Input'
  })
};

const exemptsNonEventEmitterOutput: RuleTester.ValidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'exempts an unread decorated output not initialized with an Angular EventEmitter',
  code: `import { Component, Output } from '@angular/core';
        class EventEmitter {}
        @Component({ template: '' }) class TestComponent {
          @Output() streamed = ({ subscribe: () => undefined });
          @Output() local = new EventEmitter();
          @Output() declared!: unknown;
        }`
};

const exemptsBindingDecoratorMixedWithOthers: RuleTester.ValidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'exempts an unread input that also carries another decorator',
  code: component(`@HostBinding('class.on') @Input() on = false;`, {
    metadata: "template: ''",
    imports: 'Component, HostBinding, Input'
  })
};

const exemptsNonAngularInputDecorator: RuleTester.ValidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'exempts fields decorated with a same-named non-Angular Input',
  code: `import { Component } from '@angular/core';
        const Input = (): PropertyDecorator => () => undefined;
        @Component({ template: '' }) class TestComponent {
          @Input() name = '';
        }`
};

const exemptsDecoratedInputAccessor: RuleTester.ValidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'exempts decorated input setters',
  code: component(`@Input() set name(value: string) {}`, {
    metadata: "template: ''",
    imports: 'Component, Input'
  })
};

const exemptsDecoratedQueryAccessor: RuleTester.ValidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'exempts decorated query setters',
  code: component(`@ViewChild('box') set box(value: unknown) {}`, {
    metadata: "template: ''",
    imports: 'Component, ViewChild'
  })
};

const reportsUnreadDecoratedBindings: RuleTester.InvalidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'reports unread decorated inputs and EventEmitter outputs',
  code: `import * as ng from '@angular/core';
        import { Component, EventEmitter as Emitter, Input as In, Output } from '@angular/core';
        @Component({ template: '' }) class TestComponent {
          @In() name = ''; @ng.Input({ required: true }) id!: string;
          @Output() changed = new Emitter<string>(); @ng.Output() closed = new ng.EventEmitter<void>();
        }`,
  errors: [
    unusedFieldError('name'),
    unusedFieldError('id'),
    unusedFieldError('changed'),
    unusedFieldError('closed')
  ]
};

const reportsUnreadDecoratedQueries: RuleTester.InvalidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'reports unread decorated query fields',
  code: `import * as ng from '@angular/core';
        import { Component, ContentChild, ContentChildren, ViewChild as Child } from '@angular/core';
        @Component({ template: '' }) class TestComponent {
          @Child('a') view: unknown; @ng.ViewChildren('a') views: unknown;
          @ContentChild('b') content: unknown; @ContentChildren('b') contents: unknown;
        }`,
  errors: [
    unusedFieldError('view'),
    unusedFieldError('views'),
    unusedFieldError('content'),
    unusedFieldError('contents')
  ]
};

const reportsDecoratedOutputWithNgOnChanges: RuleTester.InvalidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'reports an unread decorated output of a class declaring ngOnChanges',
  code: component(
    `@Output() changed = new EventEmitter<string>(); ngOnChanges(): void {}`,
    { metadata: "template: ''", imports: 'Component, EventEmitter, Output' }
  ),
  errors: [unusedFieldError('changed')]
};

const reportsUnreadPublicComponentMethod: RuleTester.InvalidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'reports an unread public component method',
  code: component(`public unusedMethod(): void {}`),
  errors: [unusedMethodError('unusedMethod')]
};

const reportsPrivateDirectiveField: RuleTester.InvalidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'reports a private unused directive field',
  code: `import { Directive } from '@angular/core'; @Directive({ selector: '[example]' })
        class TestDirective { private internalOnly = 'unused'; }`,
  errors: [unusedFieldError('internalOnly')]
};

const reportsPrivateDirectiveMethod: RuleTester.InvalidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'reports a private unused directive method',
  code: component(`private internalOnly(): void {}`, {
    metadata: `selector: '[example]'`,
    imports: 'Directive',
    decorator: 'Directive'
  }),
  errors: [unusedMethodError('internalOnly')]
};

const reportsAbstractPrivateMembers: RuleTester.InvalidTestCase = {
  options: [{ analysis: 'local' }],
  name: 'reports private unused members of abstract components',
  code: component(`private internal = 'unused'; private helper(): void {}`, {
    metadata: "template: ''",
    imports: 'Component',
    decorator: 'Component',
    classDeclaration: 'abstract class BaseComponent'
  }),
  errors: [unusedFieldError('internal'), unusedMethodError('helper')]
};

const reportsValidateWithoutFormsInterface: RuleTester.InvalidTestCase = {
  options: [{ analysis: 'local' }],
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
  exemptsImplementedFormsMethods,
  exemptsDecoratedInputsWithNgOnChanges,
  exemptsNonEventEmitterOutput,
  exemptsBindingDecoratorMixedWithOthers,
  exemptsNonAngularInputDecorator,
  exemptsDecoratedInputAccessor,
  exemptsDecoratedQueryAccessor
];

const invalid: RuleTester.InvalidTestCase[] = [
  reportsUnreadPublicComponentMethod,
  reportsPrivateDirectiveField,
  reportsPrivateDirectiveMethod,
  reportsAbstractPrivateMembers,
  reportsValidateWithoutFormsInterface,
  reportsUnreadDecoratedBindings,
  reportsUnreadDecoratedQueries,
  reportsDecoratedOutputWithNgOnChanges
];

ruleTester.run(ruleName, rule, { valid, invalid });
