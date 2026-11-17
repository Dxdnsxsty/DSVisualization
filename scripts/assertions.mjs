/**
 * 结果断言：Trace 协议校验只能保证「格式没错」，保证不了「算得对」。
 * 这里对每个算法独立重算一遍答案（排序是否有序、MST 权值、最短路径、拓扑序是否合法……），
 * 再与算法自己给出的终态比对。跑在 npm run validate 里，作为内容正确性的水位线。
 */

const vals = (scene) => scene.nodes.map((n) => n.value).filter((v) => v !== '' && v != null);

/** 排序类：终态必须升序，且与初始序列是同一个多重集合 */
function checkSort(algo, trace, err) {
  const first = vals(trace[0].scene).map(Number);
  const last = vals(trace[trace.length - 1].scene).map(Number);
  if (last.length !== first.length) {
    err(`排序前后元素个数不一致：${last.length} ≠ ${first.length}`);
  }
  if (last.some((v) => Number.isNaN(v))) {
    err('排序结果里出现非数值元素');
    return;
  }
  for (let i = 1; i < last.length; i++) {
    if (last[i - 1] > last[i]) {
      err(`排序结果未升序：[${last.join(', ')}]`);
      break;
    }
  }
  const a = [...first].sort((x, y) => x - y).join(',');
  const b = [...last].sort((x, y) => x - y).join(',');
  if (a !== b) err(`排序结果与输入不是同一多重集合：输入[${a}] 结果[${b}]`);
}

/**
 * 查找类：全程必须出现过命中标记，且命中的值就是待查目标。
 * 不看「最后一步」——有的算法会在查完之后再演示一次失败查找，终态自然是无命中。
 */
function checkSearch(algo, trace, err) {
  const target = String(algo.defaultInput[algo.defaultInput.length - 1]);
  const all = (st) => [...st.nodes, ...(st.aux?.nodes ?? [])];
  const hitValues = new Set();
  for (const st of trace) {
    for (const n of all(st.scene)) if (n.state === 'found') hitValues.add(String(n.value));
  }
  if (hitValues.size === 0) {
    err(`全程没有命中标记，但目标 ${target} 应该在表中`);
    return;
  }
  if (!hitValues.has(target)) {
    err(`命中标记落在 ${[...hitValues].join(' / ')}，都不是待查目标 ${target}`);
  }
}

/** 串匹配：按输入编码还原主串与模式串，用 indexOf 独立求首次出现位置 */
function checkStringMatch(algo, trace, err) {
  const dec = (v) => String.fromCharCode(96 + Math.min(Math.max(v, 1), 26));
  const m = algo.defaultInput[0];
  const body = algo.defaultInput.slice(1);
  const S = body.slice(0, body.length - m).map(dec).join('');
  const T = body.slice(-m).map(dec).join('');
  const expect = S.indexOf(T);
  const last = trace[trace.length - 1].scene;
  const marks = last.nodes.map((n) => n.state === 'found');

  if (expect < 0) {
    if (marks.some(Boolean)) err(`主串「${S}」中不存在「${T}」，却标记了命中`);
    return;
  }
  const start = marks.indexOf(true);
  if (start < 0) {
    err(`应在位置 ${expect} 命中「${T}」，但没有命中标记`);
    return;
  }
  const got = last.nodes.slice(start, start + m).map((n) => n.value).join('');
  if (got !== T) err(`命中区文本「${got}」≠ 模式串「${T}」`);
  if (start !== expect) err(`命中位置 ${start} ≠ 独立求出的 ${expect}`);
}

/** 最小生成树：边数 = n-1、无环、且累计权值等于独立跑 Kruskal 的结果 */
function checkMst(algo, trace, err) {
  const last = trace[trace.length - 1];
  const s = last.scene;
  const n = s.nodes.length;
  const edges = s.edges ?? [];
  const tree = edges.filter((e) => e.state === 'tree');
  if (tree.length !== n - 1) err(`选中边数 ${tree.length} ≠ n-1（${n - 1}）`);

  const mkDsu = (ids) => {
    const p = new Map(ids.map((id) => [id, id]));
    const find = (x) => {
      let r = x;
      while (p.get(r) !== r) r = p.get(r);
      while (p.get(x) !== r) { const nx = p.get(x); p.set(x, r); x = nx; }
      return r;
    };
    return { find, union: (a, b) => p.set(find(a), find(b)) };
  };

  const d1 = mkDsu(s.nodes.map((nd) => nd.id));
  for (const e of tree) {
    if (d1.find(e.from) === d1.find(e.to)) { err(`选中边 ${e.from}-${e.to} 会构成环`); break; }
    d1.union(e.from, e.to);
  }

  const weighted = edges
    .map((e) => ({ u: e.from, v: e.to, w: Number(e.label) }))
    .filter((e) => !Number.isNaN(e.w))
    .sort((x, y) => x.w - y.w);
  const d2 = mkDsu(s.nodes.map((nd) => nd.id));
  let total = 0;
  for (const e of weighted) {
    if (d2.find(e.u) !== d2.find(e.v)) { d2.union(e.u, e.v); total += e.w; }
  }
  const reported = Number(last.vars['累计权值']);
  if (!Number.isNaN(reported) && reported !== total) {
    err(`累计权值 ${reported} ≠ 独立计算的 MST 权值 ${total}`);
  }
}

/** 单源最短路径：从图里重建邻接表，独立跑一遍 Dijkstra 再比对 dist */
function checkDijkstra(algo, trace, err) {
  const last = trace[trace.length - 1];
  const s = last.scene;
  const name = new Map(s.nodes.map((nd) => [nd.id, nd.value]));
  const vs = s.nodes.map((nd) => nd.value);
  const src = vs[0];
  const dist = new Map(vs.map((v) => [v, Infinity]));
  dist.set(src, 0);
  const adj = new Map(vs.map((v) => [v, []]));

  for (const e of s.edges ?? []) {
    const w = Number(e.label);
    if (Number.isNaN(w)) continue;
    const u = name.get(e.from);
    const v = name.get(e.to);
    adj.get(u)?.push([v, w]);
    if (!e.directed) adj.get(v)?.push([u, w]);
  }

  const done = new Set();
  for (;;) {
    let u = null;
    for (const v of vs) {
      if (done.has(v)) continue;
      if (u === null || dist.get(v) < dist.get(u)) u = v;
    }
    if (u === null || dist.get(u) === Infinity) break;
    done.add(u);
    for (const [v, w] of adj.get(u) ?? []) {
      if (dist.get(u) + w < dist.get(v)) dist.set(v, dist.get(u) + w);
    }
  }

  const reported = String(last.vars['dist'] ?? '');
  for (const part of reported.split(/\s+/).filter(Boolean)) {
    const [v, d] = part.split(':');
    if (!name.size) break;
    const got = Number(d);
    const want = dist.get(v);
    if (want === Infinity) continue;
    if (got !== want) err(`dist[${v}] 报的是 ${got}，独立算出 ${want}`);
  }
}

/** 拓扑排序：输出序列必须是全部顶点的排列，且满足每条有向边的先后约束 */
function checkTopo(algo, trace, err) {
  const last = trace[trace.length - 1];
  const s = last.scene;
  const order = String(last.vars['输出序列'] ?? '').split(/[\s→,]+/).filter(Boolean);
  const vs = s.nodes.map((nd) => nd.value);
  if (order.length !== vs.length) {
    err(`拓扑序列长度 ${order.length} ≠ 顶点数 ${vs.length}`);
    return;
  }
  if (new Set(order).size !== order.length) err('拓扑序列存在重复顶点');
  const pos = new Map(order.map((v, i) => [v, i]));
  for (const e of s.edges ?? []) {
    const a = s.nodes.find((nd) => nd.id === e.from)?.value;
    const b = s.nodes.find((nd) => nd.id === e.to)?.value;
    if (pos.has(a) && pos.has(b) && pos.get(a) > pos.get(b)) {
      err(`边 ${a}→${b} 与输出序列「${order.join(' ')}」矛盾`);
      break;
    }
  }
}

/** 哈夫曼树：根权值必须等于所有叶子权值之和（构造过程的守恒量） */
function checkHuffman(algo, trace, err) {
  const s = trace[trace.length - 1].scene;
  // 虚拟根「forest」只是把多棵树串成一屏，不算哈夫曼树的边
  const edges = (s.edges ?? []).filter((e) => e.from !== 'forest');
  const hasChild = new Set(edges.map((e) => e.from));
  const hasParent = new Set(edges.map((e) => e.to));
  const real = s.nodes.filter((n) => n.id !== 'forest');
  const roots = real.filter((n) => !hasParent.has(n.id));
  const leaves = real.filter((n) => !hasChild.has(n.id));
  const sum = leaves.reduce((t, n) => t + (Number(n.value) || 0), 0);
  const root = roots[0];
  if (!root) { err('找不到哈夫曼树根结点'); return; }
  if (Number(root.value) !== sum) {
    err(`根权值 ${root.value} ≠ 叶子权值之和 ${sum}`);
  }
}


/* ---------- 通用小工具 ---------- */

const nameOf = (scene) => new Map(scene.nodes.map((n) => [n.id, n.value]));

/** 从场景边重建邻接表（值→[值, 权]）；undirected=true 时忽略边的方向 */
function buildAdj(scene, { undirected = false } = {}) {
  const name = nameOf(scene);
  const adj = new Map(scene.nodes.map((n) => [n.value, []]));
  for (const e of scene.edges ?? []) {
    const w = Number(e.label);
    if (Number.isNaN(w)) continue;
    const u = name.get(e.from);
    const v = name.get(e.to);
    if (u == null || v == null) continue;
    adj.get(u)?.push([v, w]);
    if (undirected || !e.directed) adj.get(v)?.push([u, w]);
  }
  return adj;
}

/** 解析 "A:0 B:6 C:7" 形式的变量字符串 */
function parsePairs(text) {
  const out = new Map();
  for (const part of String(text ?? '').split(/[\s,]+/).filter(Boolean)) {
    const [k, v] = part.split(':');
    if (k && v !== undefined) out.set(k.trim(), Number(v));
  }
  return out;
}

/** 顶点值 → 顶点值 的全源最短路（Floyd-Warshall） */
function allPairs(scene) {
  const adj = buildAdj(scene);
  const vs = scene.nodes.map((n) => n.value);
  const d = new Map();
  for (const i of vs) for (const j of vs) d.set(`${i}|${j}`, i === j ? 0 : Infinity);
  for (const [u, list] of adj) for (const [v, w] of list) d.set(`${u}|${v}`, Math.min(d.get(`${u}|${v}`), w));
  for (const k of vs) for (const i of vs) for (const j of vs) {
    const cand = d.get(`${i}|${k}`) + d.get(`${k}|${j}`);
    if (cand < d.get(`${i}|${j}`)) d.set(`${i}|${j}`, cand);
  }
  return { dist: d, vs };
}

/** Floyd 的最终结果放在 aux 的一行里，独立算全源最短路后比对这一行 */
function checkFloyd(algo, trace, err) {
  const last = trace[trace.length - 1];
  const s = last.scene;
  const { dist, vs } = allPairs(s);
  const row = (s.aux?.nodes ?? []).map((n) => Number(n.value));
  if (!row.length) { err('末尾没有 Floyd 结果行（aux 为空）'); return; }
  const m = String(s.aux?.label ?? '').match(/D\s*第\s*([A-Za-z]\w*)\s*行/);
  const src = m ? m[1] : vs[0];
  row.forEach((got, idx) => {
    const v = vs[idx];
    if (v === undefined) return;
    const want = dist.get(`${src}|${v}`);
    if (Number.isFinite(want) && got !== want) err(`D[${src}][${v}] 报 ${got}，独立算出 ${want}`);
  });
}

/** Bellman-Ford：按报告的源点独立跑 n-1 轮松弛，比对 dist */
function checkBellmanFord(algo, trace, err) {
  const last = trace[trace.length - 1];
  const s = last.scene;
  const reported = parsePairs(last.vars['dist']);
  if (reported.size === 0) { err('缺少 dist 变量'); return; }
  const src = [...reported.entries()].find(([, d]) => d === 0)?.[0] ?? s.nodes[0].value;
  const adj = buildAdj(s);
  const dist = new Map(s.nodes.map((n) => [n.value, Infinity]));
  dist.set(src, 0);
  for (let round = 0; round < s.nodes.length - 1; round++) {
    let changed = false;
    for (const [u, list] of adj) {
      if (dist.get(u) === Infinity) continue;
      for (const [v, w] of list) {
        if (dist.get(u) + w < dist.get(v)) { dist.set(v, dist.get(u) + w); changed = true; }
      }
    }
    if (!changed) break;
  }
  for (const [v, got] of reported) {
    const want = dist.get(v);
    if (Number.isFinite(want) && got !== want) err(`dist[${v}] 报 ${got}，独立算出 ${want}`);
  }
}

/** 关键路径：按拓扑序独立求 ve / vl，并检查被标为关键的边满足 ve[u]+w == vl[v] */
function checkCriticalPath(algo, trace, err) {
  const last = trace[trace.length - 1];
  const s = last.scene;
  const name = nameOf(s);
  const vs = s.nodes.map((n) => n.value);
  const edges = (s.edges ?? [])
    .map((e) => ({ u: name.get(e.from), v: name.get(e.to), w: Number(e.label), state: e.state }))
    .filter((e) => e.u != null && e.v != null && !Number.isNaN(e.w));

  const indeg = new Map(vs.map((v) => [v, 0]));
  for (const e of edges) indeg.set(e.v, (indeg.get(e.v) ?? 0) + 1);
  const queue = vs.filter((v) => indeg.get(v) === 0);
  const order = [];
  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    for (const e of edges) {
      if (e.u !== u) continue;
      indeg.set(e.v, indeg.get(e.v) - 1);
      if (indeg.get(e.v) === 0) queue.push(e.v);
    }
  }
  if (order.length !== vs.length) { err('AOE 网存在环，无法求关键路径'); return; }

  const ve = new Map(vs.map((v) => [v, 0]));
  for (const u of order) for (const e of edges) if (e.u === u) ve.set(e.v, Math.max(ve.get(e.v), ve.get(u) + e.w));
  const finish = Math.max(...vs.map((v) => ve.get(v)));
  const vl = new Map(vs.map((v) => [v, finish]));
  for (const u of [...order].reverse()) for (const e of edges) if (e.u === u) vl.set(u, Math.min(vl.get(u), vl.get(e.v) - e.w));

  const repVe = parsePairs(last.vars['最早ve']);
  const repVl = parsePairs(last.vars['最迟vl']);
  for (const [v, got] of repVe) if (ve.get(v) !== got) err(`ve[${v}] 报 ${got}，独立算出 ${ve.get(v)}`);
  for (const [v, got] of repVl) if (vl.get(v) !== got) err(`vl[${v}] 报 ${got}，独立算出 ${vl.get(v)}`);

  for (const e of edges.filter((x) => x.state === 'tree')) {
    if (ve.get(e.u) + e.w !== vl.get(e.v)) {
      err(`边 ${e.u}→${e.v} 被判为关键活动，但 ve[u]+w=${ve.get(e.u) + e.w} ≠ vl[v]=${vl.get(e.v)}`);
      break;
    }
  }
}

/** 遍历类：重建树结构后独立遍历，比对「结点首次被标记完成」的先后 */
function checkTraversal(algo, trace, err) {
  const done = [];
  const seen = new Set();
  for (const st of trace) {
    for (const n of st.scene.nodes) {
      if ((n.state === 'sorted' || n.state === 'found') && !seen.has(n.id)) {
        seen.add(n.id);
        done.push(n.value);
      }
    }
  }
  const s = trace[trace.length - 1].scene;
  const children = new Map();
  const hasParent = new Set();
  for (const e of s.edges ?? []) {
    if (!children.has(e.from)) children.set(e.from, []);
    children.get(e.from).push(e.to);
    hasParent.add(e.to);
  }
  const root = s.nodes.find((n) => !hasParent.has(n.id));
  if (!root) { err('找不到树根'); return; }
  const name = nameOf(s);
  const out = [];
  const pre = (id) => { out.push(name.get(id)); for (const c of children.get(id) ?? []) pre(c); };
  const ino = (id) => {
    const kids = children.get(id) ?? [];
    if (kids[0]) ino(kids[0]);
    out.push(name.get(id));
    if (kids[1]) ino(kids[1]);
  };
  const post = (id) => { for (const c of children.get(id) ?? []) post(c); out.push(name.get(id)); };

  const kind = algo.slug.split('/')[1];
  if (kind === 'preorder') pre(root.id);
  else if (kind === 'inorder') ino(root.id);
  else if (kind === 'postorder') post(root.id);
  else {
    const q = [root.id];
    while (q.length) {
      const id = q.shift();
      out.push(name.get(id));
      for (const c of children.get(id) ?? []) q.push(c);
    }
  }
  if (done.join(' ') !== out.join(' ')) {
    err(`访问顺序「${done.join(' ')}」≠ 独立遍历「${out.join(' ')}」`);
  }
}

/** 压缩存储：按公式独立算一维下标，检查落位值是否与矩阵一致 */
function checkMatrix(algo, trace, err) {
  const last = trace[trace.length - 1];
  const s = last.scene;
  const matrix = new Map();
  for (const n of s.nodes) {
    const m = /^[am](\d+)_(\d+)$/.exec(n.id);
    if (m) matrix.set(`${m[1]}|${m[2]}`, Number(n.value));
  }
  if (matrix.size === 0) { err('找不到矩阵格子（id 形如 a0_1）'); return; }
  const rowCount = Math.max(...[...matrix.keys()].map((k) => Number(k.split('|')[0]))) + 1;

  if (algo.slug === 'array/sparse-triple') {
    const triples = (s.aux?.nodes ?? []).map((n) => String(n.value).split(',').map(Number));
    const nonZero = [...matrix.entries()].filter(([, v]) => v !== 0);
    if (triples.length !== nonZero.length) err(`三元组行数 ${triples.length} ≠ 非零元素个数 ${nonZero.length}`);
    for (const [r, c, v] of triples) {
      const want = matrix.get(`${r}|${c}`);
      if (want !== v) err(`三元组 (${r},${c},${v}) 与矩阵值 ${want} 不符`);
    }
    let prev = -1;
    for (const [r, c] of triples) {
      const key = r * 1000 + c;
      if (key <= prev) err('三元组未按行优先有序');
      prev = key;
    }
    return;
  }

  const aux = (s.aux?.nodes ?? []).map((n) => Number(n.value));
  if (!aux.length) { err('缺少一维数组（aux 为空）'); return; }
  for (const [key, v] of matrix) {
    const [i, j] = key.split('|').map(Number);
    let k = -1;
    if (algo.slug === 'array/symmetric-matrix') {
      if (i < j) continue;
      k = (i * (i + 1)) / 2 + j;
    } else {
      if (Math.abs(i - j) > 1) continue;
      k = 2 * i + j;
    }
    if (k >= aux.length) { err(`下标 k=${k} 超出一维数组长度 ${aux.length}`); break; }
    if (aux[k] !== v) err(`矩阵[${i}][${j}]=${v} 应存到 B[${k}]，实际是 ${aux[k]}`);
  }
  const expectLen = algo.slug === 'array/symmetric-matrix' ? (rowCount * (rowCount + 1)) / 2 : 3 * rowCount - 2;
  if (aux.length !== expectLen) err(`一维数组长度 ${aux.length} ≠ 理论长度 ${expectLen}`);
}


/** 二叉排序树：终态做一次中序遍历，结果必须非降序（BST 性质的等价定义） */
function checkBstProperty(algo, trace, err) {
  const s = trace[trace.length - 1].scene;
  const kids = new Map();
  const hasParent = new Set();
  for (const e of s.edges ?? []) {
    const rec = kids.get(e.from) ?? { l: null, r: null, rest: [] };
    if (e.side === 'left') rec.l = e.to;
    else if (e.side === 'right') rec.r = e.to;
    else rec.rest.push(e.to);
    kids.set(e.from, rec);
    hasParent.add(e.to);
  }
  // 没有 side 标记的算法退化为按边的出现顺序补位（二叉树的边通常先左后右）
  for (const rec of kids.values()) {
    for (const id of rec.rest) {
      if (!rec.l) rec.l = id;
      else if (!rec.r) rec.r = id;
    }
  }
  const root = s.nodes.find((n) => !hasParent.has(n.id));
  if (!root) { err('BST 找不到根结点'); return; }
  const name = nameOf(s);
  const order = [];
  const walk = (id) => {
    const rec = kids.get(id) ?? { l: null, r: null };
    if (rec.l) walk(rec.l);
    order.push(Number(name.get(id)));
    if (rec.r) walk(rec.r);
  };
  walk(root.id);
  for (let i = 1; i < order.length; i++) {
    if (order[i - 1] > order[i]) {
      err(`BST 中序遍历未有序：[${order.join(', ')}]`);
      return;
    }
  }
}

/** AVL：除 BST 性质外，终态每个结点的左右子树高度差都不能超过 1；默认教学序列必须覆盖四型旋转。 */
function checkAvl(algo, trace, err) {
  checkBstProperty(algo, trace, err);
  const s = trace[trace.length - 1].scene;
  const children = new Map();
  const hasParent = new Set();
  for (const e of s.edges ?? []) {
    const rec = children.get(e.from) ?? { left: null, right: null };
    if (e.side === 'left') rec.left = e.to;
    else if (e.side === 'right') rec.right = e.to;
    children.set(e.from, rec);
    hasParent.add(e.to);
  }
  const root = s.nodes.find((n) => !hasParent.has(n.id));
  if (!root) { err('AVL 找不到根结点'); return; }
  const height = (id) => {
    if (!id) return 0;
    const rec = children.get(id) ?? { left: null, right: null };
    const left = height(rec.left);
    const right = height(rec.right);
    if (Math.abs(left - right) > 1) err(`结点 ${s.nodes.find((n) => n.id === id)?.value} 的左右高度差为 ${Math.abs(left - right)}，不满足 AVL 平衡条件`);
    return 1 + Math.max(left, right);
  };
  height(root.id);
  for (const type of ['LL', 'LR', 'RL', 'RR']) {
    if (!trace.some((st) => st.caption.includes(`${type} 型`))) err(`默认教学序列未覆盖 ${type} 旋转`);
  }
}

export function checkAlgorithm(algo, trace) {
  const errors = [];
  const err = (m) => errors.push(`${algo.slug}: ${m}（结果断言）`);
  if (!Array.isArray(trace) || trace.length === 0) return errors;
  try {
    const [group] = algo.slug.split('/');
    if (group === 'sort') checkSort(algo, trace, err);
    if (group === 'search') checkSearch(algo, trace, err);
    if (group === 'string') checkStringMatch(algo, trace, err);
    if (algo.slug === 'tree/bst-search' || algo.slug === 'tree/lvl-search') checkSearch(algo, trace, err);
    if (algo.slug === 'tree/huffman') checkHuffman(algo, trace, err);
    if (algo.slug === 'tree/bst-insert') checkBstProperty(algo, trace, err);
    if (algo.slug === 'tree/avl-insert') checkAvl(algo, trace, err);
    if (algo.slug === 'graph/prim' || algo.slug === 'graph/kruskal') checkMst(algo, trace, err);
    if (algo.slug === 'graph/dijkstra') checkDijkstra(algo, trace, err);
    if (algo.slug === 'graph/topo-sort') checkTopo(algo, trace, err);
    if (algo.slug === 'graph/floyd') checkFloyd(algo, trace, err);
    if (algo.slug === 'graph/bellman-ford') checkBellmanFord(algo, trace, err);
    if (algo.slug === 'graph/critical-path') checkCriticalPath(algo, trace, err);
    if (['tree/preorder', 'tree/inorder', 'tree/postorder', 'tree/levelorder'].includes(algo.slug)) checkTraversal(algo, trace, err);
    if (['array/symmetric-matrix', 'array/tri-diagonal', 'array/sparse-triple'].includes(algo.slug)) checkMatrix(algo, trace, err);
  } catch (e) {
    err(`断言执行异常：${e instanceof Error ? e.message : String(e)}`);
  }
  return errors;
}
