import { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import type { EdgeState, NodeState, Scene, SceneEdge } from '../engine/types';
import { layoutGraph, layoutTree } from '../engine/layout';

const COLOR: Record<NodeState, { fill: string; stroke: string }> = {
  default: { fill: '#E6F1FB', stroke: '#85B7EB' },
  active: { fill: '#EEEDFE', stroke: '#7F77DD' },
  compare: { fill: '#EEEDFE', stroke: '#534AB7' },
  min: { fill: '#FAEEDA', stroke: '#BA7517' },
  sorted: { fill: '#E1F5EE', stroke: '#1D9E75' },
  insert: { fill: '#EAF3DE', stroke: '#639922' },
  delete: { fill: '#FCEBEB', stroke: '#E24B4A' },
  found: { fill: '#E1F5EE', stroke: '#0F6E56' },
  visited: { fill: '#F1EFE8', stroke: '#888780' },
};

const EDGE_COLOR: Record<EdgeState, string> = {
  default: '#C2C7D0',
  tree: '#2C3E50',
  active: '#225EFC',
  candidate: '#F99000',
  reject: '#DCE0E7',
};

const LEGEND: { state: NodeState; text: string }[] = [
  { state: 'active', text: '当前指针' },
  { state: 'compare', text: '正在比较' },
  { state: 'min', text: '当前最小' },
  { state: 'insert', text: '新写入' },
  { state: 'delete', text: '待删除' },
  { state: 'sorted', text: '已归位' },
  { state: 'found', text: '命中' },
  { state: 'visited', text: '已访问' },
];

const NODE_R = 21;

interface Props {
  scene: Scene;
}

/** SVG 舞台：图元 id 稳定 + CSS transform 过渡 = 简化版 FLIP，交换/插入自带位移动画。 */
export const Stage = forwardRef<HTMLDivElement, Props>(function Stage({ scene }, ref) {
  const isTreeGraph = scene.kind === 'tree' || scene.kind === 'graph';
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hintRight, setHintRight] = useState(false);

  // 画布比可视宽度更宽时，右侧浮一层渐隐提示；滚到末尾就撤掉，避免误以为还有内容
  const syncHint = () => {
    const el = canvasRef.current;
    if (!el) return;
    const overflow = el.scrollWidth - el.clientWidth > 8;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    setHintRight(overflow && !atEnd);
  };
  useLayoutEffect(syncHint);

  return (
    <div className="panel stage" ref={ref}>
      <div className="stage-head">
        <span>动画舞台</span>
        <span className="muted">{scene.note ?? ''}</span>
      </div>
      <div className="stage-viewport">
        <div className="stage-canvas" ref={canvasRef} onScroll={syncHint}>
          {isTreeGraph ? <TreeGraphSvg scene={scene} /> : <LinearSvg scene={scene} />}
        </div>
        {hintRight && <span className="scroll-hint" aria-hidden="true" />}
      </div>
      {scene.aux && (
        <div className="aux-wrap">
          <span className="aux-label">{scene.aux.label}</span>
          <div className="aux-row">
            {scene.aux.nodes.map((n) => {
              const c = COLOR[n.state ?? 'default'];
              return (
                <span
                  key={n.id}
                  className="aux-cell"
                  style={{ background: c.fill, borderColor: c.stroke }}
                  title={n.label}
                >
                  {n.value === '' ? '\u00a0' : n.value}
                </span>
              );
            })}
          </div>
        </div>
      )}
      <div className="legend">
        {isTreeGraph
          ? [
              <span key="e-tree" className="legend-item">
                <i style={{ background: '#2C3E50', borderColor: '#2C3E50' }} />
                已确定的边
              </span>,
              <span key="e-act" className="legend-item">
                <i style={{ background: '#225EFC', borderColor: '#225EFC' }} />
                正在考察
              </span>,
              <span key="e-cand" className="legend-item">
                <i style={{ background: '#F99000', borderColor: '#F99000' }} />
                候选边
              </span>,
            ]
          : null}
        {LEGEND.map((l) => (
          <span key={l.state} className="legend-item">
            <i style={{ background: COLOR[l.state].fill, borderColor: COLOR[l.state].stroke }} />
            {l.text}
          </span>
        ))}
      </div>
    </div>
  );
});

/** 树 / 图：圆形结点 + 带状态的边，坐标由 layout 统一给出。 */
function TreeGraphSvg({ scene }: { scene: Scene }) {
  const edges: SceneEdge[] = scene.edges ?? [];
  const isTree = scene.kind === 'tree';
  const lay = isTree
    ? layoutTree(scene.nodes, edges, { nodeR: NODE_R })
    : layoutGraph(scene.nodes, { nodeR: NODE_R });

  return (
    <svg
      viewBox={`0 0 ${lay.width} ${lay.height}`}
      width="100%"
      role="img"
      aria-label="当前步骤的树 / 图状态"
    >
      <defs>
        <marker id="dsv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#2C3E50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
        <marker id="dsv-arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#225EFC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
        <marker id="dsv-arrow-amber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#F99000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      {edges.map((e, i) => {
        const a = lay.points[e.from];
        const b = lay.points[e.to];
        if (!a || !b) return null;
        const st = e.state ?? 'default';
        const stroke = EDGE_COLOR[st];
        const dashed = st === 'candidate' || st === 'reject';
        const marker =
          e.directed || isTree
            ? st === 'active'
              ? 'url(#dsv-arrow-blue)'
              : st === 'candidate'
                ? 'url(#dsv-arrow-amber)'
                : 'url(#dsv-arrow)'
            : undefined;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        return (
          <g key={`${e.from}>${e.to}-${i}`}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={stroke}
              strokeWidth={st === 'active' ? 2.4 : 1.6}
              strokeDasharray={dashed ? '5 4' : undefined}
              markerEnd={marker}
              style={{ transition: 'stroke 300ms ease, stroke-width 300ms ease' }}
            />
            {e.label && (
              <>
                <rect
                  x={mx - 11}
                  y={my - 9}
                  width={22}
                  height={17}
                  rx={4}
                  fill="#FFFFFF"
                  opacity={0.92}
                />
                <text x={mx} y={my + 3} textAnchor="middle" fontSize="11" fill="#5F5E5A" fontFamily="monospace">
                  {e.label}
                </text>
              </>
            )}
          </g>
        );
      })}

      {scene.nodes.map((n) => {
        const p = lay.points[n.id];
        if (!p) return null;
        const c = COLOR[n.state ?? 'default'];
        return (
          <g key={n.id} style={{ transform: `translate(${p.x}px, ${p.y}px)`, transition: 'transform 340ms cubic-bezier(0.22, 0.8, 0.2, 1)' }}>
            <circle r={NODE_R} strokeWidth="1.4" style={{ fill: c.fill, stroke: c.stroke, transition: 'fill 200ms ease, stroke 200ms ease' }} />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={n.value.length > 2 ? 12 : 14}
              fontFamily="monospace"
              fill="#2C2C2A"
            >
              {n.value}
            </text>
            {n.label && (
              <text y={NODE_R + 15} textAnchor="middle" fontSize="11" fill="#993C1D" fontFamily="monospace">
                {n.label}
              </text>
            )}
            {n.badge && (
              <text y={-NODE_R - 8} textAnchor="middle" fontSize="11" fill="#3C3489" fontFamily="monospace">
                {n.badge}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** 数组 / 链表：按固定步长排列；cols > 1 时折成二维网格（矩阵、哈希表）。 */
function LinearSvg({ scene }: { scene: Scene }) {
  const cw = 62;
  const gap = 18;
  const x0 = 34;
  const cols = scene.cols && scene.cols > 0 ? scene.cols : Math.max(scene.nodes.length, scene.capacity ?? 0, 1);
  const rows = Math.max(1, Math.ceil(scene.nodes.length / cols));
  const grid = rows > 1;
  const rowH = 104;
  const y0 = grid ? 46 : 76;
  const height = grid ? 46 + rows * rowH : 200;
  const width = Math.max(560, x0 * 2 + cols * (cw + gap));
  const detached = new Set(scene.detached ?? []);
  const nullPointers = (scene.pointers ?? []).filter((p) => p.index === null).map((p) => p.label);
  const isList = scene.kind === 'list';
  const showIndex = !grid;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="当前步骤的数据结构状态">
      <defs>
        <marker id="dsv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#5F5E5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      {scene.nodes.map((n, idx) => {
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        const x = x0 + c * (cw + gap);
        const y = y0 + r * rowH;
        const col = COLOR[n.state ?? 'default'];
        const isDetached = detached.has(n.id);
        const labels = (scene.pointers ?? []).filter((p) => p.index === idx).map((p) => p.label);
        return (
          <g key={n.id} style={{ transform: `translate(${x}px, ${y}px)`, transition: 'transform 340ms cubic-bezier(0.22, 0.8, 0.2, 1)' }}>
            {labels.length > 0 && (
              <text x={cw / 2} y={-30} textAnchor="middle" fontSize="12" fill="#3C3489" fontFamily="monospace">
                {labels.join(' ')}
              </text>
            )}
            {labels.length > 0 && (
              <path d={`M${cw / 2} -26 V-6`} fill="none" stroke="#534AB7" strokeWidth="1" markerEnd="url(#dsv-arrow)" />
            )}
            <rect x={0} y={0} width={cw} height={44} rx={8} strokeWidth="1" style={{ fill: col.fill, stroke: col.stroke, transition: 'fill 200ms ease, stroke 200ms ease' }} />
            <text x={cw / 2} y={23} textAnchor="middle" dominantBaseline="central" fontSize="15" fontFamily="monospace" fill="#2C2C2A">
              {n.value}
            </text>
            {showIndex && (
              <text x={cw / 2} y={60} textAnchor="middle" fontSize="11" fill="#5F5E5A" fontFamily="monospace">
                {isList ? (n.label ?? '') : String(idx)}
              </text>
            )}
            {!showIndex && n.label && (
              <text x={cw / 2} y={60} textAnchor="middle" fontSize="11" fill="#5F5E5A" fontFamily="monospace">
                {n.label}
              </text>
            )}
            {n.label && !isList && showIndex && (
              <text x={cw / 2} y={76} textAnchor="middle" fontSize="11" fill="#993C1D" fontFamily="monospace">
                {n.label}
              </text>
            )}
            {isList && (
              <path
                d={`M${cw + 3} 22 H${cw + gap - 3}`}
                fill="none"
                stroke={isDetached ? '#B4B2A9' : '#5F5E5A'}
                strokeWidth="1.5"
                strokeDasharray={isDetached ? '3 3' : undefined}
                markerEnd={isDetached ? undefined : 'url(#dsv-arrow)'}
              />
            )}
          </g>
        );
      })}

      {isList && scene.nodes.length > 0 && (
        <g>
          <text x={x0 + scene.nodes.length * (cw + gap) + 2} y={y0 + 27} fontSize="12" fill="#5F5E5A" fontFamily="monospace">NULL</text>
          {nullPointers.length > 0 && (
            <text x={x0 + scene.nodes.length * (cw + gap) + 2} y={y0 - 30} fontSize="12" fill="#3C3489" fontFamily="monospace">
              {nullPointers.join(' ')} → NULL
            </text>
          )}
        </g>
      )}
      {isList && scene.nodes.length === 0 && (
        <g>
          <text x={x0} y={y0 + 27} fontSize="14" fill="#5F5E5A" fontFamily="monospace">head → NULL</text>
        </g>
      )}
    </svg>
  );
}
