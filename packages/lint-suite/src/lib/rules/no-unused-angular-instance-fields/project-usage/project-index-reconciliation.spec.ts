import assert from 'node:assert/strict';
import { readFileSync, statSync, utimesSync, writeFileSync } from 'node:fs';

import { Linter } from 'eslint';
import { afterAll, test } from 'vitest';

import {
  copyFixtureProject,
  fixtureCase,
  fixtureDirectory
} from '../utils/fixture-project.spec.util.ts';
import {
  lintConfig,
  projectRuleTester,
  rule,
  ruleName
} from '../utils/rule-under-test.spec.util.ts';
import {
  memberError,
  projectInvalidCase
} from './utils/project-analysis-case.spec.util.ts';

type ReportedMessage = Pick<
  Linter.LintMessage,
  'message' | 'messageId' | 'ruleId'
>;

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
const cacheVerifyOptions = { filename: cacheComponent.filename };

const brokenProjectDirectory = fixtureDirectory('broken-project');
const brokenProjectTester = projectRuleTester(brokenProjectDirectory);

const reportedMessageOf = ({
  message,
  messageId,
  ruleId
}: Linter.LintMessage): ReportedMessage => {
  const reported: ReportedMessage = { message, messageId, ruleId };

  return reported;
};

const templateChangeMessage: ReportedMessage = {
  message: "Angular instance field 'readFromTemplateCache' is never read.",
  messageId: 'unusedField',
  ruleId: ruleName
};
const templateChangeMessages = [templateChangeMessage];

test('invalidates project template usage after external template changes', () => {
  const linter = new Linter({ cwd: project.directory });
  const originalTemplate = readFileSync(cacheTemplateFilename, 'utf8');
  const originalStats = statSync(cacheTemplateFilename);
  const changedTime = new Date(
    Math.max(Date.now(), originalStats.mtimeMs) + 2_000
  );

  try {
    const cachedMessages = linter.verify(
      cacheComponent.code,
      cacheProjectConfig,
      cacheVerifyOptions
    );

    assert.deepEqual(cachedMessages, []);

    writeFileSync(cacheTemplateFilename, '<p></p>');
    utimesSync(cacheTemplateFilename, changedTime, changedTime);

    const changedMessages = linter.verify(
      cacheComponent.code,
      cacheProjectConfig,
      cacheVerifyOptions
    );
    const reportedMessages = changedMessages.map(reportedMessageOf);

    assert.deepEqual(reportedMessages, templateChangeMessages);
  } finally {
    writeFileSync(cacheTemplateFilename, originalTemplate);
    utimesSync(cacheTemplateFilename, originalStats.atime, originalStats.mtime);
  }
});

const indexFailureError = memberError('unusedField', 'unreadAfterIndexFailure');
const indexFailureCase = projectInvalidCase(
  'falls back to name matching when a template cannot be parsed',
  brokenProjectDirectory,
  'project-index-failure.component.ts',
  [indexFailureError]
);

const invalid = [indexFailureCase];

brokenProjectTester.run(ruleName, rule, { valid: [], invalid });
