import { useState } from 'react';
import { algorithms, categories, getAlgorithm } from '../algorithms/registry';
import { navigate } from '../engine/router';
import { usePlayer } from '../engine/player';
import { rememberScroll } from '../engine/scroll';

const KEY = 'dsv-learned';

export function readLearned(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]; } catch { return []; }
}

export function markLearned(slug: string): void {
  try {
    const set = new Set(readLearned());
    set.add(slug);
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch { /* 隐私模式下 localStorage 不可用，忽略即可 */ }
}

export function Catalog({ currentSlug, onNavigate }: { currentSlug: string; onNavigate?: () => void }) {
  const [query, setQuery] = useState('');
  const learned = new Set(readLearned());
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
          const visible = items.filter((a) =>
            !q || cat.title.toLowerCase().includes(q) || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q),
          );
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
