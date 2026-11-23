import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

async function mobileTab(page: Page, name: string) {
  const tab = page.locator('.mobile-tabs').getByRole('button', { name, exact: true });
  if (await tab.isVisible()) await tab.click();
}

test('同一算法推进保留自测答案，换算法后清空', async ({ page }) => {
  await page.goto('/#/algo/sort/select-sort');
  await mobileTab(page, '讲解');
  await page.locator('.quiz-option').first().click();
  await expect(page.locator('.quiz-explain')).toHaveCount(1);
  await mobileTab(page, '动画');
  await page.locator('.col-center > .controls-panel').getByTitle('下一步 (→)').click();
  await mobileTab(page, '讲解');
  await expect(page.locator('.quiz-explain')).toHaveCount(1);
  await mobileTab(page, '目录');
  await page.locator('.catalog').getByRole('button', { name: '冒泡排序', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('冒泡排序');
  await mobileTab(page, '讲解');
  await expect(page.locator('.quiz-option.right, .quiz-option.wrong')).toHaveCount(0);
  await expect(page.locator('.quiz-explain')).toHaveCount(0);
});

test('代码行通过 Enter 和空格跳转，并暂停播放', async ({ page }) => {
  await page.goto('/#/algo/sort/select-sort');
  await mobileTab(page, '代码');
  const line = page.locator('.code-line[role="button"]').filter({ hasText: 'if (A[j] < A[minPos])' });
  await expect(line).toHaveAttribute('tabindex', '0');
  await line.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.code-toolbar')).toContainText('cmp');
  await expect(line).toHaveClass(/active/);
  await mobileTab(page, '动画');
  const controls = page.locator('.col-center > .controls-panel');
  await controls.getByTitle('跳到开头 (Home)').click();
  await controls.getByRole('button', { name: '播放', exact: true }).click();
  await mobileTab(page, '代码');
  await line.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.code-toolbar')).toContainText('cmp');
  await expect(line).toHaveClass(/active/);
  await mobileTab(page, '动画');
  await expect(controls.getByRole('button', { name: '播放', exact: true })).toBeVisible();
});

test('单文件版从 file:// 离线打开，并访问全部懒加载页面', async ({ page, context }) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (/^https?:/.test(request.url())) externalRequests.push(request.url());
  });
  await context.setOffline(true);
  await page.goto(pathToFileURL(resolve('dist/standalone.html')).href);
  await expect(page.locator('h1')).toHaveText('算法地图');
  await page.locator('.topnav').getByRole('button', { name: '可视化', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('简单选择排序');
  await expect(page.locator('.stage svg').first()).toBeVisible();
  const controls = page.locator('.col-center > .controls-panel');
  await controls.getByTitle('跳到结尾 (End)').click();
  await expect(controls.locator('.phase-tag')).toHaveText('完成');
  await page.locator('.topnav').getByRole('button', { name: '算法对比', exact: true }).click();
  await expect(page.locator('.stage')).toHaveCount(2);
  await page.locator('.topnav').getByRole('button', { name: '练习中心', exact: true }).click();
  await expect(page.locator('.lab-options button').first()).toBeVisible();
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});
