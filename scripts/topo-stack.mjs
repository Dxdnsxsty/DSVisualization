import assert from 'node:assert/strict';

// 固定预期覆盖分支同时就绪时的后进先出，以及中途和结束时的空栈。
const cases = [
  { n: 3, stack: ['A', '', 'B', 'BC', 'B', '', ''], order: 'ACB' },
  { n: 4, stack: ['A', '', 'B', 'BC', 'B', 'B', '', 'D', '', ''], order: 'ACBD' },
  { n: 5, stack: ['A', '', 'B', 'BC', 'B', 'B', 'BE', 'B', '', 'D', '', ''], order: 'ACEBD' },
  { n: 6, stack: ['A', '', 'B', 'BC', 'B', 'B', 'BE', 'B', 'B', '', 'D', '', 'F', '', ''], order: 'ACEBDF' },
];

export function checkTopoStack(algorithms) {
  const errors = [];
  const algo = algorithms.find(({ slug }) => slug === 'graph/topo-sort');
  for (const { n, stack, order } of cases) {
    try {
      assert.ok(algo, '缺少拓扑排序演示');
      const trace = algo.generate([n]);
      assert.equal(trace.length, stack.length);
      const removed = new Set();
      trace.forEach((step, index) => {
        assert.equal(step.scene.graphTrace, 'topology');
        if (step.anchor === 'dec') {
          const from = step.vars.输出序列.replaceAll(' ', '').at(-1);
          removed.add(`v${from}>v${step.vars.当前顶点}`);
        }
        for (const edge of step.scene.edges) {
          assert.equal(edge.state, removed.has(`${edge.from}>${edge.to}`) ? 'removed' : 'default', `步骤 ${index} 删边状态`);
        }
        const aux = step.scene.aux;
        const expected = stack[index];
        assert.equal(aux?.layout, 'stack', `步骤 ${index} 缺少辅助栈`);
        assert.equal(aux.capacity, n);
        assert.equal(aux.nodes.map(({ value }) => value).join(''), expected, `步骤 ${index} 栈内容`);
        assert.deepEqual(aux.nodes.map(({ id }) => id), [...expected].map((v) => `v${v}`));
        assert.deepEqual(aux.pointers, [{ label: 'top', index: expected.length ? expected.length - 1 : null }]);
        assert.equal(step.vars.栈, [...expected].join(' ') || '空');
        assert.equal(step.vars.栈顶, expected.at(-1) || '空');
        if (expected.length) {
          const inserted = index === 0 || expected.length > stack[index - 1].length;
          assert.equal(aux.nodes.at(-1).state, inserted ? 'insert' : 'active');
        }
      });
      assert.equal(trace.at(-1).vars.输出序列.replaceAll(' ', ''), order);
    } catch (error) {
      errors.push(`拓扑排序辅助栈 n=${n}: ${error.message}`);
    }
  }
  if (!errors.length) console.log('  拓扑排序辅助栈通过：4 组逐步入栈、出栈与栈顶用例。');
  return errors;
}
