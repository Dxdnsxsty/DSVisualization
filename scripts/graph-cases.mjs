import assert from 'node:assert/strict';

const weighted = [[0, 1, 2], [0, 2, 5], [1, 2, 2], [1, 3, 6], [2, 3, 2], [2, 4, 7], [3, 4, 1], [3, 5, 4], [4, 5, 3]];

function checkDijkstra(trace, n, scenario) {
  const edges = weighted.filter(([a, b]) => a < n && b < n && (!scenario || b !== n - 1));
  // 用 Bellman-Ford 独立求最短距离，不读取被测轨迹的边或前驱。
  const expected = Array(n).fill(Infinity);
  expected[0] = 0;
  for (let pass = 1; pass < n; pass++) for (const [a, b, w] of edges) expected[b] = Math.min(expected[b], expected[a] + w);
  let previous;
  for (const [index, step] of trace.entries()) {
    const table = step.scene.shortestPath;
    assert.equal(table.source, 'vA');
    assert.equal(table.complete, index === trace.length - 1);
    assert.equal(table.rows.length, n);
    const changed = table.rows.filter((row) => row.changed);
    assert.equal(changed.length, ['init', 'update'].includes(step.anchor) ? 1 : 0);
    for (const [i, row] of table.rows.entries()) {
      assert.equal(row.id, `v${String.fromCharCode(65 + i)}`);
      assert.equal(row.vertex, String.fromCharCode(65 + i));
      if (row.distance === null) {
        assert.equal(row.predecessor, null);
        assert.equal(row.settled, false);
        assert.deepEqual(row.path, []);
      } else {
        assert.equal(row.path[0], 'vA');
        assert.equal(row.path.at(-1), row.id);
        assert.equal(new Set(row.path).size, row.path.length);
        let sum = 0;
        for (let j = 1; j < row.path.length; j++) {
          const a = row.path[j - 1].charCodeAt(1) - 65;
          const b = row.path[j].charCodeAt(1) - 65;
          const edge = edges.find(([from, to]) => a === from && b === to);
          assert.ok(edge, '路径包含不存在的有向边');
          sum += edge[2];
        }
        assert.equal(sum, row.distance);
        assert.equal(row.predecessor, i === 0 ? null : row.path.at(-2).slice(1));
        if (row.settled) assert.equal(row.distance, expected[i]);
      }
      if (previous) {
        assert.ok((row.distance ?? Infinity) <= (previous[i].distance ?? Infinity));
        if (row.changed) {
          assert.equal(step.anchor, 'update');
          assert.ok(row.distance < (previous[i].distance ?? Infinity));
          assert.equal(row.predecessor, step.vars.本轮顶点);
        } else assert.equal(row.distance, previous[i].distance);
      }
    }
    if (step.anchor === 'pick') {
      const candidates = previous.filter((row) => !row.settled).map((row) => row.distance ?? Infinity);
      const picked = table.rows.find((row) => row.vertex === step.vars.本轮顶点);
      assert.equal(picked.distance, Math.min(...candidates));
      assert.equal(picked.settled, true);
    }
    previous = table.rows;
  }
  assert.deepEqual(previous.map((row) => row.distance ?? Infinity), expected);
  assert.equal(trace.some((step) => step.anchor === 'unreachable'), Boolean(scenario));
}

function checkCycle(trace, n) {
  const edges = ['AB', 'AC', 'BD', 'CD', 'CE', 'DF', 'EF', 'BC', 'CB'].filter((pair) => [...pair].every((v) => v.charCodeAt(0) < 65 + n));
  const removed = new Set();
  const output = [];
  let previousStack = [];
  for (const step of trace) {
    if (step.anchor === 'pop') output.push(previousStack.at(-1));
    if (step.anchor === 'dec') removed.add(output.at(-1) + step.vars.当前顶点);
    assert.deepEqual(step.scene.output.values, output);
    for (const row of step.scene.nodes) {
      const degree = edges.filter(([a, b]) => b === row.value && !removed.has(a + b)).length;
      assert.equal(row.label, `入度 ${degree}`);
    }
    previousStack = step.scene.aux.nodes.map((row) => row.value);
    assert.ok(previousStack.every((v) => !output.includes(v)));
  }
  assert.deepEqual(output, ['A']);
  assert.deepEqual(previousStack, []);
  assert.equal(trace.at(-1).anchor, 'cycle');
  assert.ok(trace.at(-1).caption.includes('存在环'));
}

export function checkGraphCases(algorithms) {
  const errors = [];
  for (const n of [3, 4, 5, 6]) {
    for (const scenario of [0, 1]) {
      try { checkDijkstra(algorithms.find((a) => a.slug === 'graph/dijkstra').generate([n, scenario]), n, scenario); }
      catch (error) { errors.push(`Dijkstra [${n}, ${scenario}]: ${error.message}`); }
    }
    try { checkCycle(algorithms.find((a) => a.slug === 'graph/topo-sort').generate([n, 1]), n); }
    catch (error) { errors.push(`拓扑排序有环 [${n}]: ${error.message}`); }
  }
  if (!errors.length) console.log('  图案例通过：8 组 Dijkstra 距离、前驱、路径与不可达快照；4 组拓扑排序有环用例。');
  return errors;
}
