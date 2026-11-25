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
  fullscreenError: string;
  mobileTab: string;
  onNavigate?: () => void;
}

function PlayerStage({ stageRef, onFullscreen, fullscreenError }: Pick<Props, 'stageRef' | 'onFullscreen' | 'fullscreenError'>) {
  const scene = usePlayer((state) => state.trace[state.step]?.scene);
  return scene ? <Stage ref={stageRef} scene={scene} onFullscreen={onFullscreen} fullscreenError={fullscreenError} fullscreenControls={<Controls fullscreen />} /> : null;
}

function PlayerVariables() {
  const step = usePlayer((state) => state.trace[state.step]);
  return step ? <VarPane step={step} /> : null;
}

export function AlgorithmPage({ slug, stageRef, onFullscreen, fullscreenError, mobileTab, onNavigate }: Props) {
  const algo = getAlgorithm(slug);

  // 绘制前恢复滚动位置：配合 Catalog 里的 rememberScroll，连点算法时页面不跳回顶部
  useLayoutEffect(() => { restoreScroll(); }, [slug]);

  if (!algo) return <NotFound slug={slug} />;
  const structureInput = algo.customGraph || algo.input?.format === 'tree-level';

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
          {structureInput && <InputBar key={slug} algo={algo} />}
          <PlayerStage stageRef={stageRef} onFullscreen={onFullscreen} fullscreenError={fullscreenError} />
          <Controls key={slug} />
          {!structureInput && <InputBar algo={algo} />}
        </main>

        <aside className="col col-right">
          <CodePane algo={algo} />
          <PlayerVariables />
        </aside>
      </div>

      <div className="col-bottom">
        <Explain algo={algo} />
      </div>
    </div>
  );
}
