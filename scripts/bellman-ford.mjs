import assert from 'node:assert/strict';

export function checkBellmanFordExit(algorithms) {
  const errors = [];
  const algorithm = algorithms.find((item) => item.slug === 'graph/bellman-ford');
  // 手算：第一轮先后更新 D 两次；第二轮均无更新。
  for (const [n, updates, distances, totalSteps] of [
    [3, 2, 'A:0 B:6 C:7', 12],
    [4, 4, 'A:0 B:6 C:7 D:4', 16],
    [5, 5, 'A:0 B:6 C:7 D:4 E:2', 22],
  ]) {
    try {
      assert.ok(algorithm);
      const trace = algorithm.generate([n]);
      assert.equal(trace.length, totalSteps);
      assert.deepEqual(trace.filter((step) => step.anchor === 'round').map((step) => step.vars.轮次), [1, 2]);
      assert.equal(trace.filter((step) => step.phase === '松弛成功').length, updates);
      assert.deepEqual(trace.slice(-3).map((step) => step.anchor), ['quiet', 'check', 'done']);
      const [quiet, check, done] = trace.slice(-3);
      assert.equal(quiet.vars.本轮更新, 0);
      assert.equal(quiet.vars.轮次, 2);
      assert.equal(check.vars.轮次, 2, '额外检测不应冒充新的松弛轮次');
      assert.equal(done.vars.轮次, 2);
      assert.equal(check.vars.负权回路, '检测中');
      assert.equal(done.vars.负权回路, '未检测到可达负权回路');
      for (const step of [quiet, check, done]) {
        assert.equal(step.vars.dist, distances);
        assert.equal(step.vars.累计更新, updates);
      }
      assert.ok(done.caption.includes('共执行 2 轮'));
      assert.ok(!trace.some((step) => step.caption.includes('仍走满')));
      assert.equal(trace[0].vars.dist, Array.from({ length: n }, (_, i) => `${String.fromCharCode(65+i)}:${i ? '∞' : 0}`).join(' '));
    } catch (error) { errors.push(`Bellman-Ford 提前退出 n=${n}: ${error.message}`); }
  }
  if (!errors.length) console.log('  Bellman-Ford 提前退出通过：3 组轮数、收敛、额外检测与终态用例。');
  return errors;
}
