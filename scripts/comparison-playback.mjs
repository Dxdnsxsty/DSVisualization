import assert from 'node:assert/strict';
import { build } from 'esbuild';

/** 检查不同长度轨迹、独立拖动、暂停后的时钟事件与重播边界。 */
export async function checkComparisonPlayback() {
  const result = await build({ entryPoints: ['src/engine/compare-player.ts'], bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'silent' });
  const { createComparisonPlayback: create, comparisonReducer: reduce, comparisonFinished: finished } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
  const tests = [
    ['初始位置与边界', () => {
      assert.deepEqual(create([2, 4]), { steps: [0, 0], last: [1, 3], playing: false, speed: 1 });
    }],
    ['短侧结束后长侧继续，全部结束时停止', () => {
      let state = reduce(create([2, 4]), { type: 'toggle' });
      for (const expected of [[1, 1], [1, 2], [1, 3]]) {
        state = reduce(state, { type: 'tick' });
        assert.deepEqual(state.steps, expected);
        assert.equal(state.playing, expected[1] < 3);
      }
      assert.equal(finished(state), true);
    }],
    ['暂停后忽略遗留时钟事件', () => {
      let state = reduce(create([2, 4]), { type: 'toggle' });
      state = reduce(state, { type: 'pause' });
      assert.deepEqual(reduce(state, { type: 'tick' }), state);
    }],
    ['再次点击播放按钮暂停', () => {
      const state = reduce(reduce(create([3, 3]), { type: 'toggle' }), { type: 'toggle' });
      assert.equal(state.playing, false);
      assert.deepEqual(state.steps, [0, 0]);
    }],
    ['手动拖动仅改变一侧并暂停，再从当前位置播放', () => {
      let state = reduce(create([5, 8]), { type: 'toggle' });
      state = reduce(state, { type: 'seek', side: 1, step: 4 });
      assert.deepEqual(state.steps, [0, 4]);
      assert.equal(state.playing, false);
      state = reduce(reduce(state, { type: 'toggle' }), { type: 'tick' });
      assert.deepEqual(state.steps, [1, 5]);
    }],
    ['前后单步暂停，始末位置不越界', () => {
      let state = reduce(create([2, 4]), { type: 'prev' });
      assert.deepEqual(state.steps, [0, 0]);
      state = reduce(reduce(state, { type: 'toggle' }), { type: 'next' });
      assert.deepEqual(state.steps, [1, 1]);
      assert.equal(state.playing, false);
      for (let i = 0; i < 6; i++) state = reduce(state, { type: 'next' });
      assert.deepEqual(state.steps, [1, 3]);
      state = reduce(state, { type: 'prev' });
      assert.deepEqual(state.steps, [0, 2]);
    }],
    ['结束后重新播放从两侧开头开始', () => {
      let state = create([2, 2]);
      state = reduce(state, { type: 'next' });
      state = reduce(state, { type: 'toggle' });
      assert.deepEqual(state.steps, [0, 0]);
      assert.equal(state.playing, true);
    }],
    ['重置清空位置和播放状态，保留当前速度', () => {
      let state = reduce(create([5, 5]), { type: 'speed', speed: 4 });
      state = reduce(reduce(state, { type: 'toggle' }), { type: 'tick' });
      state = reduce(state, { type: 'reset' });
      assert.deepEqual(state.steps, [0, 0]);
      assert.equal(state.playing, false);
      assert.equal(state.speed, 4);
    }],
    ['调速保留播放位置与播放状态', () => {
      const state = reduce(reduce(create([5, 5]), { type: 'toggle' }), { type: 'tick' });
      for (const speed of [0.5, 1, 2, 4]) {
        const next = reduce(state, { type: 'speed', speed });
        assert.deepEqual(next.steps, [1, 1]);
        assert.equal(next.playing, true);
        assert.equal(next.speed, speed);
      }
      assert.deepEqual(reduce(state, { type: 'speed', speed: 0 }), state);
    }],
    ['单侧已结束或没有后续步骤时仍可推进另一侧', () => {
      let state = reduce(create([1, 3]), { type: 'toggle' });
      state = reduce(state, { type: 'tick' });
      assert.deepEqual(state.steps, [0, 1]);
      assert.equal(state.playing, true);
      assert.equal(reduce(create([1, 1]), { type: 'toggle' }).playing, false);
    }],
    ['拖动边界限制与不可用值', () => {
      const state = create([3, 4]);
      assert.deepEqual(reduce(state, { type: 'seek', side: 0, step: 99 }).steps, [2, 0]);
      assert.deepEqual(reduce(state, { type: 'seek', side: 1, step: -5 }).steps, [0, 0]);
      assert.deepEqual(reduce(state, { type: 'seek', side: 0, step: NaN }), state);
    }],
  ];
  const errors = [];
  for (const [name, test] of tests) {
    try { test(); } catch (error) { errors.push(`同步播放 / ${name}：${error.message}`); }
  }
  if (!errors.length) console.log(`  同步播放通过：${tests.length} 组状态转换用例。`);
  return errors;
}
