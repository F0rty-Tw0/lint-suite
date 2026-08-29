import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, test } from 'node:test';

import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { angular } from '../../angular.js';

const angularPlugin = angular
  .map((config) => config.plugins?.['lint-suite-angular'])
  .find(Boolean);
const rule = angularPlugin?.rules?.['no-unused-instance-fields'];

assert.ok(
  rule,
  'angular preset must register lint-suite-angular/no-unused-instance-fields'
);

RuleTester.describe = describe;
RuleTester.it = test;
RuleTester.itOnly = test.only;

const parser = tseslint.parser;
const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', parser, sourceType: 'module' }
});
const externalTemplateDirectory = mkdtempSync(
  join(tmpdir(), 'unused-angular-fields-')
);
const externalComponentFilename = join(
  externalTemplateDirectory,
  'external.component.ts'
);

writeFileSync(
  join(externalTemplateDirectory, 'external.component.html'),
  '{{ fromTemplate }}'
);
after(() =>
  rmSync(externalTemplateDirectory, { force: true, recursive: true })
);

function component(
  body: string,
  metadata = "template: ''",
  imports = 'Component',
  decorator = 'Component',
  classDeclaration = 'class TestComponent'
) {
  return `import { ${imports} } from '@angular/core'; @${decorator}({ ${metadata} }) ${classDeclaration} { ${body} }`;
}

const externalTemplateCase = {
  name: 'accepts a field read by an external template',
  filename: externalComponentFilename,
  code: component(
    `protected fromTemplate = 'used';`,
    `templateUrl: './external.component.html'`
  )
};

ruleTester.run('lint-suite-angular/no-unused-instance-fields', rule, {
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
      name: 'accepts a field read by an inline template',
      code: component(
        `protected fromTemplate = 'used';`,
        `template: '{{ fromTemplate }}'`
      )
    },
    externalTemplateCase,
    {
      name: 'accepts fields read by host property and event expressions',
      code: component(
        `protected title = 'used'; protected callback = () => undefined;`,
        `template: '', host: { '[attr.title]': 'title', '(click)': 'callback()' }`
      )
    },
    {
      name: 'accepts this.$event in a host action as a component field read',
      code: component(
        `private $event = undefined;`,
        `template: '', host: { '(click)': 'this.$event' }`
      )
    },
    {
      name: 'accepts a host action whose nested write reads the component receiver',
      code: component(
        `protected state = { value: false };`,
        `template: '', host: { '(click)': 'state.value = true' }`
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
      name: 'accepts a method read by an inline template',
      code: component(
        `private fromTemplate(): string { return 'used'; }`,
        `template: '{{ fromTemplate() }}'`
      )
    },
    {
      name: 'accepts a method read by a host expression',
      code: component(
        `protected onClick(): void {}`,
        `template: '', host: { '(click)': 'onClick()' }`
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
      name: 'exempts Angular signal APIs and decorator-managed fields',
      code: component(
        `@Input() public decoratedInput = ''; @ViewChild('content') private content: unknown;
        public signalInput = inputSignal(''); public signalOutput = output<void>(); public signalModel = model(false);`,
        "template: ''",
        'Component, Input, ViewChild, input as inputSignal, model, output'
      )
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
      name: 'does not count a host action write as a component field read',
      code: component(
        `private value = false;`,
        `template: '', host: { '(click)': 'value = true' }`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'value' } }]
    },
    {
      name: 'reports only a field unread by both host and template',
      code: component(
        `private hostRead = ''; private templateRead = ''; private unused = '';`,
        `template: '{{ templateRead }}', host: { '[attr.title]': 'hostRead' }`
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'unused' } }]
    },
    {
      name: 'reports an unused field in a namespace-imported component',
      code: `import * as ng from '@angular/core'; @ng.Component({ template: '' })
        class TestComponent { private unused = ''; }`,
      errors: [{ messageId: 'unusedField', data: { name: 'unused' } }]
    },
    {
      name: 'does not count an Angular template local as a component field read',
      code: component(
        `private item = ''; protected items = input<string[]>([]);`,
        "template: '@for (item of items; track item) { {{ item }} }'",
        'Component, input'
      ),
      errors: [{ messageId: 'unusedField', data: { name: 'item' } }]
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
      name: 'does not count an Angular host action event local as a component field read',
      code: component(
        `private $event = undefined;`,
        `template: '', host: { '(click)': '$event.stopPropagation()' }`
      ),
      errors: [{ messageId: 'unusedField', data: { name: '$event' } }]
    }
  ]
});
