import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { json } from './json.ts';
import { reportedRuleIds } from './test/utils/reported-rule-ids.spec.util.ts';

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: json
});

const commentedSource = `{
  // comment
  "compilerOptions": { "strict": true, },
}
`;

describe('FEATURE: json preset', () => {
  describe('GIVEN a source with a comment and trailing commas', () => {
    it.each([
      'tsconfig.json',
      'apps/web/tsconfig.app.json',
      'jsconfig.json',
      '.vscode/settings.json',
      '.devcontainer/devcontainer.json',
      '.devcontainer/node/devcontainer.json',
      '.devcontainer.json',
      'angular.json',
      '.oxlintrc.json'
    ])('WHEN %s is linted THEN nothing is reported', async (filePath) => {
      const ruleIds = await reportedRuleIds(eslint, commentedSource, filePath);

      expect(ruleIds).toEqual([]);
    });
    it('WHEN package.json is linted THEN a parse error is reported', async () => {
      const ruleIds = await reportedRuleIds(
        eslint,
        commentedSource,
        'package.json'
      );

      expect(ruleIds).toEqual([null]);
    });
  });
  describe('GIVEN a source with duplicate keys', () => {
    it('WHEN tsconfig.json is linted THEN json/no-duplicate-keys is reported', async () => {
      const source = '{ "a": 1, "a": 2 }\n';

      const ruleIds = await reportedRuleIds(eslint, source, 'tsconfig.json');

      expect(ruleIds).toEqual(['json/no-duplicate-keys']);
    });
  });
});
