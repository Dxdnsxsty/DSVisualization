import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('哈夫曼点选叶子高亮编码路径，下载包含当前输入', async ({ page }) => {
  await page.goto('/#/algo/tree/huffman');
  await page.getByLabel('自定义数据').fill('3, 5');
  await page.getByRole('button', { name: '生成动画' }).click();
  await page.locator('.col-center > .controls-panel').getByTitle('跳到结尾 (End)').click();
  const table = page.getByRole('table', { name: '哈夫曼编码表' });
  await expect(table).toContainText('WPL = 8');
  await expect(table.locator('tbody tr').first().locator('td')).toHaveText(['3', '0', '1', '3']);
  await page.getByRole('button', { name: '查看 A 的路径', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(table.getByRole('button', { name: '高亮字符 A 的编码路径' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.graph-details-graph line[stroke="#225EFC"]')).toHaveCount(1);
  await table.getByRole('button', { name: '高亮字符 B 的编码路径' }).click();
  await expect(table.getByRole('button', { name: '高亮字符 A 的编码路径' })).toHaveAttribute('aria-pressed', 'false');
  const codeTab = page.locator('.mobile-tabs').getByRole('button', { name: '代码', exact: true });
  if (await codeTab.isVisible()) await codeTab.click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '下载', exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('tree-huffman.cpp');
  expect(await readFile(await file.path(), 'utf8')).toContain('int weights[] = {3, 5};');
});
