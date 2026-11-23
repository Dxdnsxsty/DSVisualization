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
  const [fullscreenError, setFullscreenError] = useState('');
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

  const toggleFullscreen = async () => {
    const el = stageRef.current;
    if (!el) return;
    setFullscreenError('');
    const exiting = document.fullscreenElement === el;
    try {
      if (exiting) await document.exitFullscreen();
      else if (el.requestFullscreen) await el.requestFullscreen();
      else setFullscreenError('当前浏览器不支持全屏。');
    } catch {
      setFullscreenError(exiting ? '无法退出全屏，请尝试按 Esc。' : '无法进入全屏，请检查浏览器的全屏权限。');
    }
  };

  useEffect(() => { setFullscreenError(''); }, [slug]);
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
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
      if (route.name !== 'algo' || route.slug !== p.slug) return;
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!e.repeat) toggleFullscreen();
        return;
      }
      if (target?.closest('button, [role="button"]')) return;
      switch (e.key) {
        case ' ': e.preventDefault(); p.toggle(); break;
        case 'ArrowLeft': e.preventDefault(); p.prev(); break;
        case 'ArrowRight': e.preventDefault(); p.next(); break;
        case 'Home': e.preventDefault(); p.setStep(0); break;
        case 'End': e.preventDefault(); p.setStep(p.trace.length - 1); break;
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
          <a className="github-link" href="https://github.com/Dxdnsxsty/DSVisualization" target="_blank" rel="noreferrer"
            aria-label="在 GitHub 查看源码" title="在 GitHub 查看源码">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
              {/* GitHub Octicons mark-github, MIT license. See THIRD_PARTY_NOTICES.md. */}
              <path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656" />
            </svg>
          </a>
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
            fullscreenError={fullscreenError}
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
