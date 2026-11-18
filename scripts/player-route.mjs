import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';

/** 使用真实播放器与 hash 解析，模拟路由通知与旧定时器的竞态。 */
export async function checkPlayerRoute() {
  const result = await build({
    stdin: { contents: `
      export * from './src/engine/player-route';
      export { usePlayer } from './src/engine/player';
      export { getAlgorithm } from './src/algorithms/registry';
      export { practiceQuestions } from './src/engine/practice';
      export { algorithmReplayPath, parseHash } from './src/engine/router';
    `, resolveDir: process.cwd() },
    bundle: true, format: 'cjs', platform: 'node', packages: 'external', write: false, logLevel: 'silent',
  });
  const loaded = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), loaded, loaded.exports);
  const { usePlayer, syncPlayerRoute, schedulePlayerAdvance, completedPlayerSlug,
    getAlgorithm, practiceQuestions, algorithmReplayPath, parseHash } = loaded.exports;
  const get = usePlayer.getState;
  const first = 'stack/seq-stack';
  const second = 'queue/linked-queue';
  let nextTimer = 0;
  const timers = new Map();
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const window = {
    location: { hash: '' },
    setTimeout: (fn) => { const id = ++nextTimer; timers.set(id, fn); return id; },
    clearTimeout: (id) => timers.delete(id),
  };
  Object.defineProperty(globalThis, 'window', { value: window, configurable: true });
  const open = (slug) => { window.location.hash = `#/algo/${slug}`; syncPlayerRoute(slug); };
  const capture = () => timers.get(nextTimer);
  const tests = [
    ['可见算法正常单步，清理取消定时器', () => {
      open(first);
      get().setPlaying(true);
      const cleanup = schedulePlayerAdvance(first);
      capture()();
      assert.equal(get().step, 1);
      cleanup();
      assert.equal(timers.size, 0);
    }],
    ['离开算法页前后的旧定时器均不能推进', () => {
      open(first);
      get().setPlaying(true);
      schedulePlayerAdvance(first);
      const delayed = capture();
      window.location.hash = '#/compare';
      delayed();
      assert.equal(get().step, 0);
      syncPlayerRoute('');
      assert.equal(get().playing, false);
      delayed();
      open(first);
      assert.equal(get().step, 0);
      assert.equal(get().playing, false);
    }],
    ['切换算法后旧定时器不能推进新轨迹', () => {
      open(first);
      get().setPlaying(true);
      schedulePlayerAdvance(first);
      const delayed = capture();
      open(second);
      get().setPlaying(true);
      delayed();
      assert.equal(get().slug, second);
      assert.equal(get().step, 0);
    }],
    ['同一算法重新生成后旧定时器不能推进新轨迹', () => {
      open(first);
      get().setPlaying(true);
      schedulePlayerAdvance(first);
      const delayed = capture();
      get().regenerate([-123, 0, 999]);
      get().setPlaying(true);
      delayed();
      assert.equal(get().step, 0);
    }],
    ['完成记录只归属于当前可见且走到末尾的算法', () => {
      open(first);
      get().setStep(get().trace.length - 1);
      assert.equal(completedPlayerSlug(first), first);
      window.location.hash = `#/algo/${second}`;
      assert.equal(completedPlayerSlug(first), undefined);
      assert.equal(completedPlayerSlug(second), undefined);
      syncPlayerRoute(second);
      assert.equal(completedPlayerSlug(second), undefined);
    }],
    ['三类练习的答案对应真实操作，普通算法保留阶段题', () => {
      const stack = practiceQuestions(getAlgorithm(first));
      assert.equal(stack[0].answer, '999');
      assert.equal(stack[0].before.phase, '出栈检查');
      const queue = practiceQuestions(getAlgorithm('queue/circular-queue'));
      assert.equal(queue[0].before.vars.rear, 5);
      assert.equal(queue[0].answer, '0');
      assert.equal(queue[0].after.phase, '取模回绕');
      const reverse = practiceQuestions(getAlgorithm('list/reverse'));
      assert.equal(reverse[0].answer, 'NULL');
      assert.equal(reverse[1].answer, '10');
      assert.equal(reverse[1].before.anchor, 'save');
      assert.equal(reverse[1].after.anchor, 'link');
      const phases = practiceQuestions(getAlgorithm('sort/select-sort'));
      assert.equal(phases[0].answer, phases[0].after.phase);
      for (const question of [...stack, ...queue, ...reverse, ...phases]) {
        assert.equal(question.choices.filter((choice) => choice === question.answer).length, 1);
        assert.equal(new Set(question.choices).size, question.choices.length);
        assert.ok(question.choices.length > 1);
      }
    }],
    ['回放链接覆盖同算法旧进度，并能单步看到答案', () => {
      const task = practiceQuestions(getAlgorithm(first))[0];
      open(first);
      get().regenerate([1, 2, 3]);
      get().setPlaying(true);
      window.location.hash = '#/' + algorithmReplayPath(first, { input: task.input, step: task.step });
      const route = parseHash();
      assert.deepEqual(route.replay, { input: [-123, 0, 999], step: task.step });
      syncPlayerRoute(route.slug, route.replay);
      assert.equal(get().playing, false);
      assert.deepEqual(get().trace[get().step], task.before);
      get().next();
      assert.deepEqual(get().trace[get().step], task.after);
    }],
    ['非法输入和越界步数回到普通算法页', () => {
      for (const replay of [{ input: [1000, 2, 3], step: 1 }, { input: [1, 2, 3], step: 9999 }]) {
        open(second);
        window.location.hash = '#/' + algorithmReplayPath(first, replay);
        const route = parseHash();
        syncPlayerRoute(route.slug, route.replay);
        assert.deepEqual(get().input, getAlgorithm(first).defaultInput);
        assert.equal(get().step, 0);
      }
      window.location.hash = `#/algo/${first}?input=bad&step=-1`;
      assert.deepEqual(parseHash(), { name: 'algo', slug: first });
    }],
  ];

  const errors = [];
  try {
    for (const [name, test] of tests) {
      timers.clear();
      get().load(second);
      try { test(); } catch (error) { errors.push(`算法播放器 / ${name}：${error.message}`); }
    }
  } finally {
    if (windowDescriptor) Object.defineProperty(globalThis, 'window', windowDescriptor);
    else delete globalThis.window;
  }
  if (!errors.length) console.log(`  算法播放器与练习通过：${tests.length} 组换页、练习回放与学习进度用例。`);
  return errors;
}
