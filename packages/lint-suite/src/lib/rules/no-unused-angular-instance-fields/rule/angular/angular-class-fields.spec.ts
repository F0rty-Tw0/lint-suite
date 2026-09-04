import assert from 'node:assert/strict';
import { test } from 'vitest';

import type { RuleTester } from 'eslint';
import { TSESTree } from '@typescript-eslint/utils';

import { reportUnusedMembers } from './angular-class-fields.js';
import { addAngularImport } from './angular-imports.js';
import { component } from '../../utils/component-source.spec.util.js';
import { parseSource } from '../../utils/parsed-source.spec.util.js';
import {
  rule,
  ruleName,
  ruleTester
} from '../../utils/rule-under-test.spec.util.js';
import { unusedFieldError } from '../../utils/unused-member-error.spec.util.js';

const isImportDeclaration = (
  node: TSESTree.ProgramStatement
): node is TSESTree.ImportDeclaration => {
  return node.type === TSESTree.AST_NODE_TYPES.ImportDeclaration;
};

const isClassDeclaration = (
  node: TSESTree.ProgramStatement
): node is TSESTree.ClassDeclarationWithName => {
  return node.type === TSESTree.AST_NODE_TYPES.ClassDeclaration;
};

test('resolves inline template reads before project member lookup', () => {
  const code = component(
    `private readonly fromTemplate = 'used';`,
    `template: '{{ fromTemplate }}'`
  );
  const { ast, sourceCode } = parseSource(code);
  const angularImport = ast.body.find(isImportDeclaration);
  const componentClass = ast.body.find(isClassDeclaration);

  assert.ok(angularImport);
  assert.ok(componentClass);

  const imports = new Map<string, string | null>();
  const entry = { node: componentClass, reads: new Set<string>() };
  const dynamicClasses = new Set<typeof entry>();
  let reports = 0;
  let projectLookupCalls = 0;

  const report = (): void => {
    reports += 1;
  };
  const projectMemberUsed = (): boolean => {
    projectLookupCalls += 1;

    return false;
  };
  const context = { filename: 'component.ts', report, sourceCode };

  addAngularImport(angularImport, imports);
  reportUnusedMembers(
    context,
    imports,
    [entry],
    dynamicClasses,
    false,
    projectMemberUsed
  );

  assert.equal(reports, 0);
  assert.equal(projectLookupCalls, 0);
});

const skipsDynamicallyIndexedClasses: RuleTester.ValidTestCase = {
  name: 'skips classes the read visitor marked as dynamically indexed',
  code: component(
    `private value = ''; public read(key: string): unknown { return this[key]; }`
  )
};

const reportsBothDemonstrationFields: RuleTester.InvalidTestCase = {
  name: 'reports both demonstration component fields',
  code: `import { Component, inject } from '@angular/core'; class IconService {}
        @Component({ template: '' }) class AboutComponent {
          private readonly test = inject(IconService); public test2 = 'test2';
        }`,
  errors: [unusedFieldError('test'), unusedFieldError('test2')]
};

const reportsEveryAngularClassInFile: RuleTester.InvalidTestCase = {
  name: 'reports members of every Angular class in one file',
  code: `import { Component, Directive } from '@angular/core';
        @Component({ template: '' }) class FirstComponent { private first = ''; }
        @Directive({ selector: '[second]' }) class SecondDirective { private second = ''; }`,
  errors: [unusedFieldError('first'), unusedFieldError('second')]
};

const valid: RuleTester.ValidTestCase[] = [skipsDynamicallyIndexedClasses];

const invalid: RuleTester.InvalidTestCase[] = [
  reportsBothDemonstrationFields,
  reportsEveryAngularClassInFile
];

ruleTester.run(ruleName, rule, { valid, invalid });
