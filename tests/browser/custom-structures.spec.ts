import { expect, test, type Page } from '@playwright/test';
import { algorithmReplayPath } from '../../src/engine/router';
import { parseCustomGraph, parseTreeInput } from '../../src/engine/structure-input';

const controls = (page: Page) => page.locator('.col-center > .controls-panel');
const finish = (page: Page) => controls(page).getByTitle('跳到结尾 (End)').click();

for (const algorithm of ['bfs', 'dfs']) {
  test(`${algorithm.toUpperCase()} 从指定起点遍历自定义无向图`, async ({ page }) => {
    await page.goto(`/#/algo/graph/${algorithm}`);
    const custom = page.getByRole('button', { name: '自定义图', exact: true });
    const preset = page.getByRole('button', { name: '预设案例', exact: true });
    await expect(custom).toBeInViewport();
    await expect(preset).toHaveAttribute('aria-expanded', 'false');
    await custom.click();
    const dialog = page.getByRole('dialog', { name: '自定义图' });
    await expect(dialog).toBeVisible();
    await expect(page.getByLabel('顶点数量')).toBeHidden();
    await page.getByLabel('顶点', { exact: true }).fill('E, B, A, C, D');
    await page.getByLabel('起点', { exact: true }).fill('B');
    await page.getByLabel('无向边').fill('E B\nB A\nE C');
    const preview = dialog.getByRole('img', { name: '自定义图预览' });
    await expect(preview).toBeInViewport();
    await expect(preview.locator('line')).toHaveCount(3);
    await expect(preview.getByText('起点', { exact: true })).toBeVisible();
    await expect(controls(page).locator('.caption-text')).toContainText(algorithm === 'bfs' ? '起点 A 入队' : '进入 A');
    await dialog.getByRole('button', { name: '确定', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(custom).toBeFocused();
    await expect(page.getByLabel('无向边')).toBeHidden();
    await expect(page.getByRole('region', { name: '图输入' }).getByRole('status')).toHaveText('自定义 · 5 个顶点');
    await expect(controls(page).locator('.caption-text')).toContainText(algorithm === 'bfs' ? '起点 B 入队' : '进入 B');
    await finish(page);
    await expect(controls(page).locator('.caption-text')).toContainText('D 不与 B 连通');
    if (algorithm === 'bfs') await expect(controls(page).locator('.caption-text')).toContainText('B → E → A → C');
    await custom.click();
    await expect(dialog.getByLabel('起点')).toHaveValue('B');
    await dialog.getByLabel('起点').fill('E');
    await dialog.getByRole('button', { name: '取消', exact: true }).click();
    await expect(controls(page).locator('.caption-text')).toContainText('D 不与 B 连通');
    await preset.click();
    await expect(page.getByLabel('无向边')).toBeHidden();
    await page.getByRole('button', { name: '连通图', exact: true }).click();
    await expect(controls(page).locator('.caption-text')).toContainText(algorithm === 'bfs' ? '起点 A 入队' : '进入 A');
  });
}

test('Dijkstra 拒绝负权，恢复自定义图后显示零权路径与不可达顶点', async ({ page }) => {
  const slug = 'graph/dijkstra';
  const edges = 'B A 0\nA C 4\nB C 8\nA B 7';
  const path = algorithmReplayPath(slug, {
    input: parseCustomGraph('A, B, C, D', 'B', edges, true),
    step: 1,
  });
  await page.goto(`/#/${path}`);
  await page.getByRole('button', { name: '自定义图', exact: true }).click();
  await expect(page.getByLabel('起点', { exact: true })).toHaveValue('B');
  await expect(page.getByLabel('有向带权边')).toHaveValue(edges);
  await expect(controls(page).locator('.step-no')).toContainText('步骤 2 /');
  const dialog = page.getByRole('dialog', { name: '自定义图' });
  await expect(dialog.getByRole('img', { name: '自定义图预览' }).getByText('7', { exact: true })).toBeVisible();
  await page.getByLabel('有向带权边').fill('B A -2');
  await expect(dialog.getByRole('status')).toContainText('边权须为 0–999');
  await expect(dialog.getByRole('button', { name: '确定', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(controls(page).locator('.step-no')).toContainText('步骤 2 /');
  await finish(page);
  const table = page.locator('.shortest-path-table');
  await table.getByRole('button', { name: '查看 C 的路径' }).click();
  await expect(table.getByLabel('所选路径')).toContainText('B → A → C');
  await expect(table.getByLabel('所选路径')).toContainText('距离：4');
  await table.getByRole('button', { name: '查看 D 的路径' }).click();
  await expect(table.getByLabel('所选路径')).toContainText('B 无法到达 D');
  await expect(controls(page).locator('.caption-text')).toContainText('A=0');
});

for (const [algorithm, expected] of [
  ['preorder', 'A B D C E'],
  ['inorder', 'B D A E C'],
  ['postorder', 'D B E C A'],
  ['levelorder', 'A B C D E'],
]) {
  test(`${algorithm} 保留二叉树中的空位`, async ({ page }) => {
    await page.goto(`/#/algo/tree/${algorithm}`);
    const trigger = page.getByRole('button', { name: '自定义二叉树', exact: true });
    await expect(trigger).toBeInViewport();
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '自定义二叉树' });
    const confirm = dialog.getByRole('button', { name: '确定', exact: true });
    const input = page.getByLabel('层序输入');
    await input.fill('A, null, null, B');
    await expect(dialog.getByRole('status')).toContainText('没有可接收剩余输入的父结点');
    await expect(confirm).toBeDisabled();
    await input.fill('A, B, C, null, D, E');
    const preview = dialog.getByRole('img', { name: '自定义二叉树预览' });
    await expect(preview.locator('line')).toHaveCount(4);
    await expect(page.locator('.stage-canvas svg text').filter({ hasText: /^A$/ })).toHaveCount(0);
    await confirm.click();
    await expect(dialog).toBeHidden();
    await finish(page);
    if (algorithm === 'levelorder') {
      await expect(controls(page).locator('.caption-text')).toContainText(expected);
    } else {
      await expect(page.locator('.output-sequence .aux-cell')).toHaveText(expected.split(' '));
    }
  });
}

test('回放恢复只有右孩子的二叉树，舞台把右孩子画在根右侧', async ({ page }) => {
  const path = algorithmReplayPath('tree/inorder', { input: parseTreeInput('A, null, B'), step: 1 });
  await page.goto(`/#/${path}`);
  await page.getByRole('button', { name: '自定义二叉树', exact: true }).click();
  await expect(page.getByLabel('层序输入')).toHaveValue('A, null, B');
  await page.getByLabel('层序输入').fill('A, B');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await expect(controls(page).locator('.step-no')).toContainText('步骤 2 /');
  const labels = page.locator('.stage-canvas svg text');
  const root = await labels.filter({ hasText: /^A$/ }).boundingBox();
  const child = await labels.filter({ hasText: /^B$/ }).boundingBox();
  expect(child!.x).toBeGreaterThan(root!.x);
});

test('拓扑排序支持自定义有向依赖和有环图', async ({ page }) => {
  await page.goto('/#/algo/graph/topo-sort');
  const trigger = page.getByRole('button', { name: '自定义图', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: '自定义图' });
  await expect(dialog.getByLabel('起点')).toHaveCount(0);
  const edges = dialog.getByLabel('有向边', { exact: true });
  const confirm = dialog.getByRole('button', { name: '确定', exact: true });
  await dialog.getByLabel('顶点', { exact: true }).fill('X, Y, Z');
  await edges.fill('X Y\nY Z');
  await expect(dialog.getByRole('img').locator('line[marker-end]')).toHaveCount(2);
  await confirm.click();
  await finish(page);
  await expect(page.locator('.output-sequence .aux-cell')).toHaveText(['X', 'Y', 'Z']);
  await trigger.click();
  await edges.fill('X Y\nY Z\nZ Y');
  await confirm.click();
  await finish(page);
  await expect(controls(page).locator('.phase-tag')).toHaveText('检测到环');
  await expect(page.locator('.output-sequence .aux-cell')).toHaveText(['X']);
});

test('复制演示链接可在新页面回放自定义图和当前步骤', async ({ page, context }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value: string) => { document.body.dataset.copied = value; } },
    });
  });
  const input = parseCustomGraph('A, B, C', 'B', 'B C 3', true);
  await page.goto('/#/' + algorithmReplayPath('graph/dijkstra', { input, step: 1 }));
  await controls(page).getByTitle('下一步 (→)').click();
  await page.getByRole('button', { name: '复制演示链接', exact: true }).click();
  await expect(controls(page).getByRole('status')).toContainText('已复制第 3 步');
  const copied = await page.locator('body').getAttribute('data-copied');
  const recipient = await context.newPage();
  await recipient.goto(copied!);
  await expect(controls(recipient).locator('.step-no')).toContainText('步骤 3 /');
  const table = recipient.getByRole('table', { name: 'Dijkstra 计算表' });
  await expect(table.locator('caption')).toContainText('源点 B');
  await expect(table.locator('[data-vertex="C"] td').first()).toHaveText('3');
});

test('剪贴板不可用时可手动复制当前回放链接', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => { throw new Error('Denied'); } },
    });
  });
  await page.goto('/#/algo/tree/inorder');
  await page.getByRole('button', { name: '复制演示链接', exact: true }).click();
  await expect(controls(page).getByRole('status')).toContainText('请手动复制第 1 步');
  await expect(page.getByRole('textbox', { name: '演示链接', exact: true })).toHaveValue(/#\/algo\/tree\/inorder\?input=.+&step=0$/);
});
