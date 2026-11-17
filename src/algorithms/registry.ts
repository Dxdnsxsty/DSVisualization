import type { AlgorithmMeta } from '../engine/types';
import { sequenceInsert } from './array/sequence-insert';
import { sequenceDelete } from './array/sequence-delete';
import { symmetricMatrix } from './array/symmetric-matrix';
import { sparseTriple } from './array/sparse-triple';
import { triDiagonal } from './array/tri-diagonal';
import { linkHeadInsert } from './list/link-head-node';
import { linkSearch } from './list/link-search';
import { doublyInsert } from './list/doubly-insert';
import { circularJoseph } from './list/circular-joseph';
import { listReverse } from './list/reverse';
import { seqStack } from './stack/seq-stack';
import { linkedStack } from './stack/linked-stack';
import { circularQueue } from './queue/circular-queue';
import { linkedQueue } from './queue/linked-queue';
import { bracketMatch } from './stack/bracket-match';
import { postfixEval } from './stack/postfix-eval';
import { factorial } from './recursion/factorial';
import { bfMatch } from './string/bf-match';
import { kmpMatch } from './string/kmp';
import { preorderTree } from './tree/preorder';
import { inorderTree } from './tree/inorder';
import { postorderTree } from './tree/postorder';
import { levelorderTree } from './tree/levelorder';
import { bstInsert } from './tree/bst-insert';
import { huffmanTree } from './tree/huffman';
import { avlInsert } from './tree/avl-insert';
import { bstSearch } from './tree/bst-search';
import { dfsGraph } from './graph/dfs';
import { adjList } from './graph/adj-list';
import { bfsGraph } from './graph/bfs';
import { primMst } from './graph/prim';
import { kruskalMst } from './graph/kruskal';
import { dijkstraShortest } from './graph/dijkstra';
import { topoSort } from './graph/topo-sort';
import { floydShortest } from './graph/floyd';
import { bellmanFord } from './graph/bellman-ford';
import { criticalPath } from './graph/critical-path';
import { sequentialSearch } from './search/sequential-search';
import { binarySearch } from './search/binary-search';
import { hashLinear } from './search/hash-linear';
import { hashChain } from './search/hash-chain';
import { insertSort } from './sort/insert-sort';
import { bubbleSort } from './sort/bubble-sort';
import { quickSort } from './sort/quick-sort';
import { selectSort } from './sort/select-sort';
import { heapSort } from './sort/heap-sort';
import { mergeSort } from './sort/merge-sort';
import { shellSort } from './sort/shell-sort';
import { radixSort } from './sort/radix-sort';
import { binaryInsertSort } from './sort/binary-insert';

export { validateAlgorithm, validateAll } from '../engine/validate';

/** 章节顺序按《数据结构教程》（李春葆等，第 5 版）编排，方便同学对着教材目录找。 */
export interface Category {
  id: string;
  title: string;
  stub?: string;
  slugs: string[];
}

export const categories: Category[] = [
  {
    id: 'ch2',
    title: '第 2 章 · 线性表',
    slugs: ['array/sequence-insert', 'array/sequence-delete', 'list/link-head-node', 'list/link-search', 'list/doubly-insert', 'list/circular-joseph', 'list/reverse'],
  },
  {
    id: 'ch3',
    title: '第 3 章 · 栈和队列',
    slugs: ['stack/seq-stack', 'stack/linked-stack', 'queue/circular-queue', 'queue/linked-queue', 'stack/bracket-match', 'stack/postfix-eval'],
  },
  { id: 'ch4', title: '第 4 章 · 串', slugs: ['string/bf-match', 'string/kmp'] },
  { id: 'ch5', title: '第 5 章 · 递归', slugs: ['recursion/factorial'] },
  { id: 'ch6', title: '第 6 章 · 数组和广义表', slugs: ['array/symmetric-matrix', 'array/tri-diagonal', 'array/sparse-triple'] },
  {
    id: 'ch7',
    title: '第 7 章 · 树和二叉树',
    slugs: ['tree/preorder', 'tree/inorder', 'tree/postorder', 'tree/levelorder', 'tree/bst-insert', 'tree/avl-insert', 'tree/huffman'],
  },
  {
    id: 'ch8',
    title: '第 8 章 · 图',
    slugs: ['graph/adj-list', 'graph/dfs', 'graph/bfs', 'graph/prim', 'graph/kruskal', 'graph/dijkstra', 'graph/topo-sort', 'graph/floyd', 'graph/bellman-ford', 'graph/critical-path'],
  },
  {
    id: 'ch9',
    title: '第 9 章 · 查找',
    slugs: ['search/sequential-search', 'search/binary-search', 'tree/bst-search', 'search/hash-linear', 'search/hash-chain'],
  },
  {
    id: 'ch10',
    title: '第 10 章 · 内排序',
    slugs: ['sort/insert-sort', 'sort/binary-insert', 'sort/shell-sort', 'sort/bubble-sort', 'sort/quick-sort', 'sort/select-sort', 'sort/heap-sort', 'sort/merge-sort', 'sort/radix-sort'],
  },
];

export const algorithms: AlgorithmMeta[] = [
  sequenceInsert,
  sequenceDelete,
  symmetricMatrix,
  sparseTriple,
  triDiagonal,
  linkHeadInsert,
  linkSearch,
  doublyInsert,
  circularJoseph,
  listReverse,
  seqStack,
  linkedStack,
  circularQueue,
  linkedQueue,
  bracketMatch,
  postfixEval,
  factorial,
  bfMatch,
  kmpMatch,
  preorderTree,
  inorderTree,
  postorderTree,
  levelorderTree,
  bstInsert,
  huffmanTree,
  avlInsert,
  bstSearch,
  dfsGraph,
  adjList,
  bfsGraph,
  primMst,
  kruskalMst,
  dijkstraShortest,
  topoSort,
  floydShortest,
  bellmanFord,
  criticalPath,
  sequentialSearch,
  binarySearch,
  hashLinear,
  hashChain,
  insertSort,
  bubbleSort,
  quickSort,
  selectSort,
  heapSort,
  mergeSort,
  shellSort,
  radixSort,
  binaryInsertSort,
];

export function getAlgorithm(slug: string): AlgorithmMeta | undefined {
  return algorithms.find((a) => a.slug === slug);
}
