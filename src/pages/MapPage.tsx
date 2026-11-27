import { useTranslate } from '../i18n';
import { useState } from 'react';
import { categories, getAlgorithm } from '../algorithms/registry';
import { matchesAlgorithm } from '../engine/algorithm-search';
import type { AlgorithmMeta } from '../engine/types';
import { readLessonProgress } from '../engine/learning-progress';
import { algorithmReplayPath, navigate } from '../engine/router';
import { StudyBackup } from '../components/StudyBackup';

/** 算法地图：按课程章节铺开，是真实功能，不是占位。 */
export function MapPage() {
  const t = useTranslate();
  const [lesson, setLesson] = useState(readLessonProgress);
  const [query, setQuery] = useState('');
  const groups = categories.map((category) => ({
    category,
    visible: category.slugs.map(getAlgorithm).filter((algo): algo is AlgorithmMeta =>
      !!algo && matchesAlgorithm(algo, category.title, query, t)),
  }));
  const count = groups.reduce((total, { visible }) => total + visible.length, 0);
  return (
    <div className="page map-page">
      <div className="page-intro">
        <h1>{t("算法地图")}</h1>
        <p>{t("按《数据结构》课程章节组织。点开任一算法即可分步播放、对照代码、查看变量，并做随堂自测。")}</p>
      </div>
      <StudyBackup onImport={() => setLesson(readLessonProgress())} />
      {lesson && (
        <section className="panel resume-lesson" aria-label={t("上次学习")}>
          <div>
            <span className="muted">{t(`上次学习 · 第 ${lesson.step + 1} 步`)}</span>
            <h2>{t(lesson.title)}</h2>
          </div>
          <button type="button" className="primary" onClick={() => navigate(algorithmReplayPath(lesson.slug, lesson))}>{t("继续上次学习")}</button>
        </section>
      )}
      <div className="map-search">
        <label htmlFor="map-search">{t("搜索算法")}</label>
        <input id="map-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder={t("算法名、缩写或章节，如 BFS")} />
        {query.trim() && <span className="muted" role="status">{t(count ? `找到 ${count} 个算法` : '未找到匹配的算法')}</span>}
      </div>
      {groups.filter(({ category, visible }) => visible.length || (!query.trim() && category.stub)).map(({ category: cat, visible }) => (
        <section className="map-section" key={cat.id}>
          <h2>{t(cat.title)} {cat.stub && <span className="badge">{t(cat.stub)}</span>}</h2>
          <div className="card-grid">
            {visible.map((a) => {
              return (
                <button className="algo-card" key={a.slug} onClick={() => navigate('algo/' + a.slug)}>
                  <span className="card-title">{t(a.title)}</span>
                  <span className="card-summary">{t(a.summary)}</span>
                  <span className="card-meta">{t(a.complexity.time)} · {t(a.difficulty)}</span>
                </button>
              );
            })}
            {cat.stub && (
              <div className="algo-card empty">
                <span className="card-title">{t("等待贡献")}</span>
                <span className="card-summary">{t("新建一个算法文件，在 registry 登记即可。")}</span>
                <span className="card-meta">{t("详见 README 贡献指南")}</span>
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export function NotFound({ slug }: { slug: string }) {
  const t = useTranslate();
  return (
    <div className="page">
      <div className="page-intro"><h1>{t("没有找到这个算法")}</h1><p><code>{t(slug)}</code></p></div>
      <button className="primary" onClick={() => navigate('map')}>{t("去算法地图")}</button>
    </div>
  );
}
