import assert from 'node:assert/strict';

export function checkStackQueue(algorithms) {
  const cases = [
    { slug: 'stack/seq-stack', input: [-999, 0, 999],
      add: ['入栈', '待入栈', [-999, 0, 999, 7, 8, 9]],
      remove: ['出栈', '出栈值', [9, 8, 7, 999, 0, -999], 'delete'] },
    { slug: 'stack/linked-stack', input: [-123],
      add: ['表头插入', '数值', [-123, 4, 1]],
      remove: ['取栈顶', '数值', [-123, 1, 4]] },
    { slug: 'stack/linked-stack', input: [-999, 999, 0],
      add: ['表头插入', '数值', [-999, 999, 0, 4, 1]],
      remove: ['取栈顶', '数值', [0, 1, 4, 999, -999]] },
    { slug: 'queue/circular-queue', input: [-123, 0, 999],
      add: ['入队', '待入队', [-123, 0, 999, 2, 6, 66]],
      remove: ['出队', '出队值', [-123, 0, 999, 2, 6, 66]],
      demo: [2, 6, 66] },
    { slug: 'queue/circular-queue', input: [999, 999, -123, 0, -999],
      add: ['入队', '待入队', [999, 999, -123, 0, -999, 66]],
      remove: ['出队', '出队值', [999, 999, -123, 0, -999, 66]],
      demo: [66] },
    { slug: 'queue/linked-queue', input: [-123, 0],
      add: ['入队', '数值', [-123, 0, -123]],
      remove: ['取队头', '数值', [-123, 0]] },
    { slug: 'queue/linked-queue', input: [999, -999, 999],
      add: ['入队', '数值', [999, -999, 999, 999]],
      remove: ['取队头', '数值', [999, -999, 999]] },
  ];

  const errors = [];
  for (const { slug, input, add, remove, demo } of cases) {
    try {
      const trace = algorithms.find((algo) => algo.slug === slug).generate(input);
      const [addPhase, addKey, expectedAdds] = add;
      const [removePhase, removeKey, expectedRemovals, removalState] = remove;
      const added = trace.filter((step) => step.phase === addPhase);
      const removed = trace.filter((step) => step.phase === removePhase &&
        (!removalState || step.scene.nodes.some((node) => node.state === removalState)));
      assert.deepEqual(added.map((step) => Number(step.vars[addKey])), expectedAdds);
      assert.deepEqual(removed.map((step) => Number(step.vars[removeKey])), expectedRemovals);
      for (const step of added) {
        assert.ok(step.scene.nodes.some((node) => node.value === String(step.vars[addKey])), '新增值须出现在舞台');
      }
      for (const step of removed) {
        const item = step.scene.nodes.find((node) => node.state === 'delete');
        assert.equal(item?.value, String(step.vars[removeKey]), '应标出实际取出的结点');
      }
      if (demo) {
        assert.deepEqual(added.filter((step) => step.vars.来源 === '演示补充').map((step) => step.vars[addKey]), demo);
        assert.ok(trace.some((step) => step.phase === '队满判定'));
        assert.ok(trace.some((step) => step.phase === '取模回绕'));
        assert.ok(trace.some((step) => step.phase === '队空判定'));
      }
    } catch (error) { errors.push(`${slug} [${input}]：${error.message}`); }
  }
  if (!errors.length) console.log(`  栈与队列通过：${cases.length} 组输入与进出顺序用例。`);
  return errors;
}
