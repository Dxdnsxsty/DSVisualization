/**
 * 场景布局器：把场景图元换算成像素坐标。
 * - 线性场景（array / list）由 Stage 直接按固定步长排列，不走这里
 * - 树：按「子结点均值」定 x、按深度定 y，二叉与多叉都适用
 * - 图：优先用节点自带的归一化坐标 at（算法作者可直接控制形状），否则环形排布
 */
import type { SceneEdge, SceneNode } from './types';

export interface LayoutPoint {
  x: number;
  y: number;
}

export interface LayoutResult {
  points: Record<string, LayoutPoint>;
  width: number;
  height: number;
}

const LEAF_GAP = 62;
const LEVEL_H = 86;
const PAD = 40;

interface TreeOpts {
  nodeR: number;
  levelH?: number;
  leafGap?: number;
}

/** 树布局：后序遍历，叶子依次占槽位，内部结点取子结点 x 的均值。 */
export function layoutTree(nodes: SceneNode[], edges: SceneEdge[], opts: TreeOpts): LayoutResult {
  const levelH = opts.levelH ?? LEVEL_H;
  const leafGap = opts.leafGap ?? LEAF_GAP;
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();
  for (const e of edges) {
    if (!children.has(e.from)) children.set(e.from, []);
    children.get(e.from)!.push(e.to);
    hasParent.add(e.to);
  }
  const root = nodes.find((n) => !hasParent.has(n.id))?.id ?? nodes[0]?.id;
  const xs = new Map<string, number>();
  const depth = new Map<string, number>();
  let slot = 0;

  const walk = (id: string, d: number): number => {
    depth.set(id, d);
    const kids = children.get(id) ?? [];
    if (kids.length === 0) {
      const x = slot++;
      xs.set(id, x);
      return x;
    }
    const childXs = kids.map((k) => walk(k, d + 1));
    const x = (Math.min(...childXs) + Math.max(...childXs)) / 2;
    xs.set(id, x);
    return x;
  };
  if (root) walk(root, 0);

  // 未接入树的孤立结点排到最右
  for (const n of nodes) if (!xs.has(n.id)) { xs.set(n.id, slot++); depth.set(n.id, 0); }

  const points: Record<string, LayoutPoint> = {};
  const maxDepth = Math.max(0, ...depth.values());
  const width = Math.max(560, PAD * 2 + Math.max(1, slot) * leafGap);
  for (const n of nodes) {
    points[n.id] = {
      x: PAD + (xs.get(n.id) ?? 0) * leafGap + leafGap / 2,
      y: PAD + opts.nodeR + (depth.get(n.id) ?? 0) * levelH,
    };
  }
  return { points, width, height: PAD * 2 + opts.nodeR * 2 + maxDepth * levelH };
}

interface GraphOpts {
  nodeR: number;
  /** 环形排布时的间距系数 */
  spread?: number;
}

/** 图布局：节点带 at 则按归一化坐标摆放，否则围成一圈。 */
export function layoutGraph(nodes: SceneNode[], opts: GraphOpts): LayoutResult {
  const n = Math.max(nodes.length, 1);
  const spread = opts.spread ?? 108;
  const width = Math.max(560, n * spread * 0.95);
  const height = Math.max(320, 200 + Math.ceil(n / 4) * 24);
  const points: Record<string, LayoutPoint> = {};
  const hasAt = nodes.every((nd) => nd.at);
  if (hasAt) {
    for (const nd of nodes) {
      points[nd.id] = {
        x: PAD + nd.at!.x * (width - PAD * 2),
        y: PAD + nd.at!.y * (height - PAD * 2),
      };
    }
    return { points, width, height };
  }
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min((width - PAD * 2) / 2 - opts.nodeR, (height - PAD * 2) / 2 - opts.nodeR);
  nodes.forEach((nd, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    points[nd.id] = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  return { points, width, height };
}
