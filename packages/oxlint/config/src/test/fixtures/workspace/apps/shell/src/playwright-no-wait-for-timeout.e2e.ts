import { test } from '@playwright/test';

test('waits', async ({ page }) => {
  await page.waitForTimeout(100);
});
