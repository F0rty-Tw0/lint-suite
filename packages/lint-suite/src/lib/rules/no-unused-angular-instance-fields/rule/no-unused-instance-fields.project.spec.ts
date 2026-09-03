import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { after, test } from 'node:test';

import { Linter } from 'eslint';
import { TSESTree } from '@typescript-eslint/utils';

import { reportUnusedMembers } from './angular/angular-class-fields.js';
import { addAngularImport } from './angular/angular-imports.js';
import {
  failingProjectFixture,
  projectFixture
} from './no-unused-instance-fields.project-fixture.js';
import {
  component,
  parser,
  rule,
  ruleName
} from './no-unused-instance-fields.spec-support.js';

const project = projectFixture();
const failingProject = failingProjectFixture();

after(() => {
  rmSync(project.directory, { force: true, recursive: true });
  rmSync(failingProject.directory, { force: true, recursive: true });
});

test('resolves inline template reads before project member lookup', () => {
  const ast = parser.parseForESLint(
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

test('requires parser services for project analysis', () => {
  const linter = new Linter();

  assert.throws(
    () =>
      linter.verify(component(`private readonly unread = 'unused';`), {
        languageOptions: {
          ecmaVersion: 'latest',
          parser,
          sourceType: 'module'
        },
        plugins: {
          'lint-suite-angular': {
            rules: { 'no-unused-instance-fields': rule }
          }
        },
        rules: {
          'lint-suite-angular/no-unused-instance-fields': [
            'error',
            { analysis: 'project' }
          ]
        }
      }),
    /parser services/i
  );
});

project.tester.run(ruleName, rule, {
  valid: [
    {
      name: 'accepts a field read by a property access in another project file',
      ...project.property,
      options: [{ analysis: 'project' }]
    },
    {
      name: 'accepts a field read by an element access in another project file',
      ...project.element,
      options: [{ analysis: 'project' }]
    },
    {
      name: 'accepts a field read by destructuring in another project file',
      ...project.destructuring,
      options: [{ analysis: 'project' }]
    },
    {
      name: 'accepts a directive field read by an Angular template in project mode',
      ...project.templateDirective,
      options: [{ analysis: 'project' }]
    },
    {
      name: 'excludes spec files from project-mode reports',
      ...project.spec,
      options: [{ analysis: 'project' }]
    }
  ],
  invalid: [
    {
      name: 'reports unread fields after a successful project analysis',
      ...project.unread,
      options: [{ analysis: 'project' }],
      errors: [{ messageId: 'unusedField', data: { name: 'unreadInProject' } }]
    }
  ]
});

failingProject.tester.run(ruleName, rule, {
  valid: [],
  invalid: [
    {
      name: 'falls back to name matching when a template cannot be parsed',
      ...failingProject.component,
      options: [{ analysis: 'project' }],
      errors: [
        {
          messageId: 'unusedField',
          data: { name: 'unreadAfterIndexFailure' }
        }
      ]
    }
  ]
});
