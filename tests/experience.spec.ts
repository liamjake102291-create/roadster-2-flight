import { expect, test } from '@playwright/test';

test('desktop flight, reversible timeline, assembly detail and camera modes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('video, iframe')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'ROADSTER 2' })).toBeVisible();
  await page.getByRole('button', { name: '播放', exact: true }).click();
  await expect.poll(async () => Number(await page.getByRole('slider', { name: '飞行进度' }).inputValue())).toBeGreaterThan(0);
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  await page.getByRole('button', { name: '爬坡', exact: true }).click();
  await expect(page.getByRole('heading', { name: '坡顶停驻' })).toBeVisible();
  await page.getByRole('button', { name: '起飞', exact: true }).click();
  await expect(page.getByRole('heading', { name: '离轨翻滚' })).toBeVisible();
  await page.getByRole('button', { name: '检视', exact: true }).click();
  await expect(page.locator('.assembly-options button')).toHaveCount(27);
  await page.getByRole('button', { name: /Structural battery/ }).click();
  await expect(page.locator('.detail-panel h3')).toHaveText('结构电池包');
  await expect(page.getByRole('button', { name: /Structural battery/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '透视', exact: true }).click();
  await expect(page.locator('.canvas-shell')).toHaveAttribute('data-mode', 'xray');
  await page.getByRole('button', { name: '自由观察', exact: true }).click();
  await page.mouse.move(760, 360);
  await page.mouse.down();
  await page.mouse.move(870, 400, { steps: 4 });
  await page.mouse.up();
  await page.getByRole('button', { name: '外观', exact: true }).click();
  await page.getByRole('button', { name: '复装', exact: true }).click();
  await expect(page.locator('.chapter-status')).toContainText('07');
  await page.getByRole('button', { name: '降落', exact: true }).click();
  await expect(page.getByRole('heading', { name: '贴地制动' })).toBeVisible();
  const range = page.getByRole('slider', { name: '飞行进度' });
  await range.focus();
  await range.press('End');
  await expect(page.getByRole('heading', { name: '演示结束' })).toBeVisible();
  await range.press('Home');
  await expect(page.getByRole('heading', { name: 'ROADSTER 2' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('mobile flight and assembly selector fit the viewport', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: '检视', exact: true }).click();
  await page.getByLabel('当前总成').selectOption('chassis');
  await expect(page.locator('.detail-panel h3')).toHaveText('碳纤维底盘');
  await expect(page.getByLabel('当前总成').locator('option')).toHaveCount(27);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

