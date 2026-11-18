import assert from 'node:assert/strict';

const chain = (ids, field = 'next') => ids.map((id, i) => [id, field, ids[i + (field === 'next' ? 1 : -1)] ?? null]);
const frame = (anchor, ids, pointers, links, circular = false) => ({ anchor, ids, pointers, links, circular });
const kids = (input, prefix) => input.map((_, i) => `${prefix}${i}`);

function buildFrames(input, tail, sentinel) {
  const dataIds = kids(input, 'n');
  const header = sentinel ? ['sentinel'] : [];
  const result = [frame('init', header, { head: header[0] ?? null, ...(tail ? { tail: header[0] ?? null } : {}) }, chain(header))];

  dataIds.forEach((s, i) => {
    const existing = dataIds.slice(0, i);
    if (!tail) existing.reverse();
    const oldOrder = [...header, ...existing];
    const order = tail ? [...oldOrder, s] : [...header, s, ...existing];
    const oldHead = oldOrder[0] ?? null;
    const oldTail = oldOrder.at(-1) ?? null;
    const oldPointers = { head: oldHead, ...(tail ? { tail: oldTail } : {}), s };
    const head = order[0];
    const oldLinks = chain(oldOrder);
    result.push(frame('alloc', order, oldPointers, [...oldLinks, [s, 'next', null]]));
    if (tail) {
      result.push(frame(oldTail === null ? 'first' : 'link', order, { head, tail: oldTail, s }, chain(order)));
      result.push(frame('tail', order, { head, tail: s, s }, chain(order)));
    } else {
      result.push(frame('link', order, oldPointers, [...oldLinks, [s, 'next', existing[0] ?? null]]));
      result.push(frame('head', order, { head, s }, chain(order)));
    }
  });

  const final = [...header, ...(tail ? dataIds : dataIds.reverse())];
  result.push(frame('done', final, { head: final[0], ...(tail ? { tail: final.at(-1) } : {}) }, chain(final)));
  return result;
}

function reverseFrames(input) {
  const ids = kids(input, 'r');
  const result = [frame('init', ids, { pre: null, p: ids[0] }, chain(ids))];
  ids.forEach((p, i) => {
    const done = ids.slice(0, i).reverse();
    const rest = ids.slice(i);
    const pre = done[0] ?? null;
    const q = rest[1] ?? null;
    const before = [...done, ...rest];
    const after = [p, ...done, ...rest.slice(1)];
    const beforeLinks = [...chain(done), ...chain(rest)];
    const afterLinks = [...chain([p, ...done]), ...chain(rest.slice(1))];
    result.push(frame('loop', before, { pre, p }, beforeLinks));
    result.push(frame('save', before, { pre, p, q }, beforeLinks));
    result.push(frame('link', after, { pre, p, q }, afterLinks));
    result.push(frame('move', after, { pre: p, p: q, q }, afterLinks));
  });
  const reversed = ids.slice().reverse();
  result.push(frame('done', reversed, { pre: reversed[0], p: null }, chain(reversed)));
  return result;
}

function doublyFrames(input) {
  const ids = ['h', ...kids(input.slice(0, -2), 'n')];
  const predecessor = Math.min(Math.max(input.at(-2), 1), ids.length) - 1;
  const original = [...chain(ids), ...chain(ids, 'prior')];
  const result = [frame('init', ids, { p: 'h' }, original)];
  for (let i = 0; i < predecessor; i++) {
    result.push(frame('loop', ids, { p: ids[i] }, original));
    result.push(frame('move', ids, { p: ids[i + 1] }, original));
  }
  const p = ids[predecessor];
  const successor = ids[predecessor + 1] ?? null;
  result.push(frame('loop', ids, { p }, original));
  const order = [...ids.slice(0, predecessor + 1), 's', ...ids.slice(predecessor + 1)];
  const pointers = { p, s: 's' };
  const prior = ['s', 'prior', p];
  const next = ['s', 'next', successor];
  const prepared = [...original, prior, next];
  const rewired = successor === null ? prepared : [
    ...prepared.filter(([from, field]) => from !== successor || field !== 'prior'), [successor, 'prior', 's'],
  ];
  const final = [...chain(order), ...chain(order, 'prior')];
  result.push(frame('alloc', order, pointers, original));
  result.push(frame('prior', order, pointers, [...original, prior]));
  result.push(frame('next', order, pointers, prepared));
  result.push(frame('neig', order, pointers, rewired));
  result.push(frame('link', order, pointers, final));
  result.push(frame('done', order, pointers, final));
  return result;
}

function searchFrames(input) {
  const values = input.slice(0, -1);
  const ids = kids(values, 's');
  const match = values.indexOf(input.at(-1));
  const result = [frame('init', ids, { p: ids[0] })];
  for (let i = 0; i < ids.length; i++) {
    result.push(frame('loop', ids, { p: ids[i] }), frame('cmp', ids, { p: ids[i] }));
    if (i === match) return [...result, frame('found', ids, { p: ids[i] })];
    result.push(frame('move', ids, { p: ids[i + 1] ?? null }));
  }
  return [...result, frame('notfound', ids, { p: null })];
}

function josephFrames([n, m]) {
  const queue = Array.from({ length: n }, (_, i) => i + 1);
  const result = [];
  const add = (anchor) => {
    const ids = [...queue].sort((a, b) => a - b).map((value) => `p${value}`);
    result.push(frame(anchor, ids, { p: `p${queue[0]}` }, undefined, true));
  };
  add('init');
  while (queue.length > 1) {
    add('loop');
    for (let count = 1; count <= m; count++) {
      add('count');
      if (count < m) queue.push(queue.shift());
    }
    add('out');
    queue.shift();
  }
  add('done');
  return result;
}

function checkFrames(trace, expected) {
  assert.equal(trace.length, expected.length, '步骤数与参考轨迹不符');
  expected.forEach((want, i) => {
    const { scene, anchor } = trace[i];
    const at = `第 ${i + 1} 步 (${anchor})`;
    assert.equal(anchor, want.anchor, at);
    assert.equal(scene.kind, 'list', `${at} 应显示链表`);
    assert.deepEqual(scene.nodes.map(({ id }) => id), want.ids, `${at} 结点次序或身份不符`);
    const pointers = (scene.pointers ?? []).map(({ label, index }) => {
      assert.ok(index === null || (Number.isInteger(index) && scene.nodes[index]), `${at} ${label} 指向不存在的结点`);
      return [label.replace(/=NULL$/, ''), index === null ? null : scene.nodes[index].id];
    });
    assert.deepEqual(pointers.sort(), Object.entries(want.pointers).sort(), `${at} 工作指针目标不符`);
    const links = scene.listLinks?.map(({ from, field, to }) => [from, field, to]);
    assert.deepEqual(links?.sort(), want.links?.sort(), `${at} next / prior 目标不符`);
    assert.equal(Boolean(scene.circular), want.circular, `${at} 尾结点回环标记不符`);
  });
}

export function checkListPointers(algorithms) {
  const builders = [
    ['list/link-head-node', false, false], ['list/head-insert-sentinel', false, true],
    ['list/tail-insert', true, false], ['list/tail-insert-sentinel', true, true],
  ];
  const cases = [
    ...builders.flatMap(([slug, tail, sentinel]) => [[0], [5, -3, 5, 2, 0, 7, -9, 6]].map((input) =>
      [slug, input, () => buildFrames(input, tail, sentinel)])),
    ...[[0, 0], [-1, 2, -1, 4], [2, 0, -1, 2, 4, 4, -7, 9]].map((input) => ['list/reverse', input, () => reverseFrames(input)]),
    ...[[10, 20, 30, 1, 25], [10, 20, 20, 3, 20], [10, 20, 30, 4, 25], [0, 2, 5]].map((input) => ['list/doubly-insert', input, () => doublyFrames(input)]),
    ...[[3, 9], [7, 3], [12, 9]].map((input) => ['list/circular-joseph', input, () => josephFrames(input)]),
    ...[[10, 20, 20, 30, 20], [7, 9], [1, 2, 2]].map((input) => ['list/link-search', input, () => searchFrames(input)]),
  ];
  const errors = [];
  for (const [slug, input, reference] of cases) {
    try {
      const algorithm = algorithms.find((item) => item.slug === slug);
      assert.ok(algorithm, '算法未注册');
      checkFrames(algorithm.generate(input), reference());
    } catch (error) { errors.push(`${slug} [${input}]：${error.message}`); }
  }
  if (!errors.length) console.log(`  链表指针通过：8 个演示，${cases.length} 组逐步用例。`);
  return errors;
}
