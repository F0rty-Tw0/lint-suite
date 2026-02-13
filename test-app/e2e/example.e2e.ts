import { expect, test } from '@playwright/test';

test.describe('Test App', () => {
  test('has title', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/test-app/i);
  });

  test('displays the heading', async ({ page }) => {
    await page.goto('/');

    const heading = page.locator('h1');

    await expect(heading).toContainText('test-app');
  });

  test('displays the todo list', async ({ page }) => {
    await page.goto('/');

    const todoList = page.locator('app-todo-list');

    await expect(todoList).toBeVisible();
  });

  test('can add a new todo', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('input[placeholder="Add a new todo..."]');
    const addButton = page.locator('button:has-text("Add")');

    await input.fill('New test todo');
    await addButton.click();

    await expect(page.locator('.todo-item')).toContainText('New test todo');
  });
});
