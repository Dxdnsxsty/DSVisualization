/** Trace 协议：整个系统的唯一数据契约。播放、代码高亮、变量面板都只读 currentStep。 */

export type NodeState =
  | 'default'
  | 'active'
  | 'compare'
  | 'min'
  | 'sorted'
  | 'insert'
  | 'delete'
  | 'found'
  | 'visited';

export type SceneKind = 'array' | 'list' | 'tree' | 'graph';

/** 边的状态：树上已选中的边 / 图中正在考察的边 / 被淘汰的边 */
export type EdgeState = 'default' | 'tree' | 'active' | 'candidate' | 'reject' | 'removed';

/** 一条边。树用 parent→child，图用 from→to，权值放在 label 里。 */
export interface SceneEdge {
  from: string;
  to: string;
  label?: string;
  state?: EdgeState;
  directed?: boolean;
  bidirectional?: boolean; // 无向边的两条邻接表记录均已接入
  /** 树边可标注是左孩子还是右孩子；图场景忽略此字段。渲染不依赖它，供断言与扩展使用。 */
  side?: 'left' | 'right';
}

/** 一个可视图元。id 必须在该算法全程稳定，渲染层靠 key + CSS transform 做位移动画。 */
export interface SceneNode {
  id: string;
  value: string;
  state?: NodeState;
  label?: string; // 节点下方的指针/下标标签，例如 i、j、min
  badge?: string; // 节点上方的角标，例如位序
  /** 归一化坐标 0–1，仅 tree / graph 使用；缺省时由 layout 自动排布 */
  at?: { x: number; y: number };
}

export interface ScenePointer {
  outside?: number; // 数组边界之外的下标，仅用于展示
  label: string;
  index: number | null; // null 表示指向 NULL
  axis?: 'row'; // 矩阵行指针位于行首左侧
}

export interface ListLink {
  from: string;
  to: string | null;
  field: 'next' | 'prior';
}

/** 辅助结构：归并排序的目标数组、基数排序的桶等，渲染在主舞台下方。 */
export interface SceneAux {
  label: string;
  layout?: 'stack' | 'call-stack' | 'queue';
  capacity?: number; // 辅助栈固定槽位数，空栈时仍显示容器
  nodes: SceneNode[];
  pointers?: ScenePointer[];
  cols?: number;
}

export interface Scene {
  kind: SceneKind;
  nodes: SceneNode[]; // 数组顺序即从左到右的排列顺序
  pointers?: ScenePointer[];
  capacity?: number; // 顺序表固定格子数（含空格子）
  layout?: 'stack' | 'call-stack' | 'ring-queue' | 'matrix' | 'string-match';
  note?: string;
  detached?: string[]; // 链表：这些结点尚未接入链（用于演示 s->next 赋值前的中间状态）
  circular?: boolean; // 链表：尾结点的 next 指回首结点
  listLinks?: ListLink[]; // 明确指定链表指针时，连线不由画面位置推断
  edges?: SceneEdge[]; // tree / graph
  graphTrace?: 'traversal' | 'adjacency' | 'topology'; // 区分发现路径、邻接表写入与拓扑删边
  adjacency?: { vertex: string; neighbors: string[]; active: boolean; inserted?: string }[];
  subtrees?: { root: string; active?: SceneEdge['side'] }; // 当前递归结点的左右子树
  cols?: number; // array 折行成二维网格（矩阵、哈希表）时每行格子数
  aux?: SceneAux;
  output?: { label: string; values: string[] }; // 累计输出，顺序与当前步骤一致
  huffman?: { wpl: number; rows: { id: string; symbol: string; weight: number; bits: string; path: string[] }[] };
  shortestPath?: {
    source: string;
    complete: boolean;
    rows: { id: string; vertex: string; distance: number | null; predecessor: string | null; settled: boolean; changed: boolean; path: string[] }[];
  };
  distanceMatrix?: { labels: string[]; values: string[][]; k: number | null; i: number | null; j: number | null; updated: boolean };
  primTable?: { vertex: string; lowcost: number | null; candidate: string | null; selected: boolean; changed: boolean }[];
  disjointSet?: {
    groups: { root: string; members: string[] }[];
    parents: { vertex: string; parent: string }[];
    current?: { from: string; to: string; roots: [string, string]; action: 'check' | 'union' | 'reject' };
  };
}

/** 累计关键字比较、交换与数据写入；writes 包含原数组及辅助数组/桶，交换计两次写入。 */
export interface SortMetrics {
  comparisons: number;
  swaps: number;
  writes: number;
  auxiliaryWrites?: number; // writes 中写入辅助数组/桶的部分；省略表示 0
}

export interface TraceStep {
  id: number;
  anchor: string; // 行锚点，不依赖具体行号；切换语言时靠它对齐
  phase: string; // 阶段名，用于进度条分段
  scene: Scene; // 该步的完整快照（必须独立，不可复用上一步对象）
  vars: Record<string, string | number>;
  callStack?: string[]; // 递归算法填充，变量面板的「调用栈」页签读取
  caption: string;
  duration?: number;
  metrics?: SortMetrics; // 当前步骤执行后的累计快照；未接入统计时省略
}

export interface CodeLine {
  text: string;
  anchor?: string;
}

export interface DocSection {
  heading: string;
  body: string;
  points?: string[];
}

export interface QuizItem {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

/** 输入规则：由算法自己声明，Controls 据此校验并提供合法的「随机」输入 */
export interface InputSpec {
  format?: 'string-match' | 'graph-size' | 'tree-level';
  /** 单个数值的允许范围（含端点） */
  min?: number;
  max?: number;
  /** 元素个数范围 */
  minLen?: number;
  maxLen?: number;
  /** 额外约束：返回错误文案，null 表示通过 */
  check?: (input: number[]) => string | null;
  /** 生成一组合法输入，供「随机」按钮使用 */
  random?: () => number[];
}

export interface AlgorithmMeta {
  slug: string; // 'sort/select-sort'
  title: string;
  chapter: string; // 对应教材章节，面向课程学习者
  category: string; // 分类 id
  summary: string;
  complexity: { time: string; space: string; extra?: string };
  difficulty: '入门' | '进阶';
  inputHint: string;
  defaultInput: number[];
  /** 省略时按「2–10 个 -999~999 的整数」处理 */
  input?: InputSpec;
  graphCases?: { id: number; label: string; description: string }[];
  customGraph?: CustomGraphKind;
  code: Record<string, CodeLine[]>; // 每种语言都必须覆盖全部行锚点
  runnable?: (lang: string, input: number[], code: string) => string;
  doc: DocSection[];
  quiz: QuizItem[];
  generate: (input: number[]) => TraceStep[];
}

export type CustomGraphKind = 'undirected' | 'directed' | 'weighted' | 'weighted-signed';
