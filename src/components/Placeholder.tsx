import { useTranslate } from '../i18n';
import { useState } from 'react';
import { categories, getAlgorithm } from '../algorithms/registry';
import { matchesAlgorithm } from '../engine/algorithm-search';
import type { AlgorithmMeta } from '../engine/types';
import { readLessonProgress } from '../engine/learning-progress';
import { algorithmReplayPath, navigate } from '../engine/router';

/** 算法地图：按课程章节铺开，是真实功能，不是占位。 */
export function MapPage() {
  const t = useTranslate();
  const [lesson] = useState(readLessonProgress);
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

/** STUB: 在线代码编辑器需要服务端编译/沙箱，与"纯静态、零后端"的定位冲突。 */
export function LabPage() {
  const t = useTranslate();
  return (
    <div className="page lab-page">
      <div className="page-intro">
        <h1>{t("代码实验室")}</h1>
        <p>{t("这个页面是 P0 的占位，用来明确标记尚未实现的能力边界。")}</p>
      </div>
      <div className="stub-box big">
        <strong>{t("STUB · 在线代码编辑器 / 断点调试")}</strong>
        <p>{t("任意代码可视化需要在浏览器沙箱或服务端编译执行代码，并推断数据结构图形，会引入后端或 WASM 运行时。本项目定位是开源纯静态站（GitHub Pages 直接托管、无密钥、无账号），因此 P0 / P1 不提供该功能。")}</p>
        <p>{t("替代方案：每个算法的「自定义数据」输入框可以改数据重新生成步骤；想可视化自己的代码，可按 README 新增一个算法文件，把执行过程写成 ")}<code>generate()</code>{t(" 里的步骤序列。")}</p>
        <button className="primary" onClick={() => navigate('map')}>{t("回到算法地图")}</button>
      </div>
      <div className="stub-list">
        <h3>{t("其他已明确留桩的能力")}</h3>
        <ul>
          <li>{t("树 / 图布局器：")}<code>src/engine/layout.ts</code>{t("，舞台遇到这类场景会显示占位说明")}</li>
          <li>{t("递归栈面板：")}<code>TraceStep.callStack</code>{t(" 字段已预留，P1 接递归算法后启用")}</li>
          <li>{t("SSR / SEO：P0 为 SPA，若需要被搜索收录，后续迁到 Next.js 或引入静态预渲染")}</li>
        </ul>
      </div>
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
