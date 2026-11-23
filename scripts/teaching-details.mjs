import assert from 'node:assert/strict';

const mstEdges = [[0,1,6],[0,2,1],[0,3,5],[1,2,5],[1,4,3],[2,3,5],[2,4,6],[2,5,4],[3,5,2],[4,5,6]];
const letter = (i) => String.fromCharCode(65 + i);
const value = (text) => text === '∞' ? Infinity : Number(text);

function checkFloyd(algo, n) {
  const trace = algo.generate([n]);
  let previous;
  for (const step of trace) {
    const matrix = step.scene.distanceMatrix;
    assert.equal(matrix.values.length, n);
    assert.ok(matrix.values.every((row) => row.length === n));
    assert.equal(matrix.updated, step.anchor === 'update');
    const { i, j, k } = matrix;
    if (['update', 'cmp'].includes(step.anchor)) {
      assert.ok([i,j,k].every((index) => index >= 0 && index < n));
      const sum = value(previous[i][k]) + value(previous[k][j]);
      assert.equal(value(matrix.values[i][j]), Math.min(value(previous[i][j]), sum));
      assert.equal(matrix.updated, sum < value(previous[i][j]));
    }
    if (previous) for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (matrix.updated && r === i && c === j) continue;
      assert.equal(matrix.values[r][c], previous[r][c], '非目标单元格被修改');
    }
    previous = matrix.values;
  }
  assert.deepEqual(trace[0].scene.distanceMatrix.values.map((row, i) => row[i]), Array(n).fill('0'));
  assert.notDeepEqual(trace[0].scene.distanceMatrix.values, previous, '初始矩阵快照被末态覆盖');
}

function checkPrim(algo, n) {
  const edges = mstEdges.filter(([a,b]) => a < n && b < n);
  let before;
  for (const step of algo.generate([n])) {
    const selected = new Set(['A']);
    const names = new Map(step.scene.nodes.map((node) => [node.id, node.value]));
    for (const edge of step.scene.edges.filter((edge) => edge.state === 'tree')) {
      selected.add(names.get(edge.from)); selected.add(names.get(edge.to));
    }
    const expected = Array.from({length:n}, (_, i) => {
      const candidates = edges.filter(([a,b]) => (b === i && selected.has(letter(a))) || (a === i && selected.has(letter(b))));
      const best = selected.has(letter(i)) ? 0 : Math.min(...candidates.map((edge) => edge[2]));
      return best;
    });
    const rows = step.scene.primTable;
    assert.equal(rows.length, n);
    rows.forEach((row, i) => {
      assert.equal(row.vertex, letter(i));
      assert.equal(row.selected, selected.has(row.vertex));
      assert.equal(row.lowcost ?? Infinity, expected[i]);
      if (row.selected || row.lowcost === null) assert.equal(row.candidate, null);
      else {
        assert.ok(selected.has(row.candidate));
        assert.ok(edges.some(([a,b,w]) => w === row.lowcost && ((letter(a) === row.vertex && letter(b) === row.candidate) || (letter(b) === row.vertex && letter(a) === row.candidate))));
      }
      if (step.anchor === 'update') assert.equal(row.changed, !row.selected && (row.lowcost !== before[i].lowcost || row.candidate !== before[i].candidate));
      else assert.equal(row.changed, false);
    });
    if (step.anchor === 'scan') before = rows;
  }
}

function checkKruskal(algo, n) {
  let previous;
  const trace = algo.generate([n]);
  for (const step of trace) {
    const data = step.scene.disjointSet;
    const parent = new Map(data.parents.map((row) => [row.vertex, row.parent]));
    const root = (v) => {
      const seen = new Set();
      while (parent.get(v) !== v) { assert.ok(!seen.has(v), '父指针成环'); seen.add(v); v = parent.get(v); assert.ok(v); }
      return v;
    };
    const chosen = step.scene.edges.filter((edge) => edge.state === 'tree');
    const names = new Map(step.scene.nodes.map((node) => [node.id, node.value]));
    const links = new Map(step.scene.nodes.map((node) => [node.value, new Set([node.value])]));
    for (const edge of chosen) {
      const merged = new Set([...links.get(names.get(edge.from)), ...links.get(names.get(edge.to))]);
      for (const v of merged) links.set(v, merged);
    }
    assert.equal(data.parents.length, n);
    const covered = [];
    for (const group of data.groups) {
      assert.equal(root(group.root), group.root);
      assert.deepEqual([...group.members].sort(), [...links.get(group.root)].sort());
      for (const v of group.members) { assert.equal(root(v), group.root); covered.push(v); }
    }
    assert.deepEqual(covered.sort(), Array.from({length:n}, (_,i) => letter(i)));
    assert.equal(data.groups.length, n - chosen.length);
    if (data.current) {
      const { action, roots, from, to } = data.current;
      assert.equal(action, step.anchor);
      if (action === 'union') { assert.notEqual(roots[0], roots[1]); assert.equal(root(from), root(to)); }
      if (action === 'reject') { assert.equal(roots[0], roots[1]); assert.equal(root(from), root(to)); assert.deepEqual(data.groups, previous.groups); }
    }
    previous = data;
  }
  assert.equal(previous.groups.length, 1);
  assert.equal(trace[0].scene.disjointSet.groups.length, n);
}

function checkTree(algo, input, order) {
  const expected = [];
  const stack = [];
  const seq = [];
  const record = (anchor) => expected.push({ anchor, stack:[...stack], seq:[...seq] });
  record('build');
  const walk = (index) => {
    stack.push(index);
    const visit = () => { seq.push(String(input[index])); record('visit'); };
    if (order === 'preorder') visit();
    record('left'); if (2*index+1 < input.length) walk(2*index+1);
    if (order === 'inorder') visit();
    record('right'); if (2*index+2 < input.length) walk(2*index+2);
    if (order === 'postorder') visit();
    stack.pop(); record('ret');
  };
  walk(0);
  const trace = algo.generate(input);
  assert.equal(trace.length, expected.length);
  trace.forEach((step, index) => {
    const want = expected[index];
    assert.equal(step.anchor, want.anchor);
    assert.deepEqual(step.scene.aux.nodes.map((node) => node.id), want.stack.map((i) => `n${i}`));
    assert.deepEqual(step.scene.aux.nodes.map((node) => node.value), step.callStack ?? []);
    assert.equal(step.scene.aux.capacity, Math.floor(Math.log2(input.length))+1);
    assert.deepEqual(step.scene.aux.pointers, [{label:'top',index:want.stack.length ? want.stack.length-1 : null}]);
    assert.deepEqual(step.scene.output.values, want.seq);
  });
}

export function checkTeachingDetails(algorithms) {
  const errors = [];
  let count = 0;
  const run = (name, action) => { count++; try { action(); } catch (error) { errors.push(`${name}: ${error.message}`); } };
  const get = (slug) => algorithms.find((a) => a.slug === slug);
  for (const n of [4,5]) run(`Floyd 完整矩阵 ${n}`, () => checkFloyd(get('graph/floyd'), n));
  for (const n of [3,4,5,6]) {
    run(`Prim 候选表 ${n}`, () => checkPrim(get('graph/prim'), n));
    run(`Kruskal 分组 ${n}`, () => checkKruskal(get('graph/kruskal'), n));
  }
  for (const order of ['preorder','inorder','postorder']) for (const input of [[2,1],[1,2,3,4,5,6,7],Array.from({length:15},(_,i)=>i-7),[8,8,-3,0,8]]) {
    run(`树 ${order} ${input.join(',')}`, () => checkTree(get(`tree/${order}`), input, order));
  }
  if (!errors.length) console.log(`  教学面板通过：${count} 组完整矩阵、Prim 候选表、Kruskal 分组和树调用栈／访问序列用例。`);
  return errors;
}
