import { expect, test, type Page } from '@playwright/test';

const controls = (page: Page) => page.locator('.col-center > .controls-panel');

test('Floyd 完整矩阵、三个单元格与更新回退', async ({ page }) => {
  await page.goto('/#/algo/graph/floyd');
  const table = page.getByRole('table', { name: '完整距离矩阵 D', exact: true });
  await expect(table.locator('td')).toHaveCount(25);
  await expect(table.locator('[data-row="D"][data-col="B"]')).toHaveText('∞');
  await controls(page).getByRole('button', { name: '更新 D[i][j]', exact: true }).click();
  await expect(table.locator('[data-role="left"]')).toHaveText('7');
  await expect(table.locator('[data-role="right"]')).toHaveText('3');
  await expect(table.locator('[data-role="target"]')).toHaveText('10');
  await expect(table.locator('.matrix-updated')).toHaveCount(1);
  await controls(page).getByTitle('上一步 (←)').click();
  await expect(table.locator('[data-row="D"][data-col="B"]')).toHaveText('∞');
  await expect(table.locator('[data-role="target"]')).toHaveCount(0);
  await controls(page).getByTitle('跳到结尾 (End)').click();
  await expect(table.locator('[data-row="A"][data-col="D"]')).toHaveText('8');
  await expect(table.locator('td')).toHaveCount(25);
});

test('Prim 候选连接点、lowcost 与本轮刷新', async ({ page }) => {
  await page.goto('/#/algo/graph/prim');
  const table = page.getByRole('table', { name: 'Prim 候选连接表' });
  await expect(table.locator('[data-vertex="B"] td')).toHaveText(['6', 'A', '否']);
  await expect(table.locator('.candidate-min')).toHaveText(['1']);
  await controls(page).getByRole('button', { name: '刷新 lowcost', exact: true }).click();
  await expect(table.locator('[data-vertex="B"] td')).toHaveText(['5', 'C', '否']);
  await expect(table.locator('[data-vertex="B"]')).toHaveClass('detail-updated');
  await expect(table.locator('[data-vertex="C"] td')).toHaveText(['0', '—', '是']);
  await controls(page).getByTitle('跳到开头 (Home)').click();
  await expect(table.locator('[data-vertex="B"] td')).toHaveText(['6', 'A', '否']);
  await controls(page).getByTitle('跳到结尾 (End)').click();
  await expect(table.locator('tbody tr td:last-child')).toHaveText(Array(6).fill('是'));
});

test('Kruskal 分组合并、父指针与成环拒绝', async ({ page }) => {
  await page.goto('/#/algo/graph/kruskal');
  const groups = page.getByLabel('并查集分组');
  await expect(groups.locator('.component-card')).toHaveCount(6);
  await controls(page).getByRole('button', { name: '选入并合并', exact: true }).click();
  await expect(groups.locator('.component-card')).toHaveCount(5);
  await expect(groups.locator('.component-union .component-member')).toHaveText(['A', 'C']);
  await expect(page.getByLabel('并查集父指针').locator('[data-vertex="A"]')).toHaveText('A → C');
  await controls(page).getByRole('button', { name: '丢弃成环边', exact: true }).click();
  await expect(groups.locator('.component-card')).toHaveCount(2);
  await expect(groups.locator('.component-reject')).toHaveCount(1);
  await expect(page.locator('.kruskal-details .graph-detail-note')).toContainText('根相同');
  await controls(page).getByTitle('跳到结尾 (End)').click();
  await expect(groups.locator('.component-card')).toHaveCount(1);
  await expect(groups.locator('.component-member')).toHaveText(['A', 'B', 'C', 'D', 'E', 'F']);
  await controls(page).getByTitle('跳到开头 (Home)').click();
  await expect(groups.locator('.component-card')).toHaveCount(6);
});

for (const [order, sequence, first] of [
  ['preorder', ['1','2','4','5','3','6','7'], '1'],
  ['inorder', ['4','2','5','1','6','3','7'], '4'],
  ['postorder', ['4','5','2','6','7','3','1'], '4'],
] as const) {
  test(`树 ${order} 调用栈与访问序列`, async ({ page }) => {
    await page.goto(`/#/algo/tree/${order}`);
    await expect(page.locator('.call-stack-side .stack-svg')).toContainText('调用栈为空');
    await expect(page.locator('.output-sequence')).toContainText('尚未输出');
    await controls(page).getByRole('button', { name: '访问根结点', exact: true }).click();
    await expect(page.locator('.output-sequence .aux-cell')).toHaveText([first]);
    await expect(page.locator('.call-stack-side .stack-svg')).toContainText('当前调用');
    await controls(page).getByTitle('跳到结尾 (End)').click();
    await expect(page.locator('.output-sequence .aux-cell')).toHaveText([...sequence]);
    await expect(page.locator('.call-stack-side .stack-svg')).toContainText('调用栈为空');
    await controls(page).getByTitle('跳到开头 (Home)').click();
    await expect(page.locator('.output-sequence')).toContainText('尚未输出');
  });
}
