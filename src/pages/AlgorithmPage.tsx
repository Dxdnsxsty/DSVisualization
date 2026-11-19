import { useLayoutEffect, type RefObject } from 'react';
import { getAlgorithm } from '../algorithms/registry';
import { usePlayer } from '../engine/player';
import { restoreScroll } from '../engine/scroll';
import { Stage } from '../components/Stage';
import { Controls, InputBar } from '../components/Controls';
import { CodePane, VarPane } from '../components/CodePane';
import { Catalog } from '../components/Catalog';
import { Explain } from '../components/Explain';
import { NotFound } from '../components/Placeholder';

interface Props {
  slug: string;
  stageRef: RefObject<HTMLDivElement>;
  onFullscreen: () => void;
  mobileTab: string;
  onNavigate?: () => void;
}

export function AlgorithmPage({ slug, stageRef, onFullscreen, mobileTab, onNavigate }: Props) {
  const algo = getAlgorithm(slug);
  const p = usePlayer();

  // 绘制前恢复滚动位置：配合 Catalog 里的 rememberScroll，连点算法时页面不跳回顶部
  useLayoutEffect(() => { restoreScroll(); }, [slug]);

  if (!algo) return <NotFound slug={slug} />;
  const cur = p.trace[p.step];
  // 只判断有没有步骤数据，不再因 slug 不匹配而撤掉三栏：撤掉会让页面高度塌陷，
  // 浏览器随即把滚动位置夹回顶部，表现为「每换一个算法就跳回页首」。
  if (!cur) {
    return <div className="page"><p>正在生成步骤序列…</p></div>;
  }

  return (
    <div className="workbench" data-tab={mobileTab}>
      <header className="page-head">
        <div className="breadcrumb">{algo.chapter} <span>/</span> {algo.title}</div>
        <div className="title-row">
          <h1>{algo.title}</h1>
          <span className="tag">{algo.complexity.time}</span>
          <span className="tag">空间 {algo.complexity.space}</span>
          {algo.complexity.extra && <span className="tag">{algo.complexity.extra}</span>}
          <span className="tag soft">{algo.difficulty}</span>
        </div>
        <p className="summary">{algo.summary}</p>
      </header>

      <div className="grid">
        <aside className="col col-left">
          <Catalog currentSlug={slug} onNavigate={onNavigate} />
        </aside>

        <main className="col col-center">
          <Stage ref={stageRef} scene={cur.scene} fullscreenControls={<Controls onFullscreen={onFullscreen} fullscreen />} />
          <Controls onFullscreen={onFullscreen} />
          <InputBar algo={algo} />
        </main>

        <aside className="col col-right">
          <CodePane algo={algo} />
          <VarPane step={cur} />
        </aside>
      </div>

      <div className="col-bottom">
        <Explain algo={algo} />
      </div>
    </div>
  );
}
