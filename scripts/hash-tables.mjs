import assert from 'node:assert/strict';

const remainder = (key, size) => key - size * Math.floor(key / size);

function snapshotReader(trace) {
  let cursor = 0;
  return {
    take(anchor, key, address, pointer, size, values) {
      const step = trace[cursor++];
      const at = '第 ' + cursor + ' 步 (' + anchor + ') ';
      assert.equal(step?.anchor, anchor, at + '步骤顺序不符');
      const { scene, vars } = step;
      assert.equal(vars.关键字, key, at + '处理了错误的关键字');
      assert.equal(vars.散列地址, address, at + '初始散列地址不符');
      assert.deepEqual(scene.pointers ?? [], pointer === null ? [] : [{ label: 'p', index: pointer }], at + '指针位置不符');
      assert.equal(scene.cols, size, at + '表长不符');
      assert.deepEqual(scene.nodes.map(({ value }) => value), values, at + '槽位或桶头快照不符');
      return { scene, vars, at };
    },
    peek: () => trace[cursor],
    finish: () => assert.equal(cursor, trace.length, '存在未预期的步骤'),
  };
}

function checkLinear(input, trace) {
  const size = 11;
  const keys = input.slice(0, -1);
  const target = input.at(-1);
  const table = Array(size).fill(null);
  const reader = snapshotReader(trace);
  const slotsFrom = (key) => {
    const slots = table.map((_, slot) => slot);
    const start = remainder(key, size);
    return [...slots.slice(start), ...slots.slice(0, start)];
  };
  const take = (anchor, key, position, count, highlight) => {
    const { scene, vars, at } = reader.take(anchor, key ?? '—', key === null ? '—' : remainder(key, size), position,
      size, table.map((value) => value === null ? '' : String(value)));
    assert.equal(vars.探测次数, count, at + '探测次数不符');
    assert.equal(vars.已存元素, table.filter((value) => value !== null).length, at + '已存元素数不符');
    if (highlight) assert.equal(scene.nodes[position].state, highlight, at + '高亮了错误的槽位');
  };

  take('build', null, null, 0);
  for (const key of keys) {
    const slots = slotsFrom(key);
    const free = slots.findIndex((slot) => table[slot] === null);
    assert.ok(free >= 0, '输入超出表容量');
    take('hash', key, slots[0], 0);
    for (const [index, position] of slots.slice(0, free).entries()) {
      take('cmp', key, position, index + 1, 'compare');
      take('probe', key, slots[index + 1], index + 1);
    }
    table[slots[free]] = key;
    take('place', key, slots[free], free, 'insert');
  }

  const search = (key) => {
    const slots = slotsFrom(key);
    const stop = slots.findIndex((slot) => table[slot] === null || table[slot] === key);
    const compared = stop < 0 ? size : stop;
    take('shash', key, slots[0], 0);
    for (const [index, position] of slots.slice(0, compared).entries()) {
      take('scmp', key, position, index + 1, 'compare');
      take('sprobe', key, slots[(index + 1) % size], index + 1);
    }
    if (stop >= 0 && table[slots[stop]] === key) {
      take('scmp', key, slots[stop], stop + 1, 'found');
      take('found', key, slots[stop], stop + 1, 'found');
    } else {
      take('fail', key, slots[stop < 0 ? 0 : stop], compared);
    }
  };
  search(target);
  const contrast = reader.peek()?.vars.关键字;
  assert.ok(Number.isInteger(contrast), '须提供补充查找示例');
  assert.notEqual(keys.includes(contrast), keys.includes(target), '补充示例须给出与输入目标相反的查找结果');
  if (keys.includes(target)) assert.equal(remainder(contrast, size), remainder(target, size), '补充失败示例须从同一散列地址开始');
  search(contrast);
  reader.finish();
}

function checkChain(input, trace) {
  const size = 7;
  const keys = input.slice(0, -1);
  const target = input.at(-1);
  const buckets = Array.from({ length: size }, () => []);
  const reader = snapshotReader(trace);
  const take = (anchor, key, count, activeIndex, highlight) => {
    const address = key === null ? 0 : remainder(key, size);
    const chain = buckets[address];
    const { scene, vars, at } = reader.take(anchor, key ?? '—', key === null ? '—' : address, key === null ? null : address,
      size, buckets.map((items) => items.length ? String(items[0]) : '∧'));
    assert.equal(vars.比较次数, count, at + '比较次数不符');
    assert.equal(vars.桶内长度, chain.length, at + '桶内长度不符');
    assert.equal(vars.已存元素, buckets.flat().length, at + '已存元素数不符');
    assert.deepEqual(scene.aux?.nodes.map(({ value }) => value), [...chain.map(String), '∧'], at + '链顺序或链尾不符');
    if (highlight) {
      const actual = scene.aux.nodes.flatMap((node, i) => node.state === highlight ? [i] : []);
      assert.deepEqual(actual, [activeIndex], at + '沿链访问的结点不符');
    }
  };

  take('init', null, 0);
  for (const key of keys) {
    const chain = buckets[remainder(key, size)];
    take('hash', key, 0);
    const oldLength = chain.length;
    for (let i = 0; i < oldLength; i++) take('cmp', key, i + 1, i, 'compare');
    chain.push(key);
    if (oldLength) take('append', key, oldLength, oldLength, 'insert');
    else take('insert', key, 0);
  }
  const chain = buckets[remainder(target, size)];
  const match = chain.indexOf(target);
  take('shash', target, 0);
  for (let i = 0; i < (match < 0 ? chain.length : match); i++) take('scmp', target, i + 1, i, 'compare');
  if (match < 0) take('fail', target, chain.length);
  else take('found', target, match + 1, match, 'found');
  reader.finish();
}

export function checkHashTables(algorithms) {
  const suites = [
    ['search/hash-linear', checkLinear, [
      [10, 21, 32, 32], [-1, 10, 0, 21, -12], [0, 0],
      [...Array.from({ length: 11 }, (_, i) => -1 + 11 * i), 120], [999, -999, 0, -999, -999],
    ]],
    ['search/hash-chain', checkChain, [
      [15, 22, 8, 22], [-1, 6, 13, -8, -8], [0, 1], [0, 0],
      [1, 8, 1, 15, 22], [...Array.from({ length: 13 }, (_, i) => i * 7), 84],
    ]],
  ];
  const errors = [];
  let count = 0;
  for (const [slug, check, cases] of suites) {
    const algorithm = algorithms.find((item) => item.slug === slug);
    for (const input of cases) {
      count++;
      try {
        assert.ok(algorithm, '算法未注册');
        check(input, algorithm.generate(input));
      } catch (error) { errors.push(slug + ' [' + input.join(', ') + ']：' + error.message); }
    }
  }
  if (!errors.length) console.log('  哈希表通过：' + count + ' 组探测、插入与查找用例。');
  return errors;
}
