import { expect, test, type Page } from '@playwright/test';

const controls = (page: Page) => page.locator('.col-center > .controls-panel');
async function open(page: Page, slug: string) {
  await page.goto(`/#/algo/${slug}`);
  await expect(controls(page).locator('.step-no')).toContainText('步骤 1 /');
}

test('Dijkstra 距离、前驱、候选路径、最终路径与回退', async ({ page }) => {
  await open(page, 'graph/dijkstra');
  const table = page.getByRole('table', { name: 'Dijkstra 计算表' });
  const detail = page.getByLabel('所选路径');
  await controls(page).getByTitle('跳到结尾 (End)').click();
  await expect(table.locator('[data-vertex="F"] td')).toHaveText(['10', 'D', '是']);
  await table.getByRole('button', { name: '查看 F 的路径' }).click();
  await expect(detail).toContainText('A → B → C → D → F');
  await expect(page.locator('.shortest-path-graph line[stroke="#225EFC"]')).toHaveCount(4);
  await controls(page).getByTitle('跳到开头 (Home)').click();
  await expect(detail).toContainText('当前尚未发现');
  await expect(table.locator('[data-vertex="F"] td')).toHaveText(['∞', '—', '否']);
  await controls(page).getByRole('button', { name: '松弛成功', exact: true }).click();
  await expect(table.locator('tr.path-row-updated')).toHaveAttribute('data-vertex', 'B');
  await table.getByRole('button', { name: '查看 B 的路径' }).focus();
  await page.keyboard.press('Space');
  await expect(detail).toContainText('当前候选路径');
  await expect(detail).toContainText('A → B');
  await expect(controls(page).getByTitle('播放 / 暂停 (空格)')).toHaveText('播放');
  await page.locator('.shortest-path-graph').getByRole('button', { name: '查看 A 的路径' }).focus();
  await page.keyboard.press('Enter');
  await expect(table.getByRole('button', { name: '查看 A 的路径' })).toHaveAttribute('aria-pressed', 'true');
});

test('Dijkstra 不可达案例、修改数量、默认与案例回放', async ({ page }) => {
  await open(page, 'graph/dijkstra');
  const input = page.locator('.input-panel');
  await input.getByRole('button', { name: '目标不可达', exact: true }).click();
  await expect(page.getByLabel('顶点数量')).toHaveValue('6');
  await controls(page).getByTitle('跳到结尾 (End)').click();
  await page.locator('.shortest-path-table').getByRole('button', { name: '查看 F 的路径' }).click();
  await expect(page.getByLabel('所选路径')).toContainText('无法到达 F');
  await expect(page.locator('[data-vertex="F"] td')).toHaveText(['∞', '—', '否']);
  await page.getByLabel('顶点数量').fill('3');
  await input.getByRole('button', { name: '生成动画' }).click();
  await expect(input.getByRole('button', { name: '目标不可达' })).toHaveAttribute('aria-pressed', 'true');
  await controls(page).getByTitle('跳到结尾 (End)').click();
  await expect(page.locator('[data-vertex="C"] td')).toHaveText(['∞', '—', '否']);
  // 使用公开的回放 URL 验证案例编号随输入一起保存。
  await page.goto('/#/algo/graph/dijkstra?input=3,1&step=0');
  await expect(page.getByLabel('顶点数量')).toHaveValue('3');
  await expect(input.getByRole('button', { name: '目标不可达' })).toHaveAttribute('aria-pressed', 'true');
  await input.getByRole('button', { name: '默认', exact: true }).click();
  await expect(page.getByLabel('顶点数量')).toHaveValue('6');
  await expect(input.getByRole('button', { name: '全部可达' })).toHaveAttribute('aria-pressed', 'true');
});

for (const [slug, legend] of [['graph/dfs', '当前调用'], ['graph/bfs', '新入队']]) {
  test(`${slug} 非连通图与辅助结构图例`, async ({ page }) => {
    await open(page, slug);
    await expect(page.locator('.stage .legend')).toContainText(legend);
    await page.getByRole('button', { name: '非连通图', exact: true }).click();
    await controls(page).getByTitle('跳到结尾 (End)').click();
    await expect(controls(page).locator('.caption-text')).toContainText('仍未访问');
    await expect(page.locator('.stage-canvas')).toContainText(slug.endsWith('dfs') ? '调用栈为空' : '空队列');
  });
}

test('拓扑排序有环时只展示部分输出，切换后恢复完整序列', async ({ page }) => {
  await open(page, 'graph/topo-sort');
  await page.getByRole('button', { name: '存在环', exact: true }).click();
  await controls(page).getByTitle('跳到结尾 (End)').click();
  await expect(controls(page).locator('.phase-tag')).toHaveText('检测到环');
  await expect(controls(page).locator('.caption-text')).toContainText('无法完成拓扑排序');
  await expect(page.locator('.output-sequence .aux-cell')).toHaveText(['A']);
  await page.getByRole('button', { name: '无环图', exact: true }).click();
  await expect(page.locator('.output-sequence')).toContainText('尚未输出');
  await controls(page).getByTitle('跳到结尾 (End)').click();
  await expect(page.locator('.output-sequence .aux-cell')).toHaveText(['A', 'C', 'E', 'B', 'D', 'F']);
});
