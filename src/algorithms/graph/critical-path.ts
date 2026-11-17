import type { AlgorithmMeta, EdgeState, TraceStep } from '../../engine/types';
import { edge, graphScene, makeStep, nodeAt } from '../../engine/scene';

/** 固定 6 顶点 AOE 网：a1 v0→v1 3、a2 v0→v2 2、a3 v1→v3 2、a4 v1→v4 3、a5 v2→v3 4、a6 v2→v5 3、a7 v3→v4 2、a8 v3→v5 3、a9 v4→v5 1 */
const VEX = ['v0', 'v1', 'v2', 'v3', 'v4', 'v5'];
const POS: { x: number; y: number }[] = [
  { x: 0.06, y: 0.5 },
  { x: 0.3, y: 0.1 },
  { x: 0.3, y: 0.88 },
  { x: 0.58, y: 0.52 },
  { x: 0.82, y: 0.1 },
  { x: 0.94, y: 0.86 },
];
const AEDGES: [number, number, number][] = [
  [0, 1, 3],
  [0, 2, 2],
  [1, 3, 2],
  [1, 4, 3],
  [2, 3, 4],
  [2, 5, 3],
  [3, 4, 2],
  [3, 5, 3],
  [4, 5, 1],
];
const N = VEX.length;
const INF = Number.POSITIVE_INFINITY;
const show = (v: number) => (v === INF ? '∞' : String(v));

/** 拓扑序列 v0,v1,v2,v3,v4,v5 对示例网始终成立，直接给出。 */
const TOPO = [0, 1, 2, 3, 4, 5];

export const criticalPath: AlgorithmMeta = {
  slug: 'graph/critical-path',
  title: '图 · 关键路径',
  chapter: '第 8 章 图',
  category: 'ch8',
  summary: '正推最早时间、逆推最迟时间，挑出零机动的活动。',
  complexity: { time: 'O(n+e)', space: 'O(n)', extra: '先拓扑排序，再正逆两遍扫描' },
  difficulty: '进阶',
  inputHint: '固定输入 6 个事件，在示例 AOE 网上演示关键路径的求解过程。',
  defaultInput: [6],
  input: { min: 4, max: 6, minLen: 1, maxLen: 1 },
  code: {
    cpp: [
      { text: 'void CriticalPath(AMGraph G) {' },
      { text: '  int ve[MAXV] = {0}, vl[MAXV];', anchor: 'init' },
      { text: '  TopSort(G, topo);  // 求拓扑序列', anchor: 'topo' },
      { text: '  for (int i = 0; i < G.n; i++)  // 正推 ve', anchor: 've' },
      { text: '    for each 入边 <j, i, w>: ve[i] = max(ve[i], ve[j] + w);' },
      { text: '  for (int i = 0; i < G.n; i++) vl[i] = ve[G.n - 1];', anchor: 'rev' },
      { text: '  for (int i = G.n - 2; i >= 0; i--)  // 逆推 vl', anchor: 'vl' },
      { text: '    for each 出边 <i, j, w>: vl[i] = min(vl[i], vl[j] - w);' },
      { text: '  for each 边 <i, j, w>', anchor: 'act' },
      { text: '    if (ve[i] == vl[j] - w) printf("关键活动 %d->%d", i, j);' },
      { text: '}', anchor: 'done' },
    ],
    python: [
      { text: 'def critical_path(g, topo):' },
      { text: '    ve, vl = [0] * g.n, [0] * g.n', anchor: 'init' },
      { text: '    # topo 为拓扑序列', anchor: 'topo' },
      { text: '    for i in topo:  # 正推 ve', anchor: 've' },
      { text: '        for j, w in g.in_edges[i]:' },
      { text: '            ve[i] = max(ve[i], ve[j] + w)' },
      { text: '    vl = [ve[g.n - 1]] * g.n', anchor: 'rev' },
      { text: '    for i in reversed(topo[:-1]):  # 逆推 vl', anchor: 'vl' },
      { text: '        for j, w in g.out_edges[i]:' },
      { text: '            vl[i] = min(vl[i], vl[j] - w)' },
      { text: '    for i, j, w in g.edges:', anchor: 'act' },
      { text: '        if ve[i] == vl[j] - w:' },
      { text: '            print("关键活动", i, j)' },
      { text: '    return ve, vl', anchor: 'done' },
    ],
  },
  doc: [
    {
      heading: '核心思想',
      body: 'AOE 网中顶点表示事件、有向边表示活动、权值表示活动持续时间。求关键路径分两步：先按拓扑序正推每个事件的最早发生时间 ve（取所有入边里最大的 ve[j]+w，因为事件要等前置活动全部完成）；再按逆拓扑序回推最迟发生时间 vl（取所有出边里最小的 vl[j]-w）。',
      points: [
        '源点 ve = 0，汇点 vl = ve，这是两个递推的边界',
        've 取 max、vl 取 min，方向相反不能混',
        '对活动 <i,j,w>，若 ve[i] == vl[j]-w 则它没有机动时间，是关键活动',
      ],
    },
    {
      heading: '为什么关键活动不能拖',
      body: '活动 <i,j,w> 的最早开始时间是 ve[i]，最迟必须在不影响汇点的前提下开始，即 vl[j]-w。两者之差就是机动时间（时间余量）。差为 0 意味着晚一天整个工期就晚一天，把所有这样的活动串起来就是关键路径。关键路径的长度等于完成整个工程的最短工期。',
    },
    {
      heading: '复杂度与注意点',
      body: '拓扑排序 O(n+e)，正推与逆推各扫描一次边表 O(n+e)，总时间 O(n+e)，空间 O(n)。关键路径可能不唯一；缩短某条关键活动可能让别的路径变成新的关键路径，所以压缩工期必须同时考虑所有关键路径。',
      points: ['非关键活动的机动时间可以用来调配人力与设备', '关键路径上活动的 ve 与 vl 之差恒为 0', '若存在环，工程无法排期，拓扑排序会失败'],
    },
  ],
  quiz: [
    { q: '求事件最早发生时间 ve 时，应该取入边的？', options: ['最小值', '最大值', '平均值', '第一条入边'], answer: 1, explain: '事件要等所有前置活动都完成才能发生，因此取各入边 ve[j]+w 的最大值。' },
    { q: '活动 <i,j,w> 成为关键活动的条件是？', options: ['ve[i] == vl[j] - w', 've[i] == vl[i]', 'w 最大', 'j 是汇点'], answer: 0, explain: '最早开始时间等于最迟开始时间，机动时间为 0，该活动即为关键活动。' },
    { q: '示例 AOE 网的关键路径长度（最短工期）是？', options: ['8', '9', '10', '12'], answer: 1, explain: 'v0→v2→v3→v5 的权值为 2+4+3 = 9，与经 v4 的 2+4+2+1 = 9 并列，故工期为 9。' },
  ],
  generate: (input) => {
    const n = Math.min(Math.max(input[0] || N, 4), N);
    const ids = VEX.slice(0, n).map((v) => `v${v}`);
    const aedges = AEDGES.filter(([a, b]) => a < n && b < n);
    const steps: TraceStep[] = [];
    let k = 0;
    const ve: number[] = Array(n).fill(0);
    const vl: number[] = Array(n).fill(INF);
    const veDone: boolean[] = Array(n).fill(false);
    const vlDone: boolean[] = Array(n).fill(false);
    const eStates: Record<string, EdgeState> = {};
    const crit: boolean[] = Array(n).fill(false);
    let cur = -1;
    let actText = '—';
    let critCount = 0;

    const push = (anchor: string, phase: string, caption: string) => {
      const nodes = VEX.slice(0, n).map((v, i) =>
        nodeAt(
          ids[i],
          v,
          POS[i].x,
          POS[i].y,
          i === cur ? 'active' : crit[i] ? 'found' : vlDone[i] || veDone[i] ? 'visited' : 'default',
        ),
      );
      const edges = aedges.map(([a, b, w]) => {
        const st: EdgeState = eStates[`${a}>${b}`] ?? 'default';
        return edge(ids[a], ids[b], String(w), st, true);
      });
      steps.push(
        makeStep(
          k++,
          anchor,
          phase,
          graphScene(
            nodes,
            edges,
            `ve / vl 已求出 ${veDone.filter(Boolean).length} / ${vlDone.filter(Boolean).length} 个事件　关键活动 ${critCount} 条`,
          ),
          {
            最早ve: VEX.slice(0, n).map((v, i) => `${v}:${veDone[i] ? ve[i] : '-'}`).join(' '),
            最迟vl: VEX.slice(0, n).map((v, i) => `${v}:${vlDone[i] ? show(vl[i]) : '-'}`).join(' '),
            当前事件: cur >= 0 ? VEX[cur] : '—',
            活动判断: actText,
            关键活动数: critCount,
          },
          caption,
        ),
      );
    };

    push(
      'init',
      '初始化',
      've 全部置 0，vl 全部置 ∞；AOE 网中顶点是事件、边是活动，权值是活动持续时间。',
    );
    push('topo', '确定拓扑序列', `拓扑序列为 ${TOPO.slice(0, n).map((v) => VEX[v]).join(' → ')}，按它正推 ve。`);

    for (const v of TOPO.slice(0, n)) {
      cur = v;
      const ins = AEDGES.filter(([a, b]) => b === v && a < n);
      for (const [a] of ins) eStates[`${a}>${v}`] = 'active';
      let best = 0;
      if (ins.length > 0) {
        best = -INF;
        for (const [a, , w] of ins) best = Math.max(best, ve[a] + w);
      }
      ve[v] = best;
      veDone[v] = true;
      const detail = ins.length
        ? ins.map(([a, , w]) => `ve[${VEX[a]}]+${w}=${ve[a] + w}`).join('、')
        : '无入边';
      push(
        've',
        '正推最早发生时间',
        ins.length
          ? `${detail}，取最大值 ⇒ ve[${VEX[v]}] = ${best}，事件要等所有前置活动完成。`
          : `${VEX[v]} 是源点，没有入边，ve[${VEX[v]}] = 0。`,
      );
      for (const [a] of ins) eStates[`${a}>${v}`] = 'default';
    }

    push('rev', '逆拓扑初始化', `汇点 ${VEX[n - 1]} 的 vl 等于 ve = ${ve[n - 1]}，从它开始逆推其余事件。`);
    vl[n - 1] = ve[n - 1];
    vlDone[n - 1] = true;

    for (let idx = n - 2; idx >= 0; idx--) {
      const v = TOPO[idx];
      cur = v;
      const outs = AEDGES.filter(([a, b]) => a === v && b < n);
      for (const [, b] of outs) eStates[`${v}>${b}`] = 'active';
      let best = INF;
      for (const [, b, w] of outs) best = Math.min(best, vl[b] - w);
      if (outs.length === 0) best = ve[v];
      vl[v] = best;
      vlDone[v] = true;
      const detail = outs.length
        ? outs.map(([, b, w]) => `vl[${VEX[b]}]-${w}=${vl[b] - w}`).join('、')
        : '无出边';
      push(
        'vl',
        '逆推最迟发生时间',
        outs.length
          ? `${detail}，取最小值 ⇒ vl[${VEX[v]}] = ${best}，再晚就会拖延后继活动。`
          : `${VEX[v]} 没有出边，vl 直接取 ve = ${best}。`,
      );
      for (const [, b] of outs) eStates[`${v}>${b}`] = 'default';
    }

    cur = -1;
    push('act', '判定关键活动', '逐个检查活动 <i,j,w>：若 ve[i] 等于 vl[j]-w，说明机动时间为 0，它是关键活动。');
    for (const [a, b, w] of aedges) {
      cur = -1;
      const slack = vl[b] - w - ve[a];
      if (slack === 0) {
        critCount += 1;
        crit[a] = true;
        crit[b] = true;
        eStates[`${a}>${b}`] = 'tree';
        actText = `${VEX[a]}→${VEX[b]}：${ve[a]} = ${vl[b]}-${w}`;
        push(
          'act',
          '关键活动',
          `活动 ${VEX[a]}→${VEX[b]}（${w}）：ve[${VEX[a]}] = ${ve[a]}，vl[${VEX[b]}]-${w} = ${vl[b] - w}，机动时间为 0 ⇒ 关键活动。`,
        );
      } else {
        eStates[`${a}>${b}`] = 'reject';
        actText = `${VEX[a]}→${VEX[b]}：余量 ${slack}`;
        push(
          'act',
          '非关键活动',
          `活动 ${VEX[a]}→${VEX[b]}（${w}）：ve[${VEX[a]}] = ${ve[a]}，vl[${VEX[b]}]-${w} = ${vl[b] - w}，有 ${slack} 的机动时间 ⇒ 非关键活动。`,
        );
      }
    }

    cur = -1;
    actText = '—';
    for (let i = 0; i < n; i++) crit[i] = true;
    push(
      'done',
      '完成',
      `关键路径由 ${critCount} 条关键活动组成，示例网中最短工期为 ${ve[n - 1]}，关键路径不唯一。`,
    );
    return steps;
  },
};
