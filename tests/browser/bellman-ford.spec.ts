import { expect, test } from '@playwright/test';

test('Bellman-Ford 无更新后立即检测，不再出现后续松弛轮次', async ({ page }) => {
  await page.goto('/#/algo/graph/bellman-ford');
  const bar = page.locator('.col-center > .controls-panel');
  for (const [n, total] of [[3,12], [4,16], [5,22]]) {
    await page.getByLabel('自定义数据').fill(String(n));
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
