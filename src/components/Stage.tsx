import { forwardRef, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { EdgeState, ListLink, NodeState, Scene, SceneEdge } from '../engine/types';
import { layoutGraph, layoutTree, type LayoutPoint } from '../engine/layout';

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
  removed: '#9AA2AF',
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
  fullscreenControls?: ReactNode;
}

/** SVG 舞台：图元 id 稳定 + CSS transform 过渡 = 简化版 FLIP，交换/插入自带位移动画。 */
export const Stage = forwardRef<HTMLDivElement, Props>(function Stage({ scene, fullscreenControls }, ref) {
  const isTreeGraph = scene.kind === 'tree' || scene.kind === 'graph';
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [hintRight, setHintRight] = useState(false);
  const [selectedVertex, setSelectedVertex] = useState<string | null>(null);
  useLayoutEffect(() => { setSelectedVertex(null); }, [scene.shortestPath?.source]);
  const selectedPath = scene.shortestPath?.rows.find(({ id }) => id === selectedVertex);
  const selectedEdges = new Set(selectedPath?.path.slice(1).map((id, index) => `${selectedPath.path[index]}>${id}`));
  const pathScene: Scene = selectedPath ? { ...scene, edges: scene.edges?.map((edge) =>
    selectedEdges.has(`${edge.from}>${edge.to}`) ? { ...edge, state: 'active' } : edge) } : scene;

  // 画布比可视宽度更宽时，右侧浮一层渐隐提示；滚到末尾就撤掉，避免误以为还有内容
  const syncHint = () => {
    const el = canvasRef.current;
    if (!el) return;
    const overflow = el.scrollWidth - el.clientWidth > 8;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    setHintRight(overflow && !atEnd);
  };
  useLayoutEffect(syncHint);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const group = contentRef.current;
    if (!viewport || !group) return;
    const fitFullscreen = () => {
      const stage = viewport.closest('.stage');
      if (document.fullscreenElement !== stage) {
        group.style.removeProperty('--fullscreen-scale');
        return;
      }
      // offsetWidth/Height 不包含 transform，缩放不会反过来影响测量。
      const scale = Math.min(
        (viewport.clientWidth - 32) / group.offsetWidth,
        (viewport.clientHeight - 32) / group.offsetHeight,
      );
      group.style.setProperty('--fullscreen-scale', String(Math.max(0.01, scale)));
    };
    const observer = new ResizeObserver(fitFullscreen);
    observer.observe(viewport);
    observer.observe(group);
    document.addEventListener('fullscreenchange', fitFullscreen);
    fitFullscreen();
    return () => {
      observer.disconnect();
      document.removeEventListener('fullscreenchange', fitFullscreen);
      group.style.removeProperty('--fullscreen-scale');
    };
  }, []);

  // 全屏先恢复 SVG 的固有宽度，再整体缩放，避免百分比宽度形成循环测量。
  useLayoutEffect(() => {
    canvasRef.current?.querySelectorAll('svg').forEach((svg) => {
      svg.style.setProperty('--intrinsic-width', `${svg.viewBox.baseVal.width}px`);
    });
  }, [scene]);

  return (
    <div className="panel stage" ref={ref}>
      <div className="stage-head">
        <span>动画舞台</span>
        <span className="muted">{scene.note ?? ''}</span>
      </div>
      <div className="stage-viewport" ref={viewportRef}>
        <div className="stage-content" ref={contentRef}>
        <div className="stage-canvas" ref={canvasRef} onScroll={syncHint}>
          {scene.shortestPath ? <div className="shortest-path-stage">
            <div className="shortest-path-graph"><TreeGraphSvg scene={pathScene} compact onSelectVertex={setSelectedVertex} /></div>
            <ShortestPathTable data={scene.shortestPath} selected={selectedVertex} onSelect={setSelectedVertex} />
          </div> : scene.adjacency ? <div className="adjacency-stage">
            <div className="adjacency-graph"><TreeGraphSvg scene={scene} compact /></div>
            <div className="adjacency-table"><AdjacencySvg scene={scene} /></div>
          </div> : scene.aux?.layout === 'queue' ? <div className="tree-queue-stage">
            <div className="queue-tree"><TreeGraphSvg scene={scene} compact /></div>
            <div className="queue-side">
              <span className="aux-label">{scene.aux.label}</span>
              <QueueSvg nodes={scene.aux.nodes} />
            </div>
          </div> : scene.aux?.layout === 'stack' || scene.aux?.layout === 'call-stack' ? <div className="bracket-stage">
            <div className={isTreeGraph ? 'stack-graph' : 'bracket-sequence'}>
              {isTreeGraph ? <TreeGraphSvg scene={scene} compact /> : <LinearSvg scene={scene} />}
            </div>
            <div className={scene.aux.layout === 'call-stack' ? 'bracket-stack call-stack-side' : 'bracket-stack'}>
              <span className="aux-label">{scene.aux.label}</span>
              <StackSvg compact scene={{ kind: 'array', layout: scene.aux.layout, nodes: scene.aux.nodes, pointers: scene.aux.pointers, capacity: scene.aux.capacity ?? scene.aux.nodes.length }} />
            </div>
          </div> : isTreeGraph ? <TreeGraphSvg scene={scene} /> :
            scene.layout === 'stack' || scene.layout === 'call-stack' ? <StackSvg scene={scene} /> :
              scene.layout === 'ring-queue' ? <RingQueueSvg scene={scene} /> : <LinearSvg scene={scene} />}
        </div>
      {scene.aux && !scene.aux.layout && (
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
          {scene.output && <div className="aux-wrap output-sequence" aria-label={scene.output.label}>
            <span className="aux-label">{scene.output.label}</span>
            <div className="aux-row">
              {scene.output.values.length ? scene.output.values.map((value, index) => <span className="output-item" key={index}>
                {index > 0 && <span aria-hidden="true">→</span>}
                <span className="aux-cell">{value}</span>
              </span>) : <span className="aux-label">尚未输出</span>}
            </div>
          </div>}
        </div>
        {hintRight && <span className="scroll-hint" aria-hidden="true" />}
      </div>
      <div className="legend">
        {scene.shortestPath ? <>
          <span className="legend-item"><i style={{ background: COLOR.found.fill, borderColor: COLOR.found.stroke }} />距离已确定</span>
          <span className="legend-item"><i style={{ background: COLOR.active.fill, borderColor: COLOR.active.stroke }} />待确定顶点</span>
          <span className="legend-item"><i style={{ background: COLOR.insert.fill, borderColor: COLOR.insert.stroke }} />本步更新</span>
          <span className="legend-item"><i style={{ background: EDGE_COLOR.active }} />所选路径</span>
        </> : scene.graphTrace === 'topology' ? <>
          <span className="legend-item"><i style={{ background: EDGE_COLOR.default }} />未删除的依赖边（实线）</span>
          <span className="legend-item"><i style={{ background: 'transparent', borderColor: EDGE_COLOR.removed, borderStyle: 'dashed' }} />已删除的依赖边（虚线）</span>
          <span className="legend-item"><i style={{ background: COLOR.active.fill, borderColor: COLOR.active.stroke }} />待输出顶点</span>
          <span className="legend-item"><i style={{ background: COLOR.sorted.fill, borderColor: COLOR.sorted.stroke }} />已输出顶点</span>
          <span className="legend-item"><i style={{ background: COLOR.insert.fill, borderColor: COLOR.insert.stroke }} />新入栈</span>
        </> : scene.graphTrace ? <>
          <span className="legend-item"><i style={{ background: COLOR.found.stroke }} />{scene.graphTrace === 'adjacency' ? '已挂接的方向' : '首次访问路径'}</span>
          <span className="legend-item"><i style={{ background: COLOR.found.fill, borderColor: COLOR.found.stroke }} />{scene.graphTrace === 'adjacency' ? '已写入邻接表' : '已标记访问'}</span>
          <span className="legend-item"><i style={{ background: EDGE_COLOR.active }} />正在考察或处理</span>
          {scene.aux?.layout === 'call-stack' && <span className="legend-item"><i style={{ background: COLOR.active.fill, borderColor: COLOR.active.stroke }} />当前调用</span>}
          {scene.aux?.layout === 'queue' && <>
            <span className="legend-item"><i style={{ background: COLOR.active.fill, borderColor: COLOR.active.stroke }} />当前队头</span>
            <span className="legend-item"><i style={{ background: COLOR.insert.fill, borderColor: COLOR.insert.stroke }} />新入队</span>
          </>}
        </> : <>
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
        </>}
      </div>
      {fullscreenControls && <div className="stage-fullscreen-controls">{fullscreenControls}</div>}
    </div>
  );
});

function ShortestPathTable({ data, selected, onSelect }: {
  data: NonNullable<Scene['shortestPath']>; selected: string | null; onSelect: (id: string) => void;
}) {
  const row = data.rows.find(({ id }) => id === selected);
  const vertex = (id: string) => data.rows.find((item) => item.id === id)?.vertex ?? id;
  return <div className="shortest-path-table">
    <table aria-label="Dijkstra 计算表">
      <caption>源点 {vertex(data.source)} · 点击顶点查看路径</caption>
      <thead><tr><th scope="col">顶点</th><th scope="col">距离</th><th scope="col">前驱</th><th scope="col">已确定</th></tr></thead>
      <tbody>{data.rows.map((item) => <tr key={item.id} data-vertex={item.vertex} className={item.changed ? 'path-row-updated' : undefined}>
        <th scope="row"><button className="vertex-select" aria-label={`查看 ${item.vertex} 的路径`} aria-pressed={selected === item.id} onClick={() => onSelect(item.id)}>{item.vertex}</button></th>
        <td>{item.distance ?? '∞'}</td><td>{item.predecessor ?? '—'}</td><td>{item.settled ? '是' : '否'}</td>
      </tr>)}</tbody>
    </table>
    <div className="path-detail" aria-live="polite" aria-label="所选路径">
      {!row ? '点击图中顶点或表中按钮，可查看当前步骤的路径。' : row.distance === null
        ? data.complete ? `${vertex(data.source)} 无法到达 ${row.vertex}，没有路径。` : `当前尚未发现通往 ${row.vertex} 的路径。`
        : <>{row.settled ? '已确定的最短路径' : '当前候选路径（尚未确定最短）'}：<br />{row.path.map(vertex).join(' → ')}<br />距离：{row.distance}</>}
    </div>
  </div>;
}

function SubtreeOutlines({ edges, points, focus }: {
  edges: SceneEdge[]; points: Record<string, LayoutPoint>; focus: NonNullable<Scene['subtrees']>;
}) {
  const descendants = (id: string): LayoutPoint[] => [points[id], ...edges.filter((edge) => edge.from === id).flatMap((edge) => descendants(edge.to))];
  const pad = NODE_R + 5;
  return edges.filter((edge) => edge.from === focus.root && edge.side).map((edge) => {
    const slots = descendants(edge.to);
    const x = Math.min(...slots.map((point) => point.x)) - pad;
    const y = Math.min(...slots.map((point) => point.y)) - pad;
    const w = Math.max(...slots.map((point) => point.x)) + pad - x;
    const h = Math.max(...slots.map((point) => point.y)) + pad - y;
    const active = edge.side === focus.active;
    const color = active ? 'var(--accent)' : 'var(--muted)';
    const label = edge.side === 'left' ? 'L · 左子树' : 'R · 右子树';
    return <g key={edge.to}>
      <title>{label}</title>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={active ? 'var(--accent-soft)' : 'none'}
        stroke={color} strokeWidth={active ? 2 : 1} strokeDasharray={active ? undefined : '4 3'} />
      <text x={x + w / 2} y={y - 6} textAnchor="middle" fill={color} fontSize="12" fontWeight="600">{edge.side === 'left' ? 'L' : 'R'}</text>
    </g>;
  });
}

/** 树 / 图：圆形结点 + 带状态的边，坐标由 layout 统一给出。 */
function TreeGraphSvg({ scene, compact = false, onSelectVertex }: { scene: Scene; compact?: boolean; onSelectVertex?: (id: string) => void }) {
  const markerId = useId();
  const markerUrl = (suffix: string) => `url(#${markerId}-${suffix})`;
  const edges: SceneEdge[] = scene.edges ?? [];
  const isTree = scene.kind === 'tree';
  const lay = isTree
    ? layoutTree(scene.nodes, edges, { nodeR: NODE_R })
    : layoutGraph(scene.nodes, { nodeR: NODE_R });
  const points = Object.values(lay.points);
  const padding = NODE_R + (scene.nodes.some(({ label, badge }) => label || badge) ? 24 : 12);
  const crop = compact && points.length > 0;
  const left = crop ? Math.min(...points.map(({ x }) => x)) - padding : 0;
  const top = crop ? Math.min(...points.map(({ y }) => y)) - padding : 0;
  const width = crop ? Math.max(...points.map(({ x }) => x)) + padding - left : lay.width;
  const height = crop ? Math.max(...points.map(({ y }) => y)) + padding - top : lay.height;

  return (
    <svg
      viewBox={`${left} ${top} ${width} ${height}`}
      width={compact ? width : '100%'}
      role="img"
      aria-label="当前步骤的树 / 图状态"
    >
      <defs>
        <marker id={`${markerId}-default`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#2C3E50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
        <marker id={`${markerId}-blue`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#225EFC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
        <marker id={`${markerId}-amber`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#F99000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
        {scene.graphTrace === 'topology' && <marker id={`${markerId}-removed`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke={EDGE_COLOR.removed} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>}
        {scene.graphTrace && <marker id={`${markerId}-path`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke={COLOR.found.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>}
      </defs>

      {isTree && scene.subtrees && <SubtreeOutlines edges={edges} points={lay.points} focus={scene.subtrees} />}

      {edges.map((e, i) => {
        const a = lay.points[e.from];
        const b = lay.points[e.to];
        if (!a || !b) return null;
        const st = e.state ?? 'default';
        const markedPath = scene.graphTrace && st === 'tree';
        const stroke = markedPath ? COLOR.found.stroke : EDGE_COLOR[st];
        const dashed = st === 'candidate' || st === 'reject' || st === 'removed';
        const marker =
          e.directed || isTree || e.bidirectional
            ? markerUrl(markedPath ? 'path' : st === 'removed' ? 'removed' : st === 'active' ? 'blue' : st === 'candidate' ? 'amber' : 'default')
            : undefined;
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        // 把路径箭头停在顶点外沿，避免箭头被后画的圆形顶点盖住。
        const inset = (markedPath || scene.graphTrace === 'topology' || scene.shortestPath) && marker && length > 0 ? Math.min(NODE_R + 3, length / 3) / length : 0;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        return (
          <g key={`${e.from}>${e.to}-${i}`}>
            <line
              x1={a.x + (e.bidirectional ? (b.x - a.x) * inset : 0)}
              y1={a.y + (e.bidirectional ? (b.y - a.y) * inset : 0)}
              x2={b.x - (b.x - a.x) * inset}
              y2={b.y - (b.y - a.y) * inset}
              stroke={stroke}
              strokeWidth={st === 'active' || markedPath ? 2.4 : 1.6}
              strokeDasharray={dashed ? '5 4' : undefined}
              markerEnd={marker}
              markerStart={e.bidirectional ? marker : undefined}
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
        const c = scene.graphTrace && n.state === 'visited' ? COLOR.found : COLOR[n.state ?? 'default'];
        return (
          <g key={n.id} role={onSelectVertex ? 'button' : undefined} tabIndex={onSelectVertex ? 0 : undefined}
            aria-label={onSelectVertex ? `查看 ${n.value} 的路径` : undefined}
            onClick={onSelectVertex ? () => onSelectVertex(n.id) : undefined}
            onKeyDown={onSelectVertex ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectVertex(n.id); } } : undefined}
            style={{ cursor: onSelectVertex ? 'pointer' : undefined, transform: `translate(${p.x}px, ${p.y}px)`, transition: 'transform 340ms cubic-bezier(0.22, 0.8, 0.2, 1)' }}>
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

function AdjacencySvg({ scene }: { scene: Scene }) {
  const arrowId = useId();
  const rows = scene.adjacency ?? [];
  const names = new Map(scene.nodes.map(({ id, value }) => [id, value]));
  const degrees = scene.nodes.map(({ id }) => (scene.edges ?? []).filter(({ from, to }) => from === id || to === id).length);
  const slotWidth = 70;
  const stepWidth = 92;
  const startX = 98;
  const width = startX + Math.max(1, ...degrees) * stepWidth + 52;
  const height = 42 + rows.length * 46;
  const arrow = `url(#${arrowId})`;

  return <svg className="adjacency-svg" viewBox={`0 0 ${width} ${height}`} width={width} role="img" aria-label="邻接表，顶点指向邻接结点链，链尾为 NULL">
    <defs><marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M2 1L9 5L2 9" fill="none" stroke="var(--muted)" strokeWidth="1.5" />
    </marker></defs>
    <text x={42} y={20} textAnchor="middle" fontSize="12" fill="var(--muted)">顶点表</text>
    <text x={startX} y={20} fontSize="12" fill="var(--muted)">邻接结点链（头插法）</text>
    {rows.map((row, index) => {
      const y = 36 + index * 46;
      const center = y + 15;
      const color = COLOR[row.active ? 'active' : 'default'];
      const chain = row.neighbors.map((id) => names.get(id)).join(' → ');
      return <g key={row.vertex}>
        <title>{`${names.get(row.vertex)} → ${chain ? `${chain} → ` : ''}NULL`}</title>
        <rect x={16} y={y} width={52} height={30} rx={4} fill={color.fill} stroke={color.stroke} />
        <text x={42} y={center} textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--text)">{names.get(row.vertex)}</text>
        <path d={`M70 ${center} H${startX - 4}`} fill="none" stroke="var(--muted)" strokeWidth="1.5" markerEnd={arrow} />
        {row.neighbors.map((neighbor, position) => {
          const x = startX + position * stepWidth;
          const inserted = neighbor === row.inserted;
          const style = COLOR[inserted ? 'insert' : 'default'];
          return <g key={neighbor}>
            <rect x={x} y={y} width={slotWidth} height={30} rx={4} fill={style.fill} stroke={style.stroke} />
            <path d={`M${x + 48} ${y} V${y + 30}`} stroke={style.stroke} />
            <text x={x + 24} y={center} textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--text)">{names.get(neighbor)}</text>
            <path d={`M${x + 58} ${center} H${x + stepWidth - 4}`} fill="none" stroke="var(--muted)" strokeWidth="1.5" markerEnd={arrow} />
          </g>;
        })}
        <text x={startX + row.neighbors.length * stepWidth} y={center} dominantBaseline="central" fontSize="12" fontFamily="monospace" fill="var(--muted)">NULL</text>
      </g>;
    })}
  </svg>;
}

function QueueSvg({ nodes }: { nodes: Scene['nodes'] }) {
  const width = 220;
  const top = 46;
  const rowHeight = 36;
  const bottom = top + Math.max(3, nodes.length) * rowHeight;
  return <svg className="queue-svg" viewBox={`54 0 ${width - 54} ${bottom + 40}`} width={width - 54} role="img" aria-label={`待访问队列，队头到队尾为 ${nodes.map(({ value }) => value).join('、') || '空'}`}>
    <text x={width / 2} y={24} textAnchor="middle" fontSize="12" fill="var(--muted)">↑ 队头出队</text>
    <path d={`M66 ${top} V${bottom} M154 ${top} V${bottom}`} fill="none" stroke="var(--muted)" strokeWidth="2" />
    {nodes.map((node, index) => {
      const y = top + index * rowHeight;
      const color = COLOR[node.state ?? 'default'];
      const label = nodes.length === 1 ? '头 / 尾' : index === 0 ? '队头' : index === nodes.length - 1 ? '队尾' : '';
      return <g key={node.id}>
        <rect x={72} y={y + 2} width={76} height={rowHeight - 4} rx={4} fill={color.fill} stroke={color.stroke} />
        <text x={width / 2} y={y + rowHeight / 2} textAnchor="middle" dominantBaseline="central" fontSize="15" fontFamily="monospace" fill="var(--text)">{node.value}</text>
        {label && <text x={162} y={y + rowHeight / 2} dominantBaseline="central" fontSize="12" fill="var(--accent)">{label}</text>}
      </g>;
    })}
    {nodes.length === 0 && <text x={width / 2} y={(top + bottom) / 2} textAnchor="middle" fontSize="13" fill="var(--muted)">空队列</text>}
    <text x={width / 2} y={bottom + 24} textAnchor="middle" fontSize="12" fill="var(--muted)">↑ 队尾入队</text>
  </svg>;
}

function StackSvg({ scene, compact = false }: { scene: Scene; compact?: boolean }) {
  const callStack = scene.layout === 'call-stack';
  const width = callStack ? 480 : 360;
  const opening = 48;
  const slotHeight = 32;
  const slotWidth = callStack ? 180 : 96;
  const left = (width - slotWidth) / 2;
  const right = left + slotWidth;
  const wallGap = 6;
  const capacity = scene.capacity ?? scene.nodes.length;
  const bottom = opening + capacity * slotHeight;
  const height = bottom + 42;
  const top = scene.pointers?.[0]?.index ?? null;
  const slotY = (index: number) => bottom - (index + 1) * slotHeight;
  const topY = top === null ? null : slotY(top) + slotHeight / 2;

  return (
    <svg className="stack-svg" viewBox={compact ? `${callStack ? '84 0 396' : '90 0 270'} ${height}` : `0 0 ${width} ${height}`} width={compact ? callStack ? 396 : 270 : '100%'} height={height} role="img"
      aria-label={callStack ? `递归调用栈，当前 ${top === null ? '空' : scene.nodes[top].value}` : top === null ? `顺序栈，容量 ${capacity}，空栈，top 等于负一` : `顺序栈，容量 ${capacity}，栈顶下标 ${top}`}>
      <text x={width / 2} y={26} textAnchor="middle" fontSize="13" fill="var(--muted)">{callStack ? '递归调用 ↓ 压栈 · 返回 ↑ 出栈' : '↓ 入栈 · ↑ 出栈'}</text>
      <text x={left - 25} y={opening - 7} textAnchor="middle" fontSize="11" fill="var(--muted)">{callStack ? '层数' : '下标'}</text>
      <path d={`M${left - wallGap} ${opening} V${bottom} H${right + wallGap} V${opening}`}
        fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {Array.from({ length: capacity }, (_, index) => {
        const cell = scene.nodes[index];
        const y = slotY(index);
        const occupied = cell?.value !== undefined && cell.value !== '';
        const color = COLOR[cell?.state ?? 'default'];
        return <g key={cell?.id ?? index}>
          <rect x={left} y={y + 2} width={slotWidth} height={slotHeight - 4} rx={4}
            fill={occupied ? color.fill : 'none'} stroke={occupied ? color.stroke : 'var(--faint)'}
            strokeDasharray={occupied ? undefined : '3 3'} />
          <text x={left - 25} y={y + slotHeight / 2} dominantBaseline="central" textAnchor="middle"
            fontSize="12" fontFamily="monospace" fill="var(--muted)">{callStack ? index + 1 : index}</text>
          {occupied && <text x={width / 2} y={y + slotHeight / 2} dominantBaseline="central" textAnchor="middle"
            fontSize="15" fontFamily="monospace" fill="var(--text)">{cell.value}</text>}
        </g>;
      })}
      {topY === null ? (
        <text x={right + 24} y={bottom + 23} fontSize="12" fill="var(--muted)">{callStack ? '调用栈为空' : 'top = -1（空栈）'}</text>
      ) : (
        <g>
          <path d={`M${right + 38} ${topY} H${right + 3} m5 -4 l-5 4 5 4`}
            fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x={right + 44} y={topY} dominantBaseline="central" fontSize="13" fill="var(--accent)">{callStack ? '当前调用' : `top = ${top}`}</text>
        </g>
      )}
      <text x={width / 2} y={bottom + 23} textAnchor="middle" fontSize="12" fill="var(--muted)">栈底</text>
    </svg>
  );
}

function RingQueueSvg({ scene }: { scene: Scene }) {
  const markerId = useId();
  const width = 420;
  const height = 346;
  const centerX = width / 2;
  const centerY = 165;
  const radius = 92;
  const stepAngle = 2 * Math.PI / scene.nodes.length;
  const point = (angle: number, distance: number) => ({
    x: Math.round(centerX + Math.cos(angle) * distance),
    y: Math.round(centerY + Math.sin(angle) * distance),
  });
  const marker = (suffix: string) => `url(#${markerId}-${suffix})`;

  return (
    <svg className="ring-queue-svg" viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="循环队列，槽位顺时针排列">
      <defs>
        {['default', 'accent'].map((style) => (
          <marker key={style} id={`${markerId}-${style}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M2 1L9 5L2 9" fill="none" stroke={style === 'accent' ? 'var(--accent)' : 'var(--muted)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        ))}
      </defs>
      {scene.nodes.map((node, index) => {
        const angle = index * stepAngle - Math.PI / 2;
        const slot = point(angle, radius);
        const subscript = point(angle, radius - 36);
        const start = point(angle + stepAngle * 0.32, radius);
        const end = point(angle + stepAngle * 0.68, radius);
        const isWrap = index === scene.nodes.length - 1;
        const pointers = scene.pointers?.filter((pointer) => pointer.index === index).map((pointer) => pointer.label) ?? [];
        const pointerStart = point(angle, radius + 41);
        const pointerEnd = point(angle, radius + 25);
        const label = point(angle, radius + 50);
        const color = COLOR[node.state ?? 'default'];

        return <g key={node.id}>
          <path d={`M${start.x} ${start.y} A${radius} ${radius} 0 0 1 ${end.x} ${end.y}`} fill="none"
            stroke={isWrap ? 'var(--accent)' : 'var(--muted)'} strokeWidth="1.5" markerEnd={marker(isWrap ? 'accent' : 'default')} />
          <circle cx={slot.x} cy={slot.y} r={21}
            fill={node.value === '' ? 'none' : color.fill} stroke={node.value === '' ? 'var(--faint)' : color.stroke}
            strokeDasharray={node.value === '' ? '3 3' : undefined} />
          <text x={slot.x} y={slot.y} textAnchor="middle" dominantBaseline="central" fontSize="15" fontFamily="monospace" fill="var(--text)">{node.value}</text>
          <text x={subscript.x} y={subscript.y} textAnchor="middle" dominantBaseline="central" fontSize="12" fontFamily="monospace" fill="var(--muted)">{index}</text>
          {pointers.length > 0 && <g>
            <path d={`M${pointerStart.x} ${pointerStart.y} L${pointerEnd.x} ${pointerEnd.y}`} fill="none" stroke="var(--accent)" strokeWidth="1.5" markerEnd={marker('accent')} />
            <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="central" fontSize="12" fontFamily="monospace" fill="var(--accent)">{pointers.join(' · ')}</text>
          </g>}
        </g>;
      })}
      <text x={centerX} y={centerY} textAnchor="middle" dominantBaseline="central" fontSize="13" fill="var(--muted)">顺时针回绕</text>
      <text x={centerX} y={height - 12} textAnchor="middle" fontSize="12" fill="var(--muted)">front 出队 · rear 入队</text>
    </svg>
  );
}

function ListArrows({ scene, links, x0, y, cellWidth, cellHeight, gap, arrow }: {
  scene: Scene; links: ListLink[]; x0: number; y: number; cellWidth: number; cellHeight: number; gap: number; arrow: string;
}) {
  const indices = new Map(scene.nodes.map((node, index) => [node.id, index]));
  const stepWidth = cellWidth + gap;
  const bottom = y + cellHeight;
  const doubly = links.some(({ field }) => field === 'prior');

  return <g>
    {doubly && <text x={x0} y={20} fontSize="12" fill="#5F5E5A">next → · ← prior</text>}
    {links.map(({ from, to, field }) => {
      const fromIndex = indices.get(from);
      const toIndex = to === null ? undefined : indices.get(to);
      if (fromIndex === undefined || (to !== null && toIndex === undefined)) return null;
      const fromX = x0 + fromIndex * stepWidth;
      const isPrior = field === 'prior';
      const startX = fromX + cellWidth * (isPrior && to === null ? 0.28 : 0.72);
      const title = `${scene.nodes[fromIndex].value}.${field} → ${toIndex === undefined ? 'NULL' : scene.nodes[toIndex].value}`;
      let path: string;
      if (toIndex === undefined) {
        path = `M${startX} ${bottom + 3} V${bottom + gap}`;
      } else {
        const toX = x0 + toIndex * stepWidth;
        const right = fromIndex < toIndex;
        if (Math.abs(fromIndex - toIndex) === 1) {
          const lineY = y + cellHeight * (doubly ? (isPrior ? 0.68 : 0.32) : 0.5);
          path = right
            ? `M${fromX + cellWidth + 3} ${lineY} H${toX - 3}`
            : `M${fromX - 3} ${lineY} H${toX + cellWidth + 3}`;
        } else {
          const laneY = bottom + gap * (isPrior ? 3 : 2);
          const endX = toX + cellWidth * 0.28;
          path = `M${startX} ${bottom + 3} V${laneY} H${endX} V${bottom + 3}`;
        }
      }
      return <g key={`${from}:${field}`}>
        <title>{title}</title>
        <path d={path} fill="none" stroke="#5F5E5A" strokeWidth="1.5" strokeLinejoin="round" markerEnd={arrow} />
        {to === null && <text x={startX} y={bottom + gap + 14} textAnchor="middle" fontSize="11" fill="#5F5E5A" fontFamily="monospace">NULL</text>}
      </g>;
    })}
  </g>;
}

/** 数组 / 链表：按固定步长排列；cols > 1 时折成二维网格（矩阵、哈希表）。 */
function LinearSvg({ scene }: { scene: Scene }) {
  const arrowId = useId();
  const arrow = `url(#${arrowId})`;
  const stringMatch = scene.layout === 'string-match';
  const matrix = scene.layout === 'matrix';
  const stackSequence = scene.aux?.layout === 'stack';
  const cw = matrix || stackSequence ? 48 : stringMatch ? 30 : 62;
  const cellHeight = matrix || stackSequence ? 36 : stringMatch ? 34 : 44;
  const gap = matrix || stackSequence ? 8 : stringMatch ? 3 : 18;
  const x0 = matrix ? 78 : stackSequence ? 16 : stringMatch ? 62 : 34;
  const cols = scene.cols && scene.cols > 0 ? scene.cols : Math.max(scene.nodes.length, scene.capacity ?? 0, 1);
  const rows = Math.max(1, Math.ceil(scene.nodes.length / cols));
  const grid = rows > 1;
  const rowH = matrix ? 52 : stringMatch ? 78 : 104;
  const y0 = stackSequence ? 46 : grid ? 46 : 76;
  const height = stackSequence ? 116 : matrix ? y0 + (rows - 1) * rowH + cellHeight + 24 : grid ? 46 + rows * rowH : 200;
  const width = stackSequence ? x0 * 2 + cols * (cw + gap) - gap : matrix ? x0 + cols * (cw + gap) - gap + 24 : Math.max(560, x0 * 2 + cols * (cw + gap));
  const detached = new Set(scene.detached ?? []);
  const nullPointers = (scene.pointers ?? []).filter((p) => p.index === null).map((p) => p.label);
  const isList = scene.kind === 'list';
  const isCircular = isList && scene.circular;
  const listLinks = isList ? scene.listLinks : undefined;
  const showIndex = !grid;

  return (
    <svg className={matrix ? 'matrix-svg' : undefined} viewBox={`0 0 ${width} ${height}`} width={matrix || stackSequence ? width : '100%'} role="img" aria-label={isCircular ? '循环链表，尾结点指回首结点' : '当前步骤的数据结构状态'}>
      <defs>
        <marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#5F5E5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      {matrix && scene.pointers?.filter((pointer) => pointer.axis !== 'row' && pointer.index !== null).map((pointer) => {
        const column = pointer.index! % cols;
        const x = x0 + column * (cw + gap) + cw / 2;
        return <g key={pointer.label}>
          <text x={x} y={y0 - 22} textAnchor="middle" fontSize="12" fill="#3C3489" fontFamily="monospace">{pointer.label} = {column}</text>
          <path d={`M${x} ${y0 - 18} V${y0 - 4}`} fill="none" stroke="#534AB7" strokeWidth="1.5" markerEnd={arrow} />
        </g>;
      })}

      {listLinks && <ListArrows scene={scene} links={listLinks} x0={x0} y={y0} cellWidth={cw} cellHeight={cellHeight} gap={gap} arrow={arrow} />}
      {listLinks && nullPointers.length > 0 && (
        <text x={scene.nodes.length > 0 ? width - x0 : x0} y={scene.nodes.length > 0 ? 20 : y0 + 27}
          textAnchor={scene.nodes.length > 0 ? 'end' : 'start'} fontSize="12" fill="#3C3489" fontFamily="monospace">
          {nullPointers.map((pointer) => `${pointer} → NULL`).join(' · ')}
        </text>
      )}
      {stringMatch && ['主串', '模式串'].map((label, index) => (
        <text key={label} x={x0 - 10} y={y0 + index * rowH + cellHeight / 2} textAnchor="end"
          dominantBaseline="central" fontSize="12" fill="var(--muted)">{label}</text>
      ))}

      {scene.nodes.map((n, idx) => {
        if (stringMatch && n.value === '') return null;
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        const x = x0 + c * (cw + gap);
        const y = y0 + r * rowH;
        const col = COLOR[n.state ?? 'default'];
        const isDetached = detached.has(n.id);
        const closesLoop = isCircular && idx === scene.nodes.length - 1;
        const nextLink = `M${cw + 3} ${cellHeight / 2} H${cw + gap - 3}`;
        const firstCellCenter = x0 + cw / 2 - x;
        const firstCellBottom = y0 + cellHeight - y;
        const pointers = (scene.pointers ?? []).filter((p) => p.index === idx);
        const labels = matrix ? [] : pointers.filter((p) => p.axis !== 'row').map((p) => p.label);
        const rowPointer = pointers.find((p) => p.axis === 'row');
        return (
          <g key={n.id} style={{
            transform: `translate(${x}px, ${y}px)`,
            // 明确连线和结点位置在同一帧更新，避免箭头暂时指向错误结点。
            transition: listLinks ? undefined : 'transform 340ms cubic-bezier(0.22, 0.8, 0.2, 1)',
          }}>
            {labels.length > 0 && (
              <text x={cw / 2} y={-30} textAnchor="middle" fontSize="12" fill="#3C3489" fontFamily="monospace">
                {labels.join(' ')}
              </text>
            )}
            {labels.length > 0 && (
              <path d={`M${cw / 2} -26 V-6`} fill="none" stroke="#534AB7" strokeWidth="1" markerEnd={arrow} />
            )}
            {rowPointer && <g>
              <text x={-28} y={cellHeight / 2} textAnchor="end" dominantBaseline="central" fontSize="12" fill="#3C3489" fontFamily="monospace">{rowPointer.label} = {r}</text>
              <path d={`M-24 ${cellHeight / 2} H-4`} fill="none" stroke="#534AB7" strokeWidth="1.5" markerEnd={arrow} />
            </g>}
            <rect x={0} y={0} width={cw} height={cellHeight} rx={8} strokeWidth="1" style={{ fill: col.fill, stroke: col.stroke, transition: 'fill 200ms ease, stroke 200ms ease' }} />
            <text x={cw / 2} y={cellHeight / 2} textAnchor="middle" dominantBaseline="central" fontSize="15" fontFamily="monospace" fill="#2C2C2A">
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
            {isList && !listLinks && (
              <path
                d={closesLoop
                  ? `${nextLink} V${cellHeight + gap * 2} H${firstCellCenter} V${firstCellBottom + 3}`
                  : nextLink}
                fill="none"
                stroke={isDetached ? '#B4B2A9' : '#5F5E5A'}
                strokeWidth="1.5"
                strokeDasharray={isDetached ? '3 3' : undefined}
                strokeLinejoin="round"
                markerEnd={isDetached ? undefined : arrow}
              />
            )}
          </g>
        );
      })}

      {isList && !listLinks && scene.nodes.length > 0 && (
        <g>
          {!isCircular && <text x={x0 + scene.nodes.length * (cw + gap) + 2} y={y0 + 27} fontSize="12" fill="#5F5E5A" fontFamily="monospace">NULL</text>}
          {nullPointers.length > 0 && (
            <text x={x0 + scene.nodes.length * (cw + gap) + 2} y={y0 - 30} fontSize="12" fill="#3C3489" fontFamily="monospace">
              {nullPointers.join(' ')} → NULL
            </text>
          )}
        </g>
      )}
      {isList && !listLinks && scene.nodes.length === 0 && (
        <g>
          <text x={x0} y={y0 + 27} fontSize="14" fill="#5F5E5A" fontFamily="monospace">head → NULL</text>
        </g>
      )}
    </svg>
  );
}
