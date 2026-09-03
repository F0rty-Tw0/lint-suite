import assert from 'node:assert/strict';
import { readFileSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { afterAll, test } from 'vitest';

import { Linter } from 'eslint';

import {
  copyFixtureProject,
  fixtureCase,
  fixtureDirectory
} from '../utils/fixture-project.spec.util.js';
import {
  lintConfig,
  projectRuleTester,
  rule,
  ruleName
} from '../utils/rule-under-test.spec.util.js';

const project = copyFixtureProject('cache-project');

afterAll(project.dispose);

const cacheComponent = fixtureCase(
  project.directory,
  'project-template-cache.component.ts'
);
const cacheTemplateFilename = project.file(
  'project-template-cache.component.html'
);
const cacheProjectConfig = lintConfig({
  analysis: 'project',
  directory: project.directory
});

const brokenProjectDirectory = fixtureDirectory('broken-project');
const brokenProjectTester = projectRuleTester(brokenProjectDirectory);

test('invalidates project template usage after external template changes', () => {
  const linter = new Linter({ cwd: project.directory });
  const originalTemplate = readFileSync(cacheTemplateFilename, 'utf8');
  const originalStats = statSync(cacheTemplateFilename);
  const changedTime = new Date(
    Math.max(Date.now(), originalStats.mtimeMs) + 2_000
  );

  try {
    assert.deepEqual(
      linter.verify(cacheComponent.code, cacheProjectConfig, {
        filename: cacheComponent.filename
      }),
      []
    );

    writeFileSync(cacheTemplateFilename, '<p></p>');
    utimesSync(cacheTemplateFilename, changedTime, changedTime);

    assert.deepEqual(
      linter
        .verify(cacheComponent.code, cacheProjectConfig, {
          filename: cacheComponent.filename
        })
        .map(({ message, messageId, ruleId }) => ({
          message,
          messageId,
          ruleId
        })),
      [
        {
          message:
            "Angular instance field 'readFromTemplateCache' is never read.",
          messageId: 'unusedField',
          ruleId: ruleName
        }
      ]
    );
  } finally {
    writeFileSync(cacheTemplateFilename, originalTemplate);
    utimesSync(cacheTemplateFilename, originalStats.atime, originalStats.mtime);
  }
});

brokenProjectTester.run(ruleName, rule, {
  valid: [],
  invalid: [
    {
      name: 'falls back to name matching when a template cannot be parsed',
      ...fixtureCase(
        brokenProjectDirectory,
        'project-index-failure.component.ts'
      ),
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
