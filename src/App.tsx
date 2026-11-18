import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { navigate, useRoute } from './engine/router';
import { usePlayer } from './engine/player';
import { completedPlayerSlug, schedulePlayerAdvance, syncPlayerRoute } from './engine/player-route';
import { clearScroll } from './engine/scroll';
import { AlgorithmPage } from './pages/AlgorithmPage';
import { MapPage } from './components/Placeholder';
import { ComparePage } from './pages/ComparePage';
import { PracticeLab } from './pages/PracticeLab';
import { markLearned } from './components/Catalog';

type MobileTab = 'stage' | 'nav' | 'code' | 'explain';

const TABS: { key: MobileTab; label: string }[] = [
  { key: 'stage', label: '动画' },
  { key: 'nav', label: '目录' },
  { key: 'code', label: '代码' },
  { key: 'explain', label: '讲解' },
];

export default function App() {
  const route = useRoute();
  const p = usePlayer();
  const stageRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<MobileTab>('stage');
  const slug = route.name === 'algo' ? route.slug : '';
  const replay = route.name === 'algo' ? route.replay : undefined;

  // 跨页跳转（地图 ↔ 算法页 ↔ 实验室）回到顶部；
  // 同一页内连续换算法不算跨页，交给 scroll.ts 保留原位置，避免每次都要重新往下翻。
  const prevRouteName = useRef(route.name);
  useLayoutEffect(() => {
    if (prevRouteName.current !== route.name) {
      prevRouteName.current = route.name;
      clearScroll();
      window.scrollTo(0, 0);
    }
  }, [route.name]);

  const toggleFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  useLayoutEffect(() => { syncPlayerRoute(slug, replay); }, [slug, replay]);

  useEffect(() => schedulePlayerAdvance(slug), [slug, p.slug, p.playing, p.step, p.speed, p.trace]);

  // 播放到末尾即标记「已学」，只写浏览器本地，不涉及账号
  useEffect(() => {
    const completed = completedPlayerSlug(slug);
    if (completed) markLearned(completed);
  }, [slug, p.slug, p.step, p.trace]);

  // 键盘快捷键（每次渲染重新绑定，确保闭包里拿到最新状态）
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (route.name !== 'algo' || route.slug !== p.slug) return;
      switch (e.key) {
        case ' ': e.preventDefault(); p.toggle(); break;
        case 'ArrowLeft': e.preventDefault(); p.prev(); break;
        case 'ArrowRight': e.preventDefault(); p.next(); break;
        case 'Home': e.preventDefault(); p.setStep(0); break;
        case 'End': e.preventDefault(); p.setStep(p.trace.length - 1); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case '1': p.setSpeed(0.5); break;
        case '2': p.setSpeed(1); break;
        case '3': p.setSpeed(2); break;
        default: break;
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => navigate('map')}>DS<span>·</span>Visual</button>
        <nav className="topnav">
          <button className={route.name === 'map' ? 'active' : ''} onClick={() => navigate('map')}>算法地图</button>
          <button className={route.name === 'algo' ? 'active' : ''} onClick={() => navigate('algo/sort/select-sort')}>可视化</button>
          <button className={route.name === 'compare' ? 'active' : ''} onClick={() => navigate('compare')}>算法对比</button>
          <button className={route.name === 'lab' ? 'active' : ''} onClick={() => navigate('lab')}>练习中心</button>
        </nav>
        <div className="topright">
          <span className="top-hint">开源 · 无登录 · 无后端</span>
          <a className="top-hint dim" href="https://github.com/Dxdnsxsty/DSVisualization" target="_blank" rel="noreferrer" title="在 GitHub 查看源码">GitHub ↗</a>
        </div>
      </header>

      {route.name === 'algo' && (
        <>
          <div className="mobile-tabs">
            {TABS.map((t) => (
              <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>{t.label}</button>
            ))}
          </div>
          <AlgorithmPage
            slug={slug}
            stageRef={stageRef}
            onFullscreen={toggleFullscreen}
            mobileTab={tab}
            onNavigate={() => setTab('stage')}
          />
        </>
      )}
      {route.name === 'map' && <MapPage />}
      {route.name === 'compare' && <ComparePage />}
      {route.name === 'lab' && <PracticeLab />}

      <footer className="footer">
        数据结构可视化 · P0 原型 · MIT 开源 · 内容按课程章节组织，欢迎提 PR 补充算法与讲解
      </footer>
    </div>
  );
}
