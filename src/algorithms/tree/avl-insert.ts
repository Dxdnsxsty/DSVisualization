import type { AlgorithmMeta, SceneEdge, TraceStep } from '../../engine/types';
import { edge, makeStep, node, treeScene } from '../../engine/scene';

type Rec = { id: string; key: number; left: string | null; right: string | null; h: number };
export const avlInsert: AlgorithmMeta = {
  slug: 'tree/avl-insert', title: '平衡二叉树 · AVL 插入', chapter: '第 7 章 树和二叉树', category: 'ch7', summary: '连续插入关键字；一旦失衡，按 LL / RR / LR / RL 旋转恢复平衡。', complexity: { time: 'O(log n)', space: 'O(1)' }, difficulty: '进阶',
  inputHint: '输入 3–7 个互不相同的整数。默认序列依次触发 LL、LR、RL、RR；也可用文档中的三数案例单独练习。', defaultInput: [60, 20, 10, 40, 50, 30, 70], input: { min: -999, max: 999, minLen: 3, maxLen: 7, check: (v) => new Set(v).size === v.length ? null : '关键字必须互不相同', random: () => { const n = 3 + Math.floor(Math.random() * 5); const out = new Set<number>(); while (out.size < n) out.add(10 + Math.floor(Math.random() * 90)); return [...out]; } },
  code: { cpp: [{ text: 'Node* InsertAVL(Node* t, int x) {', anchor: 'insert' }, { text: '  if (!t) return new Node(x);', anchor: 'insert' }, { text: '  if (x < t->key) t->left = InsertAVL(t->left, x);' }, { text: '  else t->right = InsertAVL(t->right, x);' }, { text: '  UpdateHeight(t);', anchor: 'check' }, { text: '  int bf = Balance(t);' }, { text: '  if (bf > 1 && Balance(t->left) < 0) t->left = RotateLeft(t->left);', anchor: 'rotateLR' }, { text: '  if (bf < -1 && Balance(t->right) > 0) t->right = RotateRight(t->right);', anchor: 'rotateRL' }, { text: '  if (bf > 1) return RotateRight(t);', anchor: 'rotate' }, { text: '  if (bf < -1) return RotateLeft(t);', anchor: 'rotate' }, { text: '  return t;', anchor: 'done' }, { text: '}' }], python: [{ text: 'def insert_avl(t, x):', anchor: 'insert' }, { text: '    if not t: return Node(x)', anchor: 'insert' }, { text: '    if x < t.key: t.left = insert_avl(t.left, x)' }, { text: '    else: t.right = insert_avl(t.right, x)' }, { text: '    update_height(t)', anchor: 'check' }, { text: '    bf = balance(t)' }, { text: '    if bf > 1 and balance(t.left) < 0: t.left = rotate_left(t.left)', anchor: 'rotateLR' }, { text: '    if bf < -1 and balance(t.right) > 0: t.right = rotate_right(t.right)', anchor: 'rotateRL' }, { text: '    if bf > 1: return rotate_right(t)', anchor: 'rotate' }, { text: '    if bf < -1: return rotate_left(t)', anchor: 'rotate' }, { text: '    return t', anchor: 'done' }] },
  doc: [
    { heading: '先定位最低失衡祖先', body: '新关键字先按二叉排序树规则落到叶子。沿插入路径向上更新高度，bf = 左子树高 − 右子树高；第一次出现 |bf| = 2 的结点就是最低失衡祖先，只需在这里调整。结点上方的 h 标记为当前高度。', points: ['bf = +2：左侧过高；bf = -2：右侧过高', '外侧插入使用一次单旋，内侧插入使用两次旋转', '旋转不改变中序序列，因此仍保持 BST 性质'] },
    { heading: '四种失衡：输入、形状与动作', body: '可把下面每一行的三个数直接填入输入框，观察最小的可复现实例。默认的 60,20,10,40,50,30,70 会按顺序覆盖四种情况。', points: ['LL：60, 20, 10；插入在左孩子的左侧，对失衡根右旋。', 'RR：10, 20, 30；插入在右孩子的右侧，对失衡根左旋。', 'LR：30, 10, 20；插入在左孩子的右侧，先左旋左孩子，再右旋失衡根。', 'RL：10, 30, 20；插入在右孩子的左侧，先右旋右孩子，再左旋失衡根。'] },
  ],
  quiz: [
    { q: '插入在“右孩子的左子树”导致失衡时，应采用？', options: ['RL 双旋', 'LL 单旋', 'RR 单旋', '不调整'], answer: 0, explain: '这是 RL 型：先右旋右孩子，再左旋失衡根。' },
    { q: '结点的平衡因子 bf = 左高 − 右高。bf = +2 且新结点位于左孩子右侧时，应当？', options: ['先左旋左孩子，再右旋根', '只右旋根', '先右旋右孩子，再左旋根', '只左旋根'], answer: 0, explain: '这是 LR 型；先把折线拉直，再对失衡根右旋。' },
  ],
  generate: (input) => {
    const map = new Map<string, Rec>(); let root: string | null = null; let next = 0; let step = 0; const out: TraceStep[] = []; let hot: string | null = null;
    const height = (id: string | null) => id ? map.get(id)!.h : 0;
    const refresh = (id: string) => { const n = map.get(id)!; n.h = 1 + Math.max(height(n.left), height(n.right)); return n; };
    const bf = (id: string) => { const n = map.get(id)!; return height(n.left) - height(n.right); };
    const snapshot = (anchor: string, phase: string, caption: string) => {
      const edges: SceneEdge[] = []; for (const n of map.values()) { if (n.left) edges.push({ ...edge(n.id, n.left, undefined, 'tree'), side: 'left' }); if (n.right) edges.push({ ...edge(n.id, n.right, undefined, 'tree'), side: 'right' }); }
      out.push(makeStep(step++, anchor, phase, treeScene([...map.values()].map((n) => node(n.id, n.key, n.id === hot ? 'active' : n.id === root ? 'found' : 'default', undefined, `h=${n.h}`)), edges, `根 ${root ? map.get(root)!.key : 'NULL'} · 已插入 ${map.size} 个结点`), { 当前结点: hot ? map.get(hot)!.key : '—', 根: root ? map.get(root)!.key : 'NULL', 平衡因子: hot ? bf(hot) : '—' }, caption));
    };
    const rotateLeft = (x: string) => { const y = map.get(x)!.right!; map.get(x)!.right = map.get(y)!.left; map.get(y)!.left = x; refresh(x); refresh(y); return y; };
    const rotateRight = (y: string) => { const x = map.get(y)!.left!; map.get(y)!.left = map.get(x)!.right; map.get(x)!.right = y; refresh(y); refresh(x); return x; };
    const insert = (id: string | null, key: number): string => {
      if (!id) { const n = `a${next++}`; map.set(n, { id: n, key, left: null, right: null, h: 1 }); hot = n; snapshot('insert', '插入叶子', `创建叶子结点 ${key}。`); return n; }
      const n = map.get(id)!; hot = id; snapshot('insert', '比较定位', `${key} ${key < n.key ? '<' : '>'} ${n.key}，进入${key < n.key ? '左' : '右'}子树。`); if (key < n.key) n.left = insert(n.left, key); else n.right = insert(n.right, key); refresh(id); hot = id; snapshot('check', '更新高度', `回溯到 ${n.key}，平衡因子 bf = ${bf(id)}。`);
      if (bf(id) > 1) {
        const left = n.left!; const type = key < map.get(left)!.key ? 'LL' : 'LR';
        if (type === 'LR') { const child = map.get(left)!.key; n.left = rotateLeft(left); hot = n.left; snapshot('rotateLR', 'LR：第一旋', `LR 型第 1 步：左旋左孩子 ${child}，把折线转为 LL。`); }
        const oldRoot = n.key; const r = rotateRight(id); hot = r; snapshot('rotate', type === 'LL' ? 'LL：右旋' : 'LR：第二旋', `${type} 型${type === 'LL' ? '：' : '第 2 步：'}右旋失衡根 ${oldRoot}，子树恢复平衡。`); return r;
      }
      if (bf(id) < -1) {
        const right = n.right!; const type = key > map.get(right)!.key ? 'RR' : 'RL';
        if (type === 'RL') { const child = map.get(right)!.key; n.right = rotateRight(right); hot = n.right; snapshot('rotateRL', 'RL：第一旋', `RL 型第 1 步：右旋右孩子 ${child}，把折线转为 RR。`); }
        const oldRoot = n.key; const r = rotateLeft(id); hot = r; snapshot('rotate', type === 'RR' ? 'RR：左旋' : 'RL：第二旋', `${type} 型${type === 'RR' ? '：' : '第 2 步：'}左旋失衡根 ${oldRoot}，子树恢复平衡。`); return r;
      }
      return id;
    };
    snapshot('insert', '初始化', '空树，准备按输入顺序逐个插入。'); for (const key of input) { root = insert(root, key); hot = root; snapshot('done', '本轮完成', `${key} 插入完成，当前根为 ${map.get(root)!.key}。`); } hot = null; snapshot('done', '完成', `连续插入结束，AVL 树保持平衡。`); return out;
  },
};
