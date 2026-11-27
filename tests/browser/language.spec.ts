import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

test('language switch preserves the current lesson and playback step', async ({ page }) => {
  await page.goto('/#/algo/graph/bfs');
  const turn = page.getByRole('button', { name: 'Switch to English' });
  await expect(page.locator('.topright .github-link')).toBeVisible();
  await expect(turn).toBeVisible();

  const controls = page.locator('.col-center > .controls-panel');
  await controls.getByTitle('下一步 (→)').click();
  await turn.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Graphs · Breadth-First Search (BFS)' })).toBeVisible();
  await expect(controls.getByRole('slider', { name: 'Playback Progress' })).toHaveValue('1');
  await expect(controls.locator('.caption-text')).not.toContainText(/\p{Script=Han}/u);

  await page.getByRole('button', { name: 'Custom Graph', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Custom Graph' });
  await expect(dialog.getByRole('textbox', { name: 'Vertices' })).toBeVisible();
  await expect(dialog.getByRole('img', { name: 'Custom Graph Preview' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(controls.getByRole('slider', { name: 'Playback Progress' })).toHaveValue('1');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: '切换到中文' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('heading', { name: '图 · 广度优先遍历' })).toBeVisible();
});

test('English search, comparison, and practice are available in the same navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to English' }).click();
  await page.getByRole('searchbox', { name: 'Search algorithms' }).fill('breadth first search');
  await expect(page.locator('.algo-card')).toHaveCount(1);
  await expect(page.locator('.algo-card')).toContainText('Breadth-First Search (BFS)');
  const search = page.getByRole('searchbox', { name: 'Search algorithms' });
  for (const query of ['Floyd-Warshall', 'Floyd–Warshall', 'Floyd Warshall']) {
    await search.fill(query);
    await expect(page.locator('.algo-card')).toHaveCount(1);
    await expect(page.locator('.algo-card')).toContainText('Floyd–Warshall');
  }
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Algorithm Comparison' })).toBeVisible();
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Practice' })).toBeVisible();
});

test('a failed locale download preserves English on the next healthy reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  const englishChunk = /\/assets\/en-[^/]+\.js$/;
  await page.route(englishChunk, route => route.abort());
  await page.reload();
  await expect(page.getByRole('status')).toHaveText('英文资源加载失败，请刷新页面重试。');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  expect(await page.evaluate(() => localStorage.getItem('dsv-language'))).toBe('en');

  await page.unroute(englishChunk);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('English Floyd steps retain the numeric comparison and matrix indices', async ({ page }) => {
  await page.goto('/#/algo/graph/floyd?input=5&step=2');
  await page.getByRole('button', { name: 'Switch to English' }).click();
  const caption = page.locator('.col-center > .controls-panel .caption-text');
  await expect(caption).toHaveText('D[D][A] + D[A][B] = 7 + 3 = 10 < ∞. The path through A is shorter, so update the distance.');
});

test('topological sorting uses English in code messages and input-based practice', async ({ page }) => {
  await page.goto('/#/algo/graph/topo-sort');
  await page.getByRole('button', { name: 'Switch to English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const mobileTabs = page.locator('.mobile-tabs');
  if (await mobileTabs.isVisible()) await mobileTabs.getByRole('button', { name: 'Code', exact: true }).click();
  await expect(page.locator('.code-lines')).toContainText('Cannot complete topological sort: the graph contains a cycle.');
  if (await mobileTabs.isVisible()) await mobileTabs.getByRole('button', { name: 'Animation', exact: true }).click();
  await page.getByRole('button', { name: 'Practice with This Input' }).click();
  await expect(page.locator('.lab-question')).toContainText('Which vertex will topological sort pop next?');
});

test('English works in the offline build and fits a 320px viewport', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop', 'Run at the smallest supported viewport');
  await page.setViewportSize({ width: 320, height: 750 });
  await context.setOffline(true);
  await page.goto(pathToFileURL(resolve('dist/standalone.html')).href + '#/algo/array/sparse-triple');
  await page.getByRole('button', { name: 'Switch to English' }).click();

  const expectNoDocumentOverflow = async () => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  };
  await expect(page.getByRole('heading', { name: 'Sparse Matrix · Triplet Representation' })).toBeVisible();
  await expectNoDocumentOverflow();
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Algorithm Comparison' })).toBeVisible();
  await expectNoDocumentOverflow();
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Practice' })).toBeVisible();
  await expectNoDocumentOverflow();
});
