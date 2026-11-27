import { useTranslate } from '../i18n';
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { algorithms, categories, getAlgorithm } from '../algorithms/registry';
import { navigate } from '../engine/router';
import { usePlayer } from '../engine/player';
import { rememberScroll } from '../engine/scroll';
import { matchesAlgorithm } from '../engine/algorithm-search';
import { studyMilestonesSnapshot, subscribeStudy } from '../engine/study-storage';

export function Catalog({ currentSlug, onNavigate }: { currentSlug: string; onNavigate?: () => void }) {
  const t = useTranslate();
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const snapshot = useSyncExternalStore(subscribeStudy, studyMilestonesSnapshot, () => '[[],[]]');
  const [watchedSlugs, passedSlugs]: string[][] = JSON.parse(snapshot);
  const watched = new Set(watchedSlugs.filter(getAlgorithm));
  const passed = new Set(passedSlugs.filter(getAlgorithm));
  const q = query.trim().toLowerCase();

  useLayoutEffect(() => {
    const list = listRef.current;
    const current = list?.querySelector('[aria-current="page"]');
    if (!list || !current || list.scrollHeight <= list.clientHeight) return;
    const viewport = list.getBoundingClientRect();
    const item = current.getBoundingClientRect();
    if (item.top < viewport.top) list.scrollTop += item.top - viewport.top;
    else if (item.bottom > viewport.bottom) list.scrollTop += item.bottom - viewport.bottom;
  }, [currentSlug, q, t]);

  return (
    <nav className="panel catalog" aria-label={t("课程章节目录")}>
      <div className="panel-head"><span>{t("课程章节")}</span></div>
      <input
        className="catalog-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("搜索算法 / 章节")}
        aria-label={t("搜索算法")}
      />
      <div className="cat-scroll" ref={listRef}>
        {categories.map((cat) => {
          const items = cat.slugs.map(getAlgorithm).filter((a) => !!a);
          const visible = items.filter((a) => matchesAlgorithm(a, cat.title, q, t));
          if (q && visible.length === 0 && !cat.title.toLowerCase().includes(q)) return null;
          return (
            <div className="cat-group" key={cat.id}>
              <div className="cat-title">
                {t(cat.title)}
                {cat.stub && <span className="badge">{t(cat.stub)}</span>}
              </div>
              {visible.map((a) => (
                <button
                  key={a.slug}
                  className={'cat-item' + (a.slug === currentSlug ? ' current' : '')}
                  aria-current={a.slug === currentSlug ? 'page' : undefined}
                  onClick={() => {
                    // 先同步生成新算法的步骤再跳转：否则路由切换的瞬间会渲染空态，
                    // 页面高度塌陷会把滚动位置夹回顶部，用户每次都得重新往下翻。
                    rememberScroll();
                    usePlayer.getState().load(a.slug);
                    navigate('algo/' + a.slug);
                    onNavigate?.();
                  }}
                >
                  <span className={watched.has(a.slug) ? 'dot done' : 'dot'}
                    title={t(watched.has(a.slug) ? '已看完演示' : '未看完演示')} aria-hidden="true" />
                  <span className="cat-name">{t(a.title)}</span>
                  {passed.has(a.slug) && <span className="cat-pass" title={t('练习通过')} aria-label={t('练习通过')}>✓</span>}
                </button>
              ))}
              {cat.stub && !q && <div className="cat-empty">{t("本章节暂无可视化，欢迎提 PR 补充")}</div>}
            </div>
          );
        })}
      </div>
      <div className="catalog-foot">
        {t('已看完演示')} {watched.size} / {algorithms.length} · {t('练习通过')} {passed.size} / {algorithms.length}
      </div>
    </nav>
  );
}
