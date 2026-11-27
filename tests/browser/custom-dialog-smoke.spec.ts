import { expect, test } from '@playwright/test';

test('自定义图和树支持实时预览、应用与关闭后的焦点恢复', async ({ page }) => {
  await page.goto('/#/algo/graph/bfs');
  const graphTrigger = page.getByRole('button', { name: '自定义图', exact: true });
  await graphTrigger.click();
  const graph = page.getByRole('dialog', { name: '自定义图' });
  await graph.getByLabel('顶点', { exact: true }).fill('A, B, C');
  await graph.getByLabel('起点', { exact: true }).fill('C');
  await graph.getByLabel('无向边').fill('C A\nA B');
  await expect(graph.getByRole('img', { name: '自定义图预览' }).locator('line')).toHaveCount(2);
  await graph.getByRole('button', { name: '确定', exact: true }).click();
  await expect(graph).toBeHidden();
  await expect(graphTrigger).toBeFocused();
  await expect(page.locator('.col-center .caption-text').first()).toContainText('起点 C 入队');

  await page.goto('/#/algo/tree/inorder');
  const treeTrigger = page.getByRole('button', { name: '自定义二叉树', exact: true });
  await treeTrigger.click();
  const tree = page.getByRole('dialog', { name: '自定义二叉树' });
  await tree.getByLabel('层序输入').fill('X, null, Z');
  await expect(tree.getByRole('img', { name: '自定义二叉树预览' }).getByText('Z', { exact: true })).toBeVisible();
  await tree.getByRole('button', { name: '确定', exact: true }).click();
  await expect(tree).toBeHidden();
  await expect(treeTrigger).toBeFocused();
  await expect(page.getByRole('region', { name: '树输入' }).getByRole('status')).toHaveText('2 个结点');
});
