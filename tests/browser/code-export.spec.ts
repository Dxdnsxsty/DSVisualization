import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

async function openCodePanel(page: Page) {
  const tab = page.locator('.mobile-tabs').getByRole('button', { name: '代码', exact: true });
  if (await tab.isVisible()) await tab.click();
  return page.locator('.code-panel');
}

test('阶乘下载的 C++ 和 Python 使用当前动画输入', async ({ page }) => {
  await page.goto('/#/algo/recursion/factorial');
  await page.getByLabel('自定义数据').fill('8');
  await page.getByRole('button', { name: '生成动画', exact: true }).click();
  await expect(page.locator('.col-center .caption-text').first()).toContainText('fact(8)');
  const panel = await openCodePanel(page);
  for (const { language, call } of [
    { language: 'C++', call: 'std::cout << Fact(8);' },
    { language: 'Python', call: 'print(fact(8))' },
  ]) {
    await panel.getByRole('button', { name: language, exact: true }).click();
    const pending = page.waitForEvent('download');
    await panel.getByRole('button', { name: '下载', exact: true }).click();
    const file = await pending;
    const source = await readFile(await file.path(), 'utf8');
    expect(source).toContain('输入示例：8');
    expect(source).toContain(call);
  }
});

test('教学片段把动画输入标为参考数据', async ({ page }) => {
  await page.goto('/#/algo/graph/bfs');
  const panel = await openCodePanel(page);
  const pending = page.waitForEvent('download');
  await panel.getByRole('button', { name: '下载', exact: true }).click();
  const file = await pending;
  const source = await readFile(await file.path(), 'utf8');
  expect(source).toContain('教学片段');
  expect(source).toContain('动画输入（供参考）：6');
  expect(source).not.toContain('输入示例：');
});
