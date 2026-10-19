import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

function observe(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => errors.push(`Failed request: ${new URL(request.url()).pathname}`));
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${new URL(response.url()).pathname}`); });
  page.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:4173/') && !request.url().startsWith('data:')) errors.push('Unexpected external request');
  });
  return errors;
}

test('production subpath: spend Gold, enforce cooldown, fight, win and restart', async ({ page }) => {
  const errors = observe(page);
  await page.goto('./');
  await expect(page.locator('#battlefield canvas')).toBeVisible();
  await expect(page.locator('.slot')).toHaveCount(5);
  await expect(page.locator('#summon')).toBeDisabled();
  await page.getByRole('button', { name: 'Bắt đầu', exact: true }).click();
  await expect(page.locator('#battle-status')).toHaveAttribute('data-phase', 'running');
  await page.locator('#summon').click();
  expect(Number(await page.locator('#gold').textContent())).toBeLessThan(80);
  await expect(page.locator('#allies')).toHaveText('1');
  await expect(page.locator('#summon')).toBeDisabled();
  await expect(page.locator('#cooldown')).toContainText('Hồi chiêu');
  await page.waitForTimeout(500);
  await expect(page.locator('#allies')).toHaveText('1');
  await expect(page.locator('#summon')).toBeDisabled();
  await expect(page.locator('#summon')).toBeEnabled({ timeout: 3_000 });

  const deadline = Date.now() + 40_000;
  while (await page.locator('#battle-status').getAttribute('data-phase') === 'running' && Date.now() < deadline) {
    if (await page.locator('#summon').isEnabled()) await page.locator('#summon').click();
    await page.waitForTimeout(200);
  }
  await expect(page.locator('#battle-status')).toHaveAttribute('data-phase', 'won');
  await expect(page.locator('#enemy-hp')).toHaveText('0 / 90');
  expect(Number(await page.locator('#hits').textContent())).toBeGreaterThan(0);
  await expect(page.locator('#summon')).toBeDisabled();
  await page.getByRole('button', { name: 'Chơi lại', exact: true }).click();
  await expect(page.locator('#battle-status')).toHaveAttribute('data-phase', 'running');
  await expect(page.locator('#player-hp')).toHaveText('80 / 80');
  await expect(page.locator('#enemy-hp')).toHaveText('90 / 90');
  await expect(page.locator('#allies')).toHaveText('0');
  await expect(page.locator('#hits')).toHaveText('0');
  await expect(page.locator('#summon')).toBeEnabled();
  expect(Number(await page.locator('#gold').textContent())).toBeGreaterThanOrEqual(100);
  await page.screenshot({ path: 'test-results/battle-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('scripted enemies can cause defeat; controls still work after mobile resize', async ({ page }) => {
  const errors = observe(page);
  await page.goto('./');
  await page.getByRole('button', { name: 'Bắt đầu', exact: true }).click();
  await expect(page.locator('#battle-status')).toHaveAttribute('data-phase', 'lost', { timeout: 35_000 });
  await expect(page.locator('#player-hp')).toHaveText('0 / 80');
  await expect(page.locator('#summon')).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Chơi lại', exact: true }).click();
  await page.locator('#summon').click();
  await expect(page.locator('#allies')).toHaveText('1');
  const canvas = await page.locator('#battlefield canvas').boundingBox();
  expect(canvas?.width).toBeGreaterThan(300);
  expect(canvas?.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/battle-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});
