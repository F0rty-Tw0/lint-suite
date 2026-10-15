import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ESLint } from 'eslint';
import { afterAll, describe, expect, it } from 'vitest';

import { reportedRuleIds } from './test/utils/reported-rule-ids.spec.util.ts';
import { typescriptImports } from './typescript-imports.ts';
import { typescriptRecommended } from './typescript-recommended.ts';

const RULE_ID = 'import-x/no-useless-path-segments';

const workspace = mkdtempSync(join(tmpdir(), 'lint-suite-imports-'));

mkdirSync(join(workspace, 'nested'));
writeFileSync(join(workspace, 'index.ts'), 'export const value = 1;\n');

const eslint = new ESLint({
  cwd: workspace,
  overrideConfigFile: true,
  overrideConfig: [...typescriptRecommended, ...typescriptImports]
});

const uselessPathIds = async (code: string): Promise<(string | null)[]> => {
  const filePath = join(workspace, 'nested', 'a.ts');
  const ruleIds = await reportedRuleIds(eslint, code, filePath);

  return ruleIds.filter((ruleId) => ruleId === RULE_ID);
};

afterAll(() => {
  rmSync(workspace, { force: true, recursive: true });
});

describe('FEATURE: typescript imports preset', () => {
  describe('GIVEN a file one folder below an index.ts', () => {
    it('WHEN it imports ../index.ts THEN no-useless-path-segments reports nothing', async () => {
      const ruleIds = await uselessPathIds(
        "export { value } from '../index.ts';\n"
      );

      expect(ruleIds).toEqual([]);
    });
    it('WHEN it imports ../nested/../index.ts THEN no-useless-path-segments is reported', async () => {
      const ruleIds = await uselessPathIds(
        "export { value } from '../nested/../index.ts';\n"
      );

      expect(ruleIds).toEqual([RULE_ID]);
    });
  });
});
