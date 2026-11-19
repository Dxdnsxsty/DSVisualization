import assert from 'node:assert/strict';

// 参考遍历使用固定示例图，不从被测轨迹读取边。
const examples = {
  dfs: ['AB', 'AC', 'BD', 'BE', 'CF', 'EF'],
  bfs: ['AB', 'AC', 'BD', 'BE', 'CE', 'CF', 'EF'],
};

function reference(kind, vertices, connections) {
  const neighbors = new Map(vertices.map((vertex) => [vertex, []]));
  for (const [a, b] of connections) {
    neighbors.get(a).push(b);
    neighbors.get(b).push(a);
  }
  for (const row of neighbors.values()) row.sort();
  const order = [];
  const discovery = [];
  if (kind === 'dfs') {
    const stack = [[null, 'A']];
    const seen = new Set();
    while (stack.length) {
      const [from, vertex] = stack.pop();
      if (seen.has(vertex)) continue;
      seen.add(vertex);
      order.push(vertex);
      if (from !== null) discovery.push(from + '>' + vertex);
      for (const next of neighbors.get(vertex).slice().reverse()) stack.push([vertex, next]);
    }
  } else {
    const seen = new Set(['A']);
    let layer = ['A'];
    while (layer.length) {
      order.push(...layer);
      const nextLayer = [];
      for (const vertex of layer) {
        for (const next of neighbors.get(vertex)) {
          if (seen.has(next)) continue;
          seen.add(next);
          discovery.push(vertex + '>' + next);
          nextLayer.push(next);
        }
      }
      layer = nextLayer;
    }
  }
  return { order, discovery };
}

function checkTrace(trace, kind, vertices, connections) {
  const expected = reference(kind, vertices, connections);
  const dfs = kind === 'dfs';
  const visited = [];
  const marked = new Set(dfs ? [] : ['A']);
  const discovered = [];
  const pending = dfs ? [] : ['A'];
  const currentLabel = (vertex) => dfs ? 'DFS(' + vertex + ')' : vertex;
  for (const [i, { anchor, scene, vars, callStack }] of trace.entries()) {
    const at = '第 ' + (i + 1) + ' 步 (' + anchor + ') ';
    assert.equal(scene.graphTrace, 'traversal', at + '应使用遍历路径样式');
    assert.deepEqual(scene.nodes.map(({ value }) => value).sort(), vertices, at + '顶点集合不符');
    if (anchor === 'visit') {
      const vertex = expected.order[visited.length];
      assert.ok(vertex, at + '多出访问步骤');
      assert.equal(vars.当前顶点, currentLabel(vertex), at + '访问顺序不符');
      visited.push(vertex);
      if (dfs) pending.push(vertex);
    }
    if (dfs && anchor === 'mark') {
      const vertex = visited.at(-1);
      assert.equal(vars.当前顶点, currentLabel(vertex), at + '标记了错误的顶点');
      assert.ok(vertex && !marked.has(vertex), at + '重复或提前标记');
      marked.add(vertex);
    }
    if (anchor === (dfs ? 'recurse' : 'enqueue')) {
      const path = expected.discovery[discovered.length];
      assert.ok(path, at + '多出发现边');
      const [from, to] = path.split('>');
      assert.equal(vars.当前顶点, currentLabel(from), at + '发现边起点不符');
      assert.ok(marked.has(from) && !marked.has(to), at + '发现边必须由已标记顶点指向新顶点');
      discovered.push(path);
      if (!dfs) marked.add(to);
      if (!dfs) pending.push(to);
    }

    if (dfs && anchor === 'ret') pending.pop();
    if (!dfs && anchor === 'dequeue') assert.equal(pending.shift(), vars.当前顶点, at + '队头出队不符');
    const aux = scene.aux;
    assert.equal(aux?.layout, dfs ? 'call-stack' : 'queue', at + '缺少可视辅助结构');
    assert.deepEqual(aux.nodes.map(({ value }) => value), pending.map(currentLabel), at + '辅助结构内容不符');
    assert.deepEqual(aux.nodes.map(({ id }) => id), pending.map((v) => `v${v}`), at + '辅助结构与图顶点不对应');
    if (dfs) {
      assert.equal(aux.capacity, vertices.length, at + '调用栈容量不符');
      assert.deepEqual(aux.pointers, [{ label: 'top', index: pending.length ? pending.length - 1 : null }], at + '当前调用指针不符');
      assert.deepEqual(callStack ?? [], pending.map(currentLabel), at + '调用栈面板与舞台不同步');
    }

    const values = new Map(scene.nodes.map(({ id, value }) => [id, value]));
    const graphEdges = [];
    const arrows = [];
    for (const edge of scene.edges) {
      const from = values.get(edge.from);
      const to = values.get(edge.to);
      assert.ok(from && to, at + '边引用不存在的顶点');
      assert.ok(!edge.bidirectional, at + '发现边只能有一个方向');
      graphEdges.push([from, to].sort().join(''));
      if (edge.directed) {
        assert.equal(edge.state, 'tree', at + '发现箭头应保持遍历树样式');
        arrows.push(from + '>' + to);
      } else {
        assert.notEqual(edge.state, 'tree', at + '已发现的边缺少方向箭头');
      }
    }
    assert.deepEqual(graphEdges.sort(), [...connections].sort(), at + '原图的边缺失或重复');
    assert.deepEqual(arrows.sort(), [...discovered].sort(), at + '发现边方向、出现时机或保留状态不符');
    assert.deepEqual(scene.nodes.filter(({ state }) => state === 'visited').map(({ value }) => value).sort(),
      [...marked].sort(), at + '已访问着色不符');
    if (!dfs) assert.equal(vars.遍历序列, visited.join('') || '空', at + '广度优先序列显示不符');
  }
  assert.deepEqual(visited, expected.order, '访问序列不完整');
  assert.deepEqual(discovered, expected.discovery, '发现边序列不完整');
  assert.deepEqual([...marked].sort(), [...expected.order].sort(), '标记的顶点不完整');
}

export function checkGraphTraversal(algorithms) {
  const errors = [];
  const sizes = [3, 4, 5, 6];
  for (const [kind, example] of Object.entries(examples)) {
    const slug = 'graph/' + kind;
    for (const n of sizes) {
      const vertices = [...'ABCDEF'].slice(0, n);
      const connections = example.filter(([a, b]) => vertices.includes(a) && vertices.includes(b));
      try {
        const algorithm = algorithms.find((item) => item.slug === slug);
        assert.ok(algorithm, '算法未注册');
        checkTrace(algorithm.generate([n]), kind, vertices, connections);
      } catch (error) { errors.push(slug + ' [' + n + ']：' + error.message); }
    }
  }
  if (!errors.length) console.log('  图遍历通过：DFS / BFS 共 ' + (2 * sizes.length) + ' 组访问顺序、发现边与辅助栈／队列用例。');
  return errors;
}
