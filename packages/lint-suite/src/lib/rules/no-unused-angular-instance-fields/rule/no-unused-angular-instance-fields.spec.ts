import assert from 'node:assert/strict';
import { test } from 'vitest';

import { Linter } from 'eslint';

import { component } from '../utils/component-source.spec.util.js';
import {
  fixtureCase,
  fixtureDirectory
} from '../utils/fixture-project.spec.util.js';
import {
  lintConfig,
  projectRuleTester,
  rule,
  ruleName
} from '../utils/rule-under-test.spec.util.js';

const projectDirectory = fixtureDirectory('project-usage');
const projectTester = projectRuleTester(projectDirectory);

test('requires parser services for project analysis', () => {
  const linter = new Linter();

  assert.throws(
    () =>
      linter.verify(
        component(`private readonly unread = 'unused';`),
        lintConfig({ analysis: 'project' }),
        { filename: 'component.ts' }
      ),
    /parser services/i
  );
});

projectTester.run(ruleName, rule, {
  valid: [
    {
      name: 'excludes spec files from project-mode reports',
      ...fixtureCase(projectDirectory, 'project-excluded.spec.ts'),
      options: [{ analysis: 'project' }]
    }
  ],
  invalid: []
});
