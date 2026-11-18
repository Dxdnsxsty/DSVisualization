import assert from 'node:assert/strict';

// 直接枚举每段的真前缀与真后缀，不依赖 KMP 的回退递推。
function referenceNext(pattern) {
  return Array.from(pattern, (_, end) => {
    if (end === 0) return -1;
    const prefix = pattern.slice(0, end);
    for (let len = end - 1; len > 0; len--) {
      if (prefix.slice(0, len) === prefix.slice(-len)) return len;
    }
    return 0;
  });
}

function checkTrace(text, pattern, trace) {
  const next = referenceNext(pattern);
  const finishedTable = next.map(String);
  let written = 0;
  let previous;
  let building = true;
  let compared = 0;
  for (const [index, { anchor, scene, vars: { i, j, 比较次数 } }] of trace.entries()) {
    const at = '第 ' + (index + 1) + ' 步 (' + anchor + ') ';
    const expect = (expectedAnchor, expectedI, expectedJ) => {
      assert.equal(anchor, expectedAnchor, at + '步骤顺序不符');
      assert.deepEqual([i, j], [expectedI, expectedJ], at + 'i / j 变化不符');
    };

    if (building) {
      if (!previous) {
        expect('initNext', 0, -1);
        written = 1;
      } else if (previous.anchor === 'nextCmp') {
        const { i: a, j: b } = previous.vars;
        if (b === -1 || pattern[a] === pattern[b]) {
          expect('nextSet', a + 1, b + 1);
          assert.equal(i, written, at + '写入下标应连续');
          written++;
        } else {
          expect('nextBack', a, next[b]);
        }
      } else {
        const { i: a, j: b } = previous.vars;
        expect(written === next.length ? 'nextDone' : 'nextCmp', a, b);
        if (anchor === 'nextDone') building = false;
      }
    } else {
      const { i: a, j: b } = previous.vars;
      if (previous.anchor === 'nextDone') {
        expect('kmpInit', 0, 0);
      } else if (previous.anchor === 'kmpInit' || previous.anchor === 'kmpBack') {
        expect(a === text.length ? 'kmpFail' : 'kmpCmp', a, b);
      } else if (previous.anchor === 'kmpCmp') {
        if (b >= 0 && text[a] !== pattern[b]) {
          expect('kmpBack', a, next[b]);
        } else if (b === pattern.length - 1) {
          expect('kmpFound', a, b);
        } else {
          expect(a + 1 === text.length ? 'kmpFail' : 'kmpCmp', a + 1, b + 1);
        }
      } else {
        assert.fail(at + '匹配结束后不应再有步骤');
      }
      if (anchor === 'kmpCmp' && j >= 0) compared++;
      assert.equal(比较次数, compared, at + '字符比较次数不符');
    }
    const values = scene.aux?.nodes.map(({ value }) => value);
    const table = finishedTable.map((value, slot) => slot < written ? value : '·');
    assert.deepEqual(values, table, at + 'next 数组快照不符');
    previous = trace[index];
  }

  const hit = text.indexOf(pattern);
  assert.equal(previous?.anchor, hit < 0 ? 'kmpFail' : 'kmpFound', '匹配结果不符');
  assert.deepEqual(previous.scene.nodes.filter(({ state }) => state === 'found').map(({ id }) => id),
    hit < 0 ? [] : Array.from(pattern, (_, i) => 's' + (hit + i)), '首次匹配高亮位置不符');
}

export function checkKmpNext(algorithms) {
  const algo = algorithms.find(({ slug }) => slug === 'string/kmp');
  if (!algo) return ['KMP 算法未注册'];
  const cases = [
    ['aaaabaaaaa', 'aaaaa'],    // 多次非零回退，最终命中
    ['ababxabababa', 'ababa'], // 重叠的真前后缀
    ['abcxabcde', 'abcde'],    // 无公共真前后缀
    ['ababxababx', 'ababa'],   // 回退后仍无匹配
    ['zabcacabcac', 'abcac'],  // 求表阶段失配，且有多处匹配
    ['aaaxaabaa', 'aabaa'],    // 求表阶段从非零位置回退
    ['ab', 'b'],              // 单字符模式，哨兵后再次比较
    ['bbbb', 'a'],            // 单字符模式，最后一位失配后结束
    ['ab', 'abcde'],           // 模式长于主串
  ];
  const errors = [];
  for (const [text, pattern] of cases) {
    try {
      const input = [pattern.length, ...Array.from(text + pattern, (char) => char.charCodeAt(0) - 96)];
      checkTrace(text, pattern, algo.generate(input));
    } catch (error) { errors.push('string/kmp [' + text + ', ' + pattern + ']：' + error.message); }
  }
  if (!errors.length) console.log('  KMP next 通过：' + cases.length + ' 组数组快照与回退用例。');
  return errors;
}
