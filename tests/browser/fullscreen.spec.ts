import { expect, test, type Page } from '@playwright/test';
import { algorithms } from '../../src/algorithms/registry';

test('全屏请求被拒绝时显示提示', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Denied', 'NotAllowedError'));
  });
  await page.goto('/#/algo/graph/dijkstra');
  await page.getByRole('button', { name: '进入全屏' }).click();
  await expect(page.locator('.stage').getByRole('alert')).toContainText('无法进入全屏');
  await expect(page.getByRole('button', { name: '进入全屏' })).toBeVisible();
  expect(errors).toEqual([]);
});

// 原生全屏会受浏览器／桌面权限限制。独立模拟 API 和同等 CSS，始终执行布局与控件回归；
// 另有原生全屏用例，支持时验证真实进入与退出，不把模拟检查冒充原生检查。
async function mockFullscreen(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => document.querySelector('[data-test-fullscreen]') });
    Element.prototype.requestFullscreen = function () {
      this.setAttribute('data-test-fullscreen', '');
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    };
    document.exitFullscreen = () => {
      document.fullscreenElement?.removeAttribute('data-test-fullscreen');
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    };
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') void document.exitFullscreen(); });
  });
}

async function enter(page: Page) {
  if (await page.locator('style[data-fullscreen-test-style]').count() === 0) {
    const css = await page.evaluate(() => Array.from(document.styleSheets)
      .flatMap((sheet) => Array.from(sheet.cssRules, (rule) => rule.cssText)).join('\n').replaceAll(':fullscreen', '[data-test-fullscreen]'));
    const style = await page.addStyleTag({ content: `${css}\n.stage[data-test-fullscreen] { position:fixed; inset:0; width:100vw; height:100vh; z-index:9999; }` });
    await style.evaluate((element) => element.setAttribute('data-fullscreen-test-style', ''));
  }
  await page.locator('.stage-head').getByRole('button', { name: '进入全屏', exact: true }).click();
  await expect(page.locator('.stage')).toHaveAttribute('data-test-fullscreen', '');
}

async function fits(page: Page) {
  await expect.poll(() => page.evaluate(() => {
    const viewport = document.querySelector('.stage-viewport')!.getBoundingClientRect();
    const errors: string[] = [];
    for (const item of document.querySelectorAll('.stage-content, .stage-canvas svg, .shortest-path-table, .graph-details')) {
      const box = item.getBoundingClientRect();
      if (box.left < viewport.left - 1 || box.right > viewport.right + 1 || box.top < viewport.top - 1 || box.bottom > viewport.bottom + 1) errors.push(item.className.toString());
    }
    const footer = document.querySelector('.stage-fullscreen-controls')!.getBoundingClientRect();
    if (footer.height <= 0 || footer.bottom > innerHeight + 1 || footer.top < viewport.bottom) errors.push('controls');
    return errors;
  })).toEqual([]);
}

async function seek(page: Page, index: number) {
  await page.locator('.stage-fullscreen-controls input.progress').evaluate((element, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(element, String(value));
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, index);
  await expect(page.locator('.stage-fullscreen-controls .step-no')).toContainText(`步骤 ${index + 1} /`);
}

test('模拟全屏：全部演示首步、中间步、末步完整适配', async ({ page }) => {
  test.setTimeout(120_000);
  await mockFullscreen(page);
  for (const algo of algorithms) {
    await page.goto(`/#/algo/${algo.slug}`);
    await expect(page.locator('.col-center > .controls-panel .step-no')).toContainText('步骤 1 /');
    await enter(page);
    const total = algo.generate(algo.defaultInput).length;
    for (const index of [0, Math.floor(total / 2), total - 1]) {
      await seek(page, index);
      await fits(page);
    }
    await page.locator('.stage-head').getByRole('button', { name: '退出全屏', exact: true }).click();
    await expect(page.locator('.stage-fullscreen-controls')).toBeHidden();
    await expect(page.locator('.stage-content')).toHaveCSS('display', 'contents');
  }
});

test('模拟全屏：播放、单步、进度、倍速、调整窗口与退出恢复', async ({ page }) => {
  await mockFullscreen(page);
  await page.goto('/#/algo/graph/topo-sort');
  const toggle = page.locator('.stage-head .fullscreen-button');
  const enterIcon = await toggle.locator('path').getAttribute('d');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.controls button[title*="全屏"]')).toHaveCount(0);
  await enter(page);
  await expect(toggle).toHaveAttribute('aria-label', '退出全屏');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle.locator('path')).not.toHaveAttribute('d', enterIcon!);
  const bar = page.locator('.stage-fullscreen-controls');
  await bar.getByTitle('下一步 (→)').click();
  await expect(bar.locator('.step-no')).toContainText('步骤 2 /');
  await bar.getByTitle('上一步 (←)').click();
  await expect(bar.locator('.step-no')).toContainText('步骤 1 /');
  await bar.getByTitle('播放 / 暂停 (空格)').click();
  await expect(bar.getByTitle('播放 / 暂停 (空格)')).toHaveText('暂停');
  await expect.poll(async () => (await bar.locator('.step-no').innerText()) !== '步骤 1 / 15').toBeTruthy();
  await bar.getByTitle('播放 / 暂停 (空格)').click();
  await expect(bar.getByTitle('播放 / 暂停 (空格)')).toHaveText('播放');
  await bar.getByLabel('播放速度').selectOption('2');
  await expect(bar.getByLabel('播放速度')).toHaveValue('2');
  await seek(page, 5);
  await expect(page.locator('.output-sequence .aux-cell')).toHaveText(['A', 'C']);
  await page.setViewportSize({ width: 900, height: 480 });
  await fits(page);
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-label', '进入全屏');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(toggle.locator('path')).toHaveAttribute('d', enterIcon!);
  await expect(bar).toBeHidden();
  await expect(page.locator('.stage-content')).toHaveCSS('display', 'contents');
  await expect(page.locator('.col-center > .controls-panel .step-no')).toContainText('步骤 6 /');
});

test('原生全屏：浏览器允许时验证进入与退出', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '原生全屏仅在桌面项目检查');
  await page.addInitScript(() => {
    const request = Element.prototype.requestFullscreen;
    Element.prototype.requestFullscreen = function (options) {
      return request.call(this, options).catch((error) => {
        (window as Window & { fullscreenDenied?: string }).fullscreenDenied = String(error);
      });
    };
  });
  await page.goto('/#/algo/graph/dijkstra');
  await page.locator('.stage-head').getByRole('button', { name: '进入全屏', exact: true }).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement) || Boolean((window as Window & { fullscreenDenied?: string }).fullscreenDenied))).toBeTruthy();
  const denied = await page.evaluate(() => (window as Window & { fullscreenDenied?: string }).fullscreenDenied);
  test.skip(Boolean(denied), `当前浏览器不授予原生全屏：${denied}`);
  await fits(page);
  await page.locator('.stage-head').getByRole('button', { name: '退出全屏', exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBeTruthy();
  await expect(page.locator('.stage-fullscreen-controls')).toBeHidden();
});
