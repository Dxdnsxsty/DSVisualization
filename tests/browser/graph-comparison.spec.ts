import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

test('同一张自定义图的 BFS 和 DFS 显示各自顺序并可往返回放', async ({ page }) => {
  await page.goto('/#/compare');
  await page.getByRole('button', { name: 'BFS / DFS', exact: true }).click();
  await page.getByRole('button', { name: '自定义图', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '自定义图' });
  await dialog.getByLabel('顶点', { exact: true }).fill('A B C D X');
  await dialog.getByLabel('起点', { exact: true }).fill('A');
  await dialog.getByLabel('无向边').fill('A B\nA C\nB D');
  await dialog.getByRole('button', { name: '确定', exact: true }).click();

  const [left, right] = [page.locator('.compare-pane').first(), page.locator('.compare-pane').last()];
  await expect(left).toContainText('BFS 待扩展顶点队列');
  await expect(right).toContainText('DFS 递归调用栈');
  const [leftSlider, rightSlider] = [left.getByRole('slider'), right.getByRole('slider')];
  await leftSlider.press('End');
  await rightSlider.press('End');
  await expect(left.locator('.compare-metrics')).toContainText('A → B → C → D');
  await expect(right.locator('.compare-metrics')).toContainText('A → B → D → C');
  const steps = [await leftSlider.inputValue(), await rightSlider.inputValue()];
  await right.getByRole('button', { name: '单独学习', exact: true }).click();
  await expect(page).toHaveURL(/#\/algo\/graph\/dfs\?input=/);
  await page.getByRole('button', { name: '返回对比', exact: true }).click();
  await expect(page).toHaveURL(/#\/compare\/graph\?left=/);
  await expect(leftSlider).toHaveValue(steps[0]);
  await expect(rightSlider).toHaveValue(steps[1]);
});

test('两个对比模式各自保留已应用的数据和两侧步骤', async ({ page }) => {
  await page.goto('/#/compare');
  const sort = page.getByRole('button', { name: '排序对比', exact: true });
  const graph = page.getByRole('button', { name: 'BFS / DFS', exact: true });
  const sliders = page.locator('.compare-pane').getByRole('slider');
  await page.getByLabel('共同输入').fill('8, 3, 1');
  await page.getByRole('button', { name: '应用输入', exact: true }).click();
  await sliders.first().press('ArrowRight');

  await graph.click();
  await page.getByRole('button', { name: '自定义图', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('顶点', { exact: true }).fill('A B C X');
  await dialog.getByLabel('起点', { exact: true }).fill('C');
  await dialog.getByLabel('无向边').fill('C A\nA B');
  await dialog.getByRole('button', { name: '确定', exact: true }).click();
  await sliders.last().press('ArrowRight');
  await sliders.last().press('ArrowRight');
  await sort.click();
  await expect(page.getByLabel('共同输入')).toHaveValue('8, 3, 1');
  await expect(sliders.first()).toHaveValue('1');
  await expect(sliders.last()).toHaveValue('0');
  await expect(page.getByRole('status')).toHaveText('已暂停');
  await graph.click();
  await expect(page.getByText('顶点 A, B, C, X，起点 C，边 C–A, A–B')).toBeVisible();
  await expect(sliders.first()).toHaveValue('0');
  await expect(sliders.last()).toHaveValue('2');
  await expect(page.getByRole('status')).toHaveText('已暂停');
});

for (const offline of [false, true]) {
  test(`对比链接保留两侧位置和输入（${offline ? '离线回放片段' : '网站链接'}）`, async ({ page, context }) => {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('Clipboard blocked')) } });
    });
    const standalone = pathToFileURL(resolve('dist/standalone.html')).href;
    if (offline) await context.setOffline(true);
    await page.goto(offline ? standalone + '#/compare/graph' : '/#/compare');
    const sliders = page.locator('.compare-pane').getByRole('slider');
    if (!offline) {
      await page.getByLabel('共同输入').fill('8, 3, 1');
      await page.getByRole('button', { name: '应用输入', exact: true }).click();
      await page.getByRole('combobox', { name: '右侧', exact: true }).selectOption('sort/merge-sort');
    }
    await sliders.first().press('ArrowRight');
    await sliders.last().press('ArrowRight');
    await sliders.last().press('ArrowRight');
    await page.getByRole('button', { name: '复制对比链接', exact: true }).click();
    const manual = page.getByRole('textbox', { name: '对比链接', exact: true });
    await expect(manual).toBeVisible();
    const link = await manual.inputValue();
    if (offline) expect(link).toMatch(/^#\/compare\/graph\?/);
    else expect(link).toMatch(/^http:\/\/.*#\/compare\?/);

    const opened = await context.newPage();
    await opened.goto(offline ? standalone + link : link);
    const restored = opened.locator('.compare-pane').getByRole('slider');
    await expect(restored.first()).toHaveValue('1');
    await expect(restored.last()).toHaveValue('2');
    if (offline) await expect(opened.getByRole('button', { name: 'BFS / DFS' })).toHaveAttribute('aria-pressed', 'true');
    else {
      await expect(opened.getByLabel('共同输入')).toHaveValue('8, 3, 1');
      await expect(opened.getByRole('combobox', { name: '右侧', exact: true })).toHaveValue('sort/merge-sort');
    }
    await expect(opened.getByRole('status')).toHaveText('已暂停');
  });
}
