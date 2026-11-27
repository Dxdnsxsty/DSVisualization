import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';

test('错题跨刷新保留，可回放并在复习答对后移除', async ({ page }) => {
  await page.goto('/#/lab');
  const reviewMode = page.getByRole('button', { name: /^只练错题/ });
  const choices = page.locator('.lab-options');
  const result = page.locator('.lab-result');
  await reviewMode.click();
  await expect(page.getByText('没有待复习的错题。')).toBeVisible();
  await page.getByRole('button', { name: '普通练习', exact: true }).click();

  await choices.getByRole('button', { name: '-123', exact: true }).click();
  await choices.getByRole('button', { name: '0', exact: true }).click();
  await expect(reviewMode).toHaveText('只练错题（1）');
  await choices.getByRole('button', { name: '999', exact: true }).click();
  await expect(reviewMode).toHaveText('只练错题（1）');
  await page.getByLabel('选择算法').selectOption('queue/circular-queue');
  await choices.getByRole('button', { name: '5', exact: true }).click();
  await expect(reviewMode).toHaveText('只练错题（2）');

  await page.reload();
  await reviewMode.click();
  await expect(page.getByText('接下来从栈顶取出的值是多少？')).toBeVisible();
  await expect(result).toHaveCount(0);
  await page.getByRole('button', { name: '换一题', exact: true }).click();
  await expect(page.getByText(/rear 会指向哪个下标/)).toBeVisible();
  const replay = page.getByRole('button', { name: /^从第 \d+ 步打开动画$/ });
  const step = (await replay.innerText()).match(/\d+/)?.[0];
  await replay.click();
  await expect(page).toHaveURL(/#\/algo\/queue\/circular-queue\?input=/);
  await expect(page.locator('.col-center > .controls-panel .step-no')).toContainText(`步骤 ${step} /`);
  await expect(page.getByLabel('自定义数据')).toHaveValue('4, 7, 9, 2, 6');

  await page.goto('/#/lab');
  await reviewMode.click();
  await choices.getByRole('button', { name: '999', exact: true }).click();
  await expect(result).toContainText('复习前错选「0」');
  await expect(result).toContainText('已移出待复习错题。');
  await expect(reviewMode).toHaveText('只练错题（1）');
  await page.getByRole('button', { name: '换一题', exact: true }).click();
  await expect(page.getByText(/rear 会指向哪个下标/)).toBeVisible();
  await choices.getByRole('button', { name: '0', exact: true }).click();
  await expect(reviewMode).toHaveText('只练错题（0）');
  await page.getByRole('button', { name: '结束复习', exact: true }).click();
  await expect(page.getByText('没有待复习的错题。')).toBeVisible();
  await page.reload();
  await expect(reviewMode).toHaveText('只练错题（0）');
});

test('断网单文件版也能记录和复习错题', async ({ page, context }) => {
  await context.setOffline(true);
  const standalone = pathToFileURL(resolve('dist/standalone.html')).href;
  await page.goto(standalone + '#/lab');
  const choices = page.locator('.lab-options');
  const review = page.getByRole('button', { name: /^只练错题/ });
  await choices.getByRole('button', { name: '0', exact: true }).click();
  await expect(review).toHaveText('只练错题（1）');
  await page.reload();
  await review.click();
  await choices.getByRole('button', { name: '999', exact: true }).click();
  await expect(review).toHaveText('只练错题（0）');
});

test('多个标签页分别答错、答对复习题时同步增删且互不覆盖', async ({ page, context }) => {
  const second = await context.newPage();
  await Promise.all([page.goto('/#/lab'), second.goto('/#/lab')]);
  await second.getByLabel('选择算法').selectOption('queue/circular-queue');
  await Promise.all([
    page.locator('.lab-options').getByRole('button', { name: '0', exact: true }).click(),
    second.locator('.lab-options').getByRole('button', { name: '5', exact: true }).click(),
  ]);
  await expect(page.getByRole('button', { name: '只练错题（2）' })).toBeVisible();
  await expect(second.getByRole('button', { name: '只练错题（2）' })).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: '只练错题（2）' }).click();
  if (await page.getByText(/rear 会指向哪个下标/).isVisible()) await page.getByRole('button', { name: '换一题', exact: true }).click();
  await page.locator('.lab-options').getByRole('button', { name: '999', exact: true }).click();
  await expect(second.getByRole('button', { name: '只练错题（1）' })).toBeVisible();
  await second.getByRole('button', { name: '只练错题（1）' }).click();
  await expect(second.getByText(/rear 会指向哪个下标/)).toBeVisible();
});
