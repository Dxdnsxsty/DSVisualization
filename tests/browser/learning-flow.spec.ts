import { expect, test } from '@playwright/test';
import { algorithmReplayPath } from '../../src/engine/router';
import { parseCustomGraph, parseTreeInput } from '../../src/engine/structure-input';

test('对比页的单独学习保留已应用输入和本侧步骤', async ({ page }) => {
  await page.goto('/#/compare');
  await page.getByLabel('共同输入').fill('8, 3, 1');
  await page.getByRole('button', { name: '应用输入', exact: true }).click();
  const rightAlgorithm = page.getByRole('combobox', { name: '右侧', exact: true });
  await rightAlgorithm.selectOption('sort/merge-sort');
  const left = page.locator('.compare-pane').first();
  const right = page.locator('.compare-pane').last();
  const progress = left.getByRole('slider');
  await progress.focus();
  await progress.press('ArrowRight');
  await expect(progress).toHaveValue('1');
  await right.getByRole('slider').press('ArrowRight');
  await right.getByRole('slider').press('ArrowRight');
  await left.getByRole('button', { name: '单独学习', exact: true }).click();
  await expect(page.getByLabel('自定义数据', { exact: true })).toHaveValue('8, 3, 1');
  await expect(page.locator('.col-center > .controls-panel .step-no')).toContainText('步骤 2 /');
  await page.getByRole('button', { name: '返回对比', exact: true }).click();
  const verifyComparison = async () => {
    await expect(page.getByLabel('共同输入')).toHaveValue('8, 3, 1');
    await expect(rightAlgorithm).toHaveValue('sort/merge-sort');
    await expect(left.getByRole('slider')).toHaveValue('1');
    await expect(right.getByRole('slider')).toHaveValue('2');
    await expect(page.getByRole('status')).toHaveText('已暂停');
  };
  await verifyComparison();
  await right.getByRole('button', { name: '单独学习', exact: true }).click();
  await expect(page.getByRole('button', { name: '返回对比', exact: true })).toBeVisible();
  await page.goBack();
  await verifyComparison();
});

test('算法地图可搜索缩写、章节和中文名', async ({ page }) => {
  await page.goto('/#/map');
  const search = page.getByRole('searchbox', { name: '搜索算法' });
  const cards = page.locator('.algo-card');
  await search.fill('bFs');
  await expect(cards.filter({ hasText: '广度优先遍历' })).toBeVisible();
  await expect(cards.filter({ hasText: 'Dijkstra' })).toHaveCount(0);
  await search.fill('内排序');
  await expect(cards.filter({ hasText: '快速排序' })).toBeVisible();
  await search.fill('中序遍历');
  await expect(cards.filter({ hasText: '中序遍历' })).toBeVisible();
  await search.fill('zzz-no-such-algorithm');
  await expect(page.getByRole('status')).toHaveText('未找到匹配的算法');
  await expect(cards).toHaveCount(0);
});

test('用自定义图出 Dijkstra 题，错题刷新后仍能回放', async ({ page }) => {
  const input = parseCustomGraph('A, B, C', 'B', 'B C 3', true);
  await page.goto('/#/' + algorithmReplayPath('graph/dijkstra', { input, step: 1 }));
  await page.getByRole('button', { name: '用这组数据练习', exact: true }).click();
  await expect(page.locator('.lab-question')).toHaveText('检查边 B → C（权重 3）后，C 的距离是多少？');
  await expect(page.locator('.lab-card')).toContainText('起点 B');
  await page.locator('.lab-options').getByRole('button', { name: '∞', exact: true }).click();
  await expect(page.locator('.lab-result')).toContainText('正确答案是「3」');
  await page.reload();
  await page.getByRole('button', { name: '只练错题（1）', exact: true }).click();
  await expect(page.locator('.lab-question')).toContainText('权重 3');
  await page.getByRole('button', { name: '从第 2 步打开动画', exact: true }).click();
  await expect(page.locator('.col-center > .controls-panel .step-no')).toContainText('步骤 2 /');
  await expect(page.getByRole('table', { name: 'Dijkstra 计算表' }).locator('caption')).toContainText('源点 B');
});

test('用自定义树出中序遍历题，并保留层序空位', async ({ page }) => {
  const input = parseTreeInput('A, null, B');
  await page.goto('/#/' + algorithmReplayPath('tree/inorder', { input, step: 0 }));
  await page.getByRole('button', { name: '用这组数据练习', exact: true }).click();
  await expect(page.locator('.lab-card')).toContainText('本题输入 A, null, B');
  await expect(page.locator('.lab-question')).toHaveText('中序遍历下一个访问的结点值是什么？');
  await page.locator('.lab-options').getByRole('button', { name: 'A', exact: true }).click();
  await expect(page.locator('.lab-result')).toContainText('回答正确。');
  await page.getByRole('button', { name: '换一题', exact: true }).click();
  await page.locator('.lab-options').getByRole('button', { name: 'B', exact: true }).click();
  await expect(page.locator('.lab-result')).toContainText('回答正确。');
});

test('BFS 按自定义队列出题，答错后能回放同一组输入', async ({ page }) => {
  const input = parseCustomGraph('A, B, C', 'C', 'C B', false);
  await page.goto('/#/' + algorithmReplayPath('graph/bfs', { input, step: 0 }));
  await page.getByRole('button', { name: '用这组数据练习', exact: true }).click();
  await expect(page.locator('.lab-question')).toHaveText('BFS 接下来会从队头取出哪个顶点？');
  await expect(page.locator('.lab-card')).toContainText('起点 C');
  await page.locator('.lab-options').getByRole('button', { name: 'A', exact: true }).click();
  await expect(page.locator('.lab-result')).toContainText('正确答案是「C」');
  await page.getByRole('button', { name: '从第 1 步打开动画' }).click();
  await expect(page.locator('.col-center .caption-text').first()).toContainText('起点 C 入队');
});

test('DFS 在自定义图上能练习递归深入和跳过已访问结点', async ({ page }) => {
  const input = parseCustomGraph('A, B, C', 'B', 'B C', false);
  await page.goto('/#/' + algorithmReplayPath('graph/dfs', { input, step: 0 }));
  await page.getByRole('button', { name: '用这组数据练习', exact: true }).click();
  await expect(page.locator('.lab-question')).toHaveText('DFS 刚检查了一个邻接点，下一步会怎么处理它？');
  const options = page.locator('.lab-options');
  await options.getByRole('button', { name: '递归进入该邻接点' }).click();
  await expect(page.locator('.lab-result')).toContainText('回答正确。');
  await page.getByRole('button', { name: '换一题', exact: true }).click();
  await options.getByRole('button', { name: '跳过已访问的邻接点' }).click();
  await expect(page.locator('.lab-result')).toContainText('回答正确。');
});

test('拓扑练习能预测出栈，也能识别自定义有向环', async ({ page }) => {
  const open = async (edges: string) => {
    const input = parseCustomGraph('A, B, C', null, edges, false);
    await page.goto('/#/' + algorithmReplayPath('graph/topo-sort', { input, step: 0 }));
    await page.getByRole('button', { name: '用这组数据练习', exact: true }).click();
  };
  await open('A B\nB C');
  await expect(page.locator('.lab-question')).toContainText('下一个出栈并输出的是谁？');
  await page.locator('.lab-options').getByRole('button', { name: 'A', exact: true }).click();
  await expect(page.locator('.lab-result')).toContainText('回答正确。');
  await open('A B\nB C\nC A');
  await expect(page.locator('.lab-question')).toContainText('待输出栈已空');
  await page.locator('.lab-options').getByRole('button', { name: '存在环，拓扑排序无法完成' }).click();
  await expect(page.locator('.lab-result')).toContainText('回答正确。');
});

test('无法出题时在演示页提示，生成可用输入后恢复练习入口', async ({ page }) => {
  const input = parseTreeInput('A, null, A');
  await page.goto('/#/' + algorithmReplayPath('tree/inorder', { input, step: 0 }));
  const practice = page.getByRole('button', { name: '用这组数据练习', exact: true });
  await expect(practice).toBeDisabled();
  await expect(page.getByText('至少需要两个不同的结点值，才能生成选择题。')).toBeVisible();
  await page.getByRole('button', { name: '自定义二叉树', exact: true }).click();
  await page.getByLabel('层序输入').fill('A, null, B');
  await page.getByRole('button', { name: '确定', exact: true }).click();
  await expect(practice).toBeEnabled();
});
