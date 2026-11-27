import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('演示和练习分别记录，JSON 备份可合并并继续上次演示', async ({ page }) => {
  await page.goto('/#/algo/recursion/factorial?input=8&step=0');
  await page.locator('.col-center > .controls-panel').getByTitle('跳到结尾 (End)').click();
  const nav = page.locator('.mobile-tabs').getByRole('button', { name: '目录', exact: true });
  if (await nav.isVisible()) await nav.click();
  await expect(page.locator('.catalog-foot')).toContainText('已看完演示 1 / 53 · 练习通过 0 / 53');
  await expect(page.locator('.catalog-foot')).not.toContainText('进度仅保存在本机浏览器');

  await page.goto('/#/lab');
  const options = page.locator('.lab-options');
  await options.getByRole('button', { name: '999', exact: true }).click();
  await options.getByRole('button', { name: '0', exact: true }).click();
  await expect(page.getByRole('button', { name: '只练错题（1）' })).toBeVisible();
  await page.goto('/#/map');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出学习记录' }).click();
  const file = await pending;
  const backup = await readFile(await file.path());
  expect(JSON.parse(backup.toString())).toMatchObject({
    version: 1, watched: ['recursion/factorial'], passed: ['stack/seq-stack'],
    lastLesson: { slug: 'recursion/factorial', input: [8] }, mistakes: [{ slug: 'stack/seq-stack', choice: '0' }],
  });
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith('dsv-mistake:')) localStorage.removeItem(key);
    localStorage.setItem('dsv-study', JSON.stringify({
      version: 1, watched: [], passed: ['tree/inorder'], lastLesson: null, mistakes: [],
    }));
  });
  await page.reload();

  const input = page.getByLabel('学习记录文件');
  await input.setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":2}') });
  await expect(page.getByRole('status')).toContainText('无法导入');
  await expect(page.getByRole('button', { name: '继续上次学习' })).toHaveCount(0);
  await input.setInputFiles({ name: file.suggestedFilename(), mimeType: 'application/json', buffer: backup });
  await expect(page.getByRole('status')).toContainText('学习记录已合并');
  await page.getByRole('button', { name: '继续上次学习' }).click();
  await expect(page.locator('.col-center .caption-text').first()).toContainText('fact(8) = 40320');
  if (await nav.isVisible()) await nav.click();
  await expect(page.locator('.catalog-foot')).toContainText('已看完演示 1 / 53 · 练习通过 2 / 53');
  await page.goto('/#/lab');
  await page.getByRole('button', { name: '只练错题（1）' }).click();
  await page.locator('.lab-options').getByRole('button', { name: '999', exact: true }).click();
  await expect(page.getByRole('button', { name: '只练错题（0）' })).toBeVisible();
  await page.goto('/#/map');
  await input.setInputFiles({ name: file.suggestedFilename(), mimeType: 'application/json', buffer: backup });
  await expect(page.getByRole('status')).toContainText('学习记录已合并');
  await page.goto('/#/lab');
  await expect(page.getByRole('button', { name: '只练错题（0）' })).toBeVisible();
});

test('改过题干的旧本地错题仍可复习', async ({ page }) => {
  await page.goto('/#/lab');
  await page.locator('.lab-options').getByRole('button', { name: '0', exact: true }).click();
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find((item) => item.startsWith('dsv-mistake:'))!;
    const record = JSON.parse(localStorage.getItem(key)!);
    const [, ...parts] = JSON.parse(record.id);
    localStorage.setItem('dsv-practice-mistakes', JSON.stringify([{
      ...record, id: JSON.stringify([...parts, '旧题干已经被修改', '999']),
    }]));
    localStorage.removeItem('dsv-study');
    localStorage.removeItem(key);
  });
  await page.reload();
  await page.getByRole('button', { name: '只练错题（1）' }).click();
  await expect(page.locator('.lab-question')).toContainText('接下来从栈顶取出的值是多少？');
  await page.locator('.lab-options').getByRole('button', { name: '999', exact: true }).click();
  await expect(page.getByRole('button', { name: '只练错题（0）' })).toBeVisible();
});
