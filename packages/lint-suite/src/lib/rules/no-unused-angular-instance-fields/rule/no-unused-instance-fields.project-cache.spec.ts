import assert from 'node:assert/strict';
import {
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
  writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import { after, test } from 'node:test';

import { Linter } from 'eslint';

import { createProjectDirectory } from './no-unused-instance-fields.project-fixture.js';
import {
  parser,
  rule,
  ruleName
} from './no-unused-instance-fields.spec-support.js';

const cacheProjectDirectory = createProjectDirectory(
  'unused-angular-fields-cache-project-'
);
const cacheProjectComponentFilename = join(
  cacheProjectDirectory,
  'project-template-cache.component.ts'
);
const cacheProjectTemplateFilename = join(
  cacheProjectDirectory,
  'project-template-cache.component.html'
);
const cacheProjectComponentCode = `
  import { Component } from '@angular/core';

  @Component({ templateUrl: './project-template-cache.component.html' })
  export class ProjectTemplateCacheComponent {
    readonly readFromTemplateCache = 'used';
  }
`;

writeFileSync(cacheProjectComponentFilename, cacheProjectComponentCode);
writeFileSync(cacheProjectTemplateFilename, '{{ readFromTemplateCache }}');
after(() => rmSync(cacheProjectDirectory, { force: true, recursive: true }));

const cacheProjectConfig: Linter.Config = {
  files: ['**/*.ts'],
  languageOptions: {
    ecmaVersion: 'latest',
    parser,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: cacheProjectDirectory
    },
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
};

test('invalidates project template usage after external template changes', () => {
  const linter = new Linter({ cwd: cacheProjectDirectory });
  const originalTemplate = readFileSync(cacheProjectTemplateFilename, 'utf8');
  const originalStats = statSync(cacheProjectTemplateFilename);
  const changedTime = new Date(
    Math.max(Date.now(), originalStats.mtimeMs) + 2_000
  );

  try {
    assert.deepEqual(
      linter.verify(cacheProjectComponentCode, cacheProjectConfig, {
        filename: cacheProjectComponentFilename
      }),
      []
    );

    writeFileSync(cacheProjectTemplateFilename, '<p></p>');
    utimesSync(cacheProjectTemplateFilename, changedTime, changedTime);

    assert.deepEqual(
      linter
        .verify(cacheProjectComponentCode, cacheProjectConfig, {
          filename: cacheProjectComponentFilename
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
    writeFileSync(cacheProjectTemplateFilename, originalTemplate);
    utimesSync(
      cacheProjectTemplateFilename,
      originalStats.atime,
      originalStats.mtime
    );
  }
});
