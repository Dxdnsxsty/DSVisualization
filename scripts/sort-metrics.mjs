/** 手算小序列的操作次数，验证累计快照与结果；由 npm run validate 执行。 */
export function checkSortMetrics(algorithms) {
  const errors = [];
  // 每个三元组依次为比较、交换、数组写入次数。
  const cases = [
    { name: '有序', input: [1, 2, 3], expected: [[2, 0, 2], [2, 0, 0], [3, 0, 2], [3, 0, 2], [2, 0, 2], [3, 0, 0], [3, 4, 8], [3, 0, 10], [0, 0, 6]], aux: 5 },
    { name: '逆序', input: [3, 2, 1], expected: [[3, 0, 5], [3, 3, 6], [3, 0, 3], [2, 0, 5], [3, 0, 5], [3, 1, 2], [3, 3, 6], [2, 0, 10], [0, 0, 6]], aux: 5 },
    { name: '全相等', input: [2, 2, 2], expected: [[2, 0, 2], [2, 0, 0], [3, 0, 2], [3, 0, 2], [2, 0, 2], [3, 0, 0], [3, 2, 4], [3, 0, 10], [0, 0, 6]], aux: 5 },
    { name: '重复值', input: [2, 1, 2], expected: [[2, 0, 3], [3, 1, 2], [2, 0, 2], [3, 0, 3], [2, 0, 3], [3, 1, 2], [3, 2, 4], [3, 0, 10], [0, 0, 6]], aux: 5 },
    { name: '负数与零', input: [0, -1, 0], expected: [[2, 0, 3], [3, 1, 2], [2, 0, 2], [3, 0, 3], [2, 0, 3], [3, 1, 2], [3, 2, 4], [3, 0, 10], null], aux: 5 },
    { name: '双向填坑', input: [2, 3, 1], expected: [[3, 0, 4], [3, 2, 4], [2, 0, 3], [2, 0, 4], [3, 0, 4], [3, 2, 4], [3, 4, 8], [2, 0, 10], [0, 0, 6]], aux: 5 },
    { name: '最短逆序', input: [2, 1], expected: [[1, 0, 2], [1, 1, 2], [1, 0, 2], [1, 0, 2], [1, 0, 2], [1, 1, 2], [1, 1, 2], [1, 0, 4], [0, 0, 4]], aux: 2 },
    { name: '全零', input: [0, 0], expected: [[1, 0, 1], [1, 0, 0], [1, 0, 1], [1, 0, 1], [1, 0, 1], [1, 0, 0], [1, 1, 2], [1, 0, 4], [0, 0, 4]], aux: 2 },
    { name: '两位数', input: [10, 1, 10], expected: [null, null, null, null, null, null, null, null, [0, 0, 12]] },
    { name: '三位数', input: [999, 0, 100], expected: [null, null, null, null, null, null, null, null, [0, 0, 18]] },
    // d=2 后 d=1，验证希尔排序不止一趟的累计值。
    { name: '多增量逆序', input: [4, 3, 2, 1], expected: [null, null, null, null, [6, 0, 9], null, null, null, null] },
    { name: '堆多层下沉', input: [1, 2, 3, 4], expected: [null, null, null, null, null, null, [7, 8, 16], [4, 0, 16], null], aux: 8 },
  ];
  const slugs = ['sort/insert-sort', 'sort/bubble-sort', 'sort/quick-sort', 'sort/binary-insert', 'sort/shell-sort', 'sort/select-sort', 'sort/heap-sort', 'sort/merge-sort', 'sort/radix-sort'];
  const fields = ['comparisons', 'swaps', 'writes'];
  let count = 0;
  for (const [index, slug] of slugs.entries()) {
    const algo = algorithms.find((item) => item.slug === slug);
    if (!algo) { errors.push(`操作统计：缺少 ${slug}`); continue; }
    for (const fixture of cases) {
      if (!fixture.expected[index]) continue;
      count++;
      const fail = (message) => errors.push(`${slug} / ${fixture.name}：${message}`);
      const trace = algo.generate(Object.freeze([...fixture.input]));
      const snapshots = new Set();
      let previous = { comparisons: 0, swaps: 0, writes: 0, auxiliaryWrites: 0 };
      for (const step of trace) {
        if (!step.metrics) { fail(`第 ${step.id} 步缺少统计`); continue; }
        if (snapshots.has(step.metrics)) fail('累计统计复用了可变对象');
        snapshots.add(step.metrics);
        for (const field of fields) {
          const value = step.metrics[field];
          if (!Number.isSafeInteger(value) || value < previous[field]) fail(`第 ${step.id} 步 ${field} 不是单调非负整数`);
        }
        const aux = step.metrics.auxiliaryWrites ?? 0;
        const previousAux = previous.auxiliaryWrites ?? 0;
        if (!Number.isSafeInteger(aux) || aux < previousAux || aux > step.metrics.writes) fail(`第 ${step.id} 步辅助写入非法`);
        if (step.metrics.writes - aux < previous.writes - previousAux) fail(`第 ${step.id} 步原数组写入减少`);
        previous = step.metrics;
      }
      const got = fields.map((field) => trace.at(-1).metrics?.[field]);
      if (JSON.stringify(got) !== JSON.stringify(fixture.expected[index])) {
        fail(`统计 ${JSON.stringify(got)} ≠ 手算结果 ${JSON.stringify(fixture.expected[index])}`);
      }
      if (fields.some((field) => trace[0].metrics?.[field] !== 0)) fail('初始计数应为 0');
      const expectedAux = slug === 'sort/merge-sort' ? fixture.aux : slug === 'sort/radix-sort' ? fixture.expected[index][2] / 2 : 0;
      if ((trace.at(-1).metrics?.auxiliaryWrites ?? 0) !== expectedAux) fail('辅助写入次数不符合手算结果');
      const sorted = [...fixture.input].sort((a, b) => a - b);
      const actual = trace.at(-1).scene.nodes.map((node) => Number(node.value));
      if (JSON.stringify(actual) !== JSON.stringify(sorted)) fail('终态排序结果错误');
    }
  }
  if (!errors.length) console.log(`  操作统计通过：${slugs.length} 个算法，${count} 组固定用例。`);
  return errors;
}
