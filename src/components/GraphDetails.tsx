import type { Scene } from '../engine/types';

/** 图旁的教学状态面板：只读取当前步骤快照，回退时无需额外维护状态。 */
export function GraphDetails({ scene }: { scene: Scene }) {
  if (scene.distanceMatrix) {
    const { labels, values, i, j, k, updated } = scene.distanceMatrix;
    const comparing = i !== null && j !== null && k !== null;
    return <div className="graph-details floyd-details">
      <table aria-label="完整距离矩阵 D">
        <caption>完整距离矩阵 D · 行为起点，列为终点</caption>
        <thead><tr><th scope="col">D</th>{labels.map((label, col) => <th key={label} scope="col" className={col === k ? 'matrix-mid' : undefined}>{label}</th>)}</tr></thead>
        <tbody>{values.map((row, r) => <tr key={labels[r]}><th scope="row" className={r === k ? 'matrix-mid' : undefined}>{labels[r]}</th>
          {row.map((value, c) => {
            const role = comparing ? r === i && c === j ? 'target' : r === i && c === k ? 'left' : r === k && c === j ? 'right' : '' : '';
            return <td key={c} data-row={labels[r]} data-col={labels[c]} data-role={role}
              className={`matrix-${role || 'plain'}${role === 'target' && updated ? ' matrix-updated' : ''}`}>{value}</td>;
          })}
        </tr>)}</tbody>
      </table>
      <div className="graph-detail-note">
        {comparing ? <>
          经 {labels[k]}：<span className="matrix-left">D[{labels[i]}][{labels[k]}] = {values[i][k]}</span> + <span className="matrix-right">D[{labels[k]}][{labels[j]}] = {values[k][j]}</span>
          <br />{updated ? '更新后' : '保持'} D[{labels[i]}][{labels[j]}] = {values[i][j]}
        </> : k !== null ? `本轮允许经过中转顶点 ${labels[k]}，依次比较各顶点对的距离。` : '无直接路径记为 ∞，自己到自己的距离为 0。'}
      </div>
    </div>;
  }
  if (scene.primTable) {
    const best = Math.min(...scene.primTable.filter((row) => !row.selected).map((row) => row.lowcost ?? Infinity));
    return <div className="graph-details prim-details">
      <table aria-label="Prim 候选连接表"><caption>Prim 候选连接表</caption>
        <thead><tr><th scope="col">顶点</th><th scope="col">lowcost</th><th scope="col">连接点</th><th scope="col">已加入</th></tr></thead>
        <tbody>{scene.primTable.map((row) => <tr key={row.vertex} data-vertex={row.vertex} className={row.changed ? 'detail-updated' : undefined}>
          <th scope="row">{row.vertex}</th><td className={!row.selected && row.lowcost !== null && row.lowcost === best ? 'candidate-min' : undefined}>{row.lowcost ?? '∞'}</td>
          <td>{row.candidate ?? '—'}</td><td>{row.selected ? '是' : '否'}</td>
        </tr>)}</tbody>
      </table>
      <p className="graph-detail-note">连接点属于已选集合 U。黄色数值为当前最小候选，绿色行表示本轮刷新；已加入的顶点记为 0，不再参与比较。</p>
    </div>;
  }
  if (scene.disjointSet) {
    const { groups, parents, current } = scene.disjointSet;
    return <div className="graph-details kruskal-details">
      <h3>连通分量（{groups.length}）</h3>
      <div className="component-groups" aria-label="并查集分组">
        {groups.map((group) => {
          const involved = current && (group.members.includes(current.from) || group.members.includes(current.to));
          return <div className={`component-card${involved ? ` component-${current.action}` : ''}`} key={group.root} data-root={group.root}>
            <span className="component-root">根：{group.root}</span>
            <div>{group.members.map((member) => <span className="component-member" key={member}>{member}</span>)}</div>
          </div>;
        })}
      </div>
      <h3>父指针 parent</h3>
      <div className="parent-grid" aria-label="并查集父指针">
        {parents.map((row) => <span key={row.vertex} data-vertex={row.vertex}>{row.vertex} → {row.parent}</span>)}
      </div>
      <div className="graph-detail-note">
        {current ? <>考察边 {current.from}—{current.to}，考察前的根为 {current.roots[0]}、{current.roots[1]}。<br />
          {current.action === 'union' ? '根不同，选入该边并合并分量。' : current.action === 'reject' ? '根相同，加入会成环，丢弃该边。' : current.roots[0] === current.roots[1] ? '两端已在同一分量，加入会成环。' : '两端分属不同分量，可以合并。'}</>
          : '每个框表示一个连通分量；沿父指针可以找到该分量的根。'}
      </div>
    </div>;
  }
  return null;
}
