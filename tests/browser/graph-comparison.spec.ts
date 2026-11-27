import { expect, test } from '@playwright/test';

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
