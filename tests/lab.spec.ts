import { test, expect } from '@playwright/test';

test('parts lab renders car explosion and all tesla parts, exits back to car', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

  await page.goto('/#lab', { waitUntil: 'networkidle' });
  await expect(page.locator('.lab-canvas canvas')).toBeVisible();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: 'tests/artifacts/lab-01-car-exploded.png' });

  const parts = [
    { name: 'gas-tank', label: '高压气体储罐' },
    { name: 'nozzle', label: '推进喷嘴' },
    { name: 'fan', label: '涵道风扇' },
    { name: 'battery', label: '电池包' },
  ];
  for (let i = 0; i < parts.length; i += 1) {
    await page.getByRole('button', { name: new RegExp(parts[i].label) }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `tests/artifacts/lab-0${i + 2}-${parts[i].name}.png` });
  }

  await page.locator('.lab-exit').click();
  await expect(page.locator('#experience')).toBeVisible();
  expect(errors).toEqual([]);
});
