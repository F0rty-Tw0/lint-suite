import { join } from 'node:path';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { playwright } from './playwright.ts';
import { reportedRuleIds } from './test/utils/reported-rule-ids.spec.util.ts';

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: playwright
});

const code = `
import { expect, test } from '@playwright/test';

export const name = 'x';

test.describe('suite', () => {
  test.skip();
  test(\`title \${name}\`, async ({ page }) => {
    test.setTimeout(30000);
    await page.click('a', { timeout: 1000 });
  });
  test('returns', async ({ page }) => {
    await expect(page).toHaveTitle('x');

    return;
  });
});
`;

describe('playwright', () => {
  it.each([
    'playwright/no-export',
    'playwright/no-test-return-statement',
    'playwright/no-template-literal-title',
    'playwright/prefer-ending-with-an-expect',
    'playwright/require-annotation-reason',
    'playwright/no-action-timeout',
    'playwright/no-magic-timeouts'
  ])('reports %s', async (ruleId) => {
    const filePath = join(import.meta.dirname, 'x.e2e.js');
    const ruleIds = await reportedRuleIds(eslint, code, filePath);

    expect(ruleIds).toContain(ruleId);
  });
});
