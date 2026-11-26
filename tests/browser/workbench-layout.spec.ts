import { expect, test } from '@playwright/test';

test('工作台使用桌面宽度、侧栏保持可见，窄屏代码不撑宽页面', async ({ page }, testInfo) => {
  const desktop = testInfo.project.name === 'desktop';
  await page.setViewportSize(desktop ? { width: 1920, height: 960 } : { width: 320, height: 750 });
  await page.goto('/#/algo/array/sparse-triple');
  const input = page.locator('.col-center > .input-panel');
  const stage = page.locator('.col-center > .stage');
  await expect(input).toBeVisible();
  await expect(stage).toBeVisible();
  expect((await input.boundingBox())!.y).toBeLessThan((await stage.boundingBox())!.y);

  if (desktop) {
    const sidebar = page.getByRole('navigation', { name: '课程章节目录' });
    const current = sidebar.locator('[aria-current="page"]');
    await expect(current).toBeInViewport();
    const viewport = page.viewportSize()!;
    const code = (await page.locator('.col-right').boundingBox())!;
    expect((await sidebar.boundingBox())!.x).toBeLessThanOrEqual(24);
    expect(viewport.width - code.x - code.width).toBeLessThanOrEqual(24);
    await page.evaluate(() => window.scrollTo(0, 450));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
    await expect(sidebar.getByRole('searchbox').or(sidebar.getByRole('textbox'))).toBeInViewport();
    await page.setViewportSize({ width: 1100, height: 900 });
    const tabletCode = (await page.locator('.col-right').boundingBox())!;
    const tabletStage = (await stage.boundingBox())!;
    expect(tabletCode.x).toBe(tabletStage.x);
    expect(tabletCode.y).toBeGreaterThan(tabletStage.y + tabletStage.height);
  } else {
    await page.locator('.mobile-tabs').getByRole('button', { name: '代码', exact: true }).click();
    await expect(page.locator('.code-panel')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
});
