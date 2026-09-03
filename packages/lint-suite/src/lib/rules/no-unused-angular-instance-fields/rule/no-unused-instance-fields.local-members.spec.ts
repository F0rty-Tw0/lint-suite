import {
  component,
  rule,
  ruleName,
  ruleTester
} from './no-unused-instance-fields.spec-support.js';

ruleTester.run(ruleName, rule, {
  valid: [
    {
      name: 'ignores fields outside Angular components and directives',
      code: `class Service { private unused = 'unused'; }`
    },
    {
      name: 'accepts a field read by class TypeScript',
      code: component(
        `private value = 'used'; public read(): string { return this.value; }`,
        `template: '{{ read() }}'`
      )
    },
    {
      name: 'accepts a field read through object destructuring from this',
      code: component(
        `private value = 'used'; public read(): string { const { value } = this; return value; }`,
        `template: '{{ read() }}'`
      )
    },
    {
      name: 'accepts a field read through a non-null this receiver',
      code: component(
        `private value = 'used'; public read(): string { return this!.value; }`,
        `template: '{{ read() }}'`
      )
    },
    {
      name: 'accepts a field read through lexical this in an arrow function',
      code: component(
        `private value = ''; public read(): string { const nested = (): string => this.value; return nested(); }`,
        `template: '{{ read() }}'`
      )
    },
    {
      name: 'accepts a method read by TypeScript',
      code: component(
        `private used(): void {} ngOnInit(): void { this.used(); }`
      )
    },
    {
      name: 'conservatively ignores externally exposed directive methods',
      code: component(
        `public externallyReadable(): void {}`,
        `selector: '[example]', exportAs: 'example'`,
        'Directive',
        'Directive'
      )
    },
    {
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
    },
    {
      name: 'exempts static and non-concrete fields',
      code: `
        import { Component } from '@angular/core';
        class Base { public inherited = ''; }
        @Component({ template: '' }) abstract class TestComponent extends Base {
          public static shared = ''; public abstract pending: string;
          public declare supplied: string; public override inherited = '';
        }
      `
    },
    {
      name: 'conservatively ignores externally exposed directive fields',
      code: `import { Directive } from '@angular/core'; @Directive({ selector: '[example]', exportAs: 'example' })
        class TestDirective { public externallyReadable = 'used'; }`
    },
    {
      name: 'conservatively ignores non-private members of abstract components',
      code: component(
        `protected forSubclass = 'used elsewhere'; helper(): void {}`,
        "template: ''",
        'Component',
        'Component',
        'abstract class BaseComponent'
      )
    }
  ],
  invalid: [
    {
      name: 'reports both demonstration component fields',
      code: `import { Component, inject } from '@angular/core'; class IconService {}
        @Component({ template: '' }) class AboutComponent {
          private readonly test = inject(IconService); public test2 = 'test2';
        }`,
      errors: [
        { messageId: 'unusedField', data: { name: 'test' } },
        { messageId: 'unusedField', data: { name: 'test2' } }
      ]
    },
    {
      name: 'reports an unread public component method',
      code: component(`public unusedMethod(): void {}`),
      errors: [{ messageId: 'unusedMethod', data: { name: 'unusedMethod' } }]
    },
    {
      name: 'does not count a TypeScript write as a read',
      code: component(
        `private value = ''; public update(): void { this.value = 'written'; }`,
        `template: '{{ update() }}'`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'value' } }]
    },
    {
      name: 'reports a private unused directive field',
      code: `import { Directive } from '@angular/core'; @Directive({ selector: '[example]' })
        class TestDirective { private internalOnly = 'unused'; }`,
      errors: [{ messageId: 'unusedField', data: { name: 'internalOnly' } }]
    },
    {
      name: 'reports a private unused directive method',
      code: component(
        `private internalOnly(): void {}`,
        `selector: '[example]'`,
        'Directive',
        'Directive'
      ),
      errors: [{ messageId: 'unusedMethod', data: { name: 'internalOnly' } }]
    },
    {
      name: 'does not count a foreign object member read as a component field read',
      code: component(
        `private value = ''; public read(other: { value: string }): string { return other.value; }`,
        `template: '{{ read() }}'`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'value' } }]
    },
    {
      name: 'does not count an object-destructuring assignment as a component field read',
      code: component(
        `private value = ''; public update(source: { value: string }): void { ({ value: this.value } = source); }`,
        `template: '{{ update() }}'`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'value' } }]
    },
    {
      name: 'does not count this inside a nested normal function as a component field read',
      code: component(
        `private value = ''; public read(): string { function nested(): string { return this.value; } return nested(); }`,
        `template: '{{ read() }}'`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'value' } }]
    },
    {
      name: 'reports private unused members of abstract components',
      code: component(
        `private internal = 'unused'; private helper(): void {}`,
        "template: ''",
        'Component',
        'Component',
        'abstract class BaseComponent'
      ),
      errors: [
        { messageId: 'unusedField', data: { name: 'internal' } },
        { messageId: 'unusedMethod', data: { name: 'helper' } }
      ]
    }
  ]
});
