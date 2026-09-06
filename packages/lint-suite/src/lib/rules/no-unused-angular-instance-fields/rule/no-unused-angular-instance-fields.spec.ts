import assert from 'node:assert/strict';

import { Linter } from 'eslint';
import type { RuleTester } from 'eslint';
import { test } from 'vitest';

import { projectRuleTester } from '../../test/utils/project-rule-tester.spec.util.ts';
import { component } from '../test/utils/component-source.spec.util.ts';
import {
  fixtureCase,
  fixtureDirectory
} from '../test/utils/fixture-project.spec.util.ts';
import {
  lintConfig,
  rule,
  ruleName
} from '../test/utils/rule-under-test.spec.util.ts';

const projectDirectory = fixtureDirectory('project-usage');
const projectTester = projectRuleTester(projectDirectory);

test('requires parser services for project analysis', () => {
  const linter = new Linter();
  const lintProjectComponent = (): void => {
    const source = component(`private readonly unread = 'unused';`);
    const config = lintConfig({ analysis: 'project' });

    linter.verify(source, config, { filename: 'component.ts' });
  };

  assert.throws(lintProjectComponent, /parser services/i);
});

const projectAnalysis = { analysis: 'project' };
const options = [projectAnalysis];
const excludedSpecCase = fixtureCase(
  projectDirectory,
  'project-excluded.spec.ts'
);
const excludesSpecFiles: RuleTester.ValidTestCase = {
  name: 'excludes spec files from project-mode reports',
  ...excludedSpecCase,
  options
};
const valid = [excludesSpecFiles];
const invalid: RuleTester.InvalidTestCase[] = [];

projectTester.run(ruleName, rule, { valid, invalid });
