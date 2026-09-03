import assert from 'node:assert/strict';
import { test } from 'vitest';

import { TSESTree } from '@typescript-eslint/utils';
import tseslint from 'typescript-eslint';

import { reportUnusedMembers } from './angular-class-fields.js';
import { addAngularImport } from './angular-imports.js';
import { component } from '../../utils/component-source.spec.util.js';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.js';

test('resolves inline template reads before project member lookup', () => {
  const ast = tseslint.parser.parseForESLint(
    component(
      `private readonly fromTemplate = 'used';`,
      `template: '{{ fromTemplate }}'`
    )
  ).ast as TSESTree.Program;
  const angularImport = ast.body.find(
    (node): node is TSESTree.ImportDeclaration =>
      node.type === TSESTree.AST_NODE_TYPES.ImportDeclaration
  );
  const componentClass = ast.body.find(
    (node) => node.type === TSESTree.AST_NODE_TYPES.ClassDeclaration
  );

  assert.ok(angularImport);
  assert.ok(componentClass);

  const imports = new Map<string, string | null>();
  const entry = { node: componentClass, reads: new Set<string>() };
  let reports = 0;
  let projectLookupCalls = 0;

  addAngularImport(angularImport, imports);
  reportUnusedMembers(
    {
      filename: 'component.ts',
      report: (): void => {
        reports += 1;
      }
    } as unknown as Parameters<typeof reportUnusedMembers>[0],
    imports,
    [entry],
    new Set<typeof entry>(),
    false,
    (): boolean => {
      projectLookupCalls += 1;
      return false;
    }
  );

  assert.equal(reports, 0);
  assert.equal(projectLookupCalls, 0);
});

ruleTester.run(ruleName, rule, {
  valid: [
    {
      name: 'skips classes the read visitor marked as dynamically indexed',
      code: component(
        `private value = ''; public read(key: string): unknown { return this[key]; }`
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
      name: 'reports members of every Angular class in one file',
      code: `import { Component, Directive } from '@angular/core';
        @Component({ template: '' }) class FirstComponent { private first = ''; }
        @Directive({ selector: '[second]' }) class SecondDirective { private second = ''; }`,
      errors: [
        { messageId: 'unusedField', data: { name: 'first' } },
        { messageId: 'unusedField', data: { name: 'second' } }
      ]
    }
  ]
});
