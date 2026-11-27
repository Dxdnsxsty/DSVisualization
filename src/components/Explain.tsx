import { useTranslate } from '../i18n';
import { useState } from 'react';
import { algorithms } from '../algorithms/registry';
import { navigate } from '../engine/router';
import type { AlgorithmMeta, QuizItem } from '../engine/types';

function Quiz({ items }: { items: QuizItem[] }) {
  const t = useTranslate();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  return (
    <div className="quiz">
      <h3>{t("随堂自测")}</h3>
      {items.map((item, qi) => {
        const chosen = answers[qi];
        return (
          <div className="quiz-item" key={qi}>
            <div className="quiz-q">{qi + 1}. {t(item.q)}</div>
            <div className="quiz-options">
              {item.options.map((op, oi) => (
                <button
                  key={oi}
                  className={'quiz-option' + (chosen === oi ? (oi === item.answer ? ' right' : ' wrong') : '')}
                  onClick={() => setAnswers({ ...answers, [qi]: oi })}
                >
                  {t(op)}
                </button>
              ))}
            </div>
            {chosen !== undefined && (
              <div className={chosen === item.answer ? 'quiz-explain ok' : 'quiz-explain no'}>
                {t(chosen === item.answer ? '回答正确。' : `再想想，正确答案是「${item.options[item.answer]}」。`)} {t(item.explain)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Explain({ algo }: { algo: AlgorithmMeta }) {
  const t = useTranslate();
  const related = algorithms.filter((a) => a.slug !== algo.slug && a.category === algo.category);
  const others = algorithms.filter((a) => a.category !== algo.category).slice(0, 3);
  return (
    <section className="panel explain">
      <header className="panel-head"><span>{t("图文讲解")}</span><span className="muted">{t(algo.chapter)}</span></header>
      <div className="explain-body">
        {algo.doc.map((sec) => (
          <div className="doc-section" key={sec.heading}>
            <h3>{t(sec.heading)}</h3>
            <p>{t(sec.body)}</p>
            {sec.points && (
              <ul>{sec.points.map((pt) => <li key={pt}>{t(pt)}</li>)}</ul>
            )}
          </div>
        ))}
        <Quiz key={algo.slug} items={algo.quiz} />
        <div className="related">
          <h3>{t("继续学习")}</h3>
          <div className="related-links">
            {related.map((a) => (
              <button key={a.slug} onClick={() => navigate('algo/' + a.slug)}>{t(a.title)} →</button>
            ))}
            {others.map((a) => (
              <button key={a.slug} onClick={() => navigate('algo/' + a.slug)}>{t(a.title)} →</button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
