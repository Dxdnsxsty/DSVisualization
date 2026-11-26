import { expect, test } from '@playwright/test';

test('Bellman-Ford 无更新后立即检测，不再出现后续松弛轮次', async ({ page }) => {
  await page.goto('/#/algo/graph/bellman-ford');
  const bar = page.locator('.col-center > .controls-panel');
  for (const [n, total] of [[3,12], [4,16], [5,22]]) {
    await page.getByRole('button', { name: '预设案例', exact: true }).click();
    await page.getByLabel('顶点数量').fill(String(n));
    await page.getByRole('button', { name: '生成动画', exact: true }).click();
    await expect(bar.locator('.step-no')).toHaveText(`步骤 1 / ${total}`);
    await bar.getByRole('button', { name: '本轮无更新', exact: true }).click();
    await expect(bar.locator('.caption-text')).toContainText('立即结束松弛循环');
    await expect(bar.locator('.caption-text')).toContainText('第 2 轮');
    await bar.getByTitle('下一步 (→)').click();
    await expect(bar.locator('.phase-tag')).toHaveText('负权回路检测');
    await bar.getByTitle('下一步 (→)').click();
    await expect(bar.locator('.phase-tag')).toHaveText('完成');
    await expect(bar.locator('.caption-text')).toContainText('共执行 2 轮松弛');
    await expect(bar.locator('.step-no')).toHaveText(`步骤 ${total} / ${total}`);
    await bar.getByTitle('上一步 (←)').click();
    await bar.getByTitle('上一步 (←)').click();
    await expect(bar.locator('.phase-tag')).toHaveText('本轮无更新');
  }
});

test('Bellman-Ford 区分负权边、不可达负权环和可达负权环', async ({ page }) => {
  await page.goto('/#/algo/graph/bellman-ford');
  const bar = page.locator('.col-center > .controls-panel');
  const dialog = page.getByRole('dialog', { name: '自定义图' });
  const edit = page.getByRole('button', { name: '自定义图', exact: true });
  const run = dialog.getByRole('button', { name: '确定', exact: true });
  await edit.click();
  await dialog.getByLabel('顶点', { exact: true }).fill('A, B, C, D, E');
  await dialog.getByLabel('起点', { exact: true }).fill('B');
  await dialog.getByLabel('有向带权边').fill('B A -4\nA C 1\nD E -2\nE D 1');
  await expect(dialog.getByRole('img').getByText('-4', { exact: true })).toBeVisible();
  await run.click();
  await expect(bar.locator('.caption-text')).toContainText('dist[B] = 0');
  await bar.getByTitle('跳到结尾 (End)').click();
  await expect(bar.locator('.caption-text')).toContainText('未发现源点可达的负权回路');
  await expect(bar.locator('.caption-text')).toContainText('A=-4，B=0，C=-3，D=∞，E=∞');

  await edit.click();
  await dialog.getByLabel('有向带权边').fill('B A -4\nA C 1\nD E -2\nE D 1\nC D 2');
  await run.click();
  await bar.getByTitle('跳到结尾 (End)').click();
  await expect(bar.locator('.phase-tag')).toHaveText('检测到负权回路');
  await expect(bar.locator('.caption-text')).toContainText('D→E');
});
