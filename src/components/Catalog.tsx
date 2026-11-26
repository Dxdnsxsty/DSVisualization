import { useState, useSyncExternalStore } from 'react';
import { algorithms, categories, getAlgorithm } from '../algorithms/registry';
import { navigate } from '../engine/router';
import { usePlayer } from '../engine/player';
import { rememberScroll } from '../engine/scroll';
import { matchesAlgorithm } from '../engine/algorithm-search';

const KEY = 'dsv-learned';
const LEARNED_CHANGE = 'dsv-learned-change';

function learnedSnapshot(): string {
  try { return localStorage.getItem(KEY) ?? '[]'; } catch { return '[]'; }
}

function parseLearned(snapshot: string): string[] {
  try {
    const slugs: unknown = JSON.parse(snapshot);
    return Array.isArray(slugs) ? slugs.filter((slug): slug is string => typeof slug === 'string') : [];
  } catch { return []; }
}

function subscribeLearned(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) listener();
  };
  window.addEventListener(LEARNED_CHANGE, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(LEARNED_CHANGE, listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function markLearned(slug: string): void {
  try {
    const set = new Set(parseLearned(learnedSnapshot()));
    if (set.has(slug)) return;
    set.add(slug);
    localStorage.setItem(KEY, JSON.stringify([...set]));
    window.dispatchEvent(new Event(LEARNED_CHANGE));
  } catch { /* 隐私模式下 localStorage 不可用，忽略即可 */ }
}

export function Catalog({ currentSlug, onNavigate }: { currentSlug: string; onNavigate?: () => void }) {
  const [query, setQuery] = useState('');
  const snapshot = useSyncExternalStore(subscribeLearned, learnedSnapshot, () => '[]');
  const learned = new Set(parseLearned(snapshot));
  const q = query.trim().toLowerCase();

  return (
    <nav className="panel catalog" aria-label="课程章节目录">
      <div className="panel-head"><span>课程章节</span></div>
      <input
        className="catalog-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索算法 / 章节"
        aria-label="搜索算法"
      />
      <div className="cat-scroll">
        {categories.map((cat) => {
          const items = cat.slugs.map(getAlgorithm).filter((a) => !!a);
          const visible = items.filter((a) => matchesAlgorithm(a, cat.title, q));
          if (q && visible.length === 0 && !cat.title.toLowerCase().includes(q)) return null;
          return (
            <div className="cat-group" key={cat.id}>
              <div className="cat-title">
                {cat.title}
                {cat.stub && <span className="badge">{cat.stub}</span>}
              </div>
              {visible.map((a) => (
                <button
                  key={a.slug}
                  className={'cat-item' + (a.slug === currentSlug ? ' current' : '')}
                  onClick={() => {
                    // 先同步生成新算法的步骤再跳转：否则路由切换的瞬间会渲染空态，
                    // 页面高度塌陷会把滚动位置夹回顶部，用户每次都得重新往下翻。
                    rememberScroll();
                    usePlayer.getState().load(a.slug);
                    navigate('algo/' + a.slug);
                    onNavigate?.();
                  }}
                >
                  <span className={learned.has(a.slug) ? 'dot done' : 'dot'} />
                  <span className="cat-name">{a.title}</span>
                </button>
              ))}
              {cat.stub && !q && <div className="cat-empty">本章节暂无可视化，欢迎提 PR 补充</div>}
            </div>
          );
        })}
      </div>
      <div className="catalog-foot">
        已学 {learned.size} / {algorithms.length} · 进度仅保存在本机浏览器，无需登录
      </div>
    </nav>
  );
}
