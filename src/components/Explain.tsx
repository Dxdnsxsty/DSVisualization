import { useTranslate } from '../i18n';
import { useId, useState } from 'react';
import { algorithms } from '../algorithms/registry';
import { navigate } from '../engine/router';
import type { AlgorithmMeta, QuizItem } from '../engine/types';
import { markStudyMilestone } from '../engine/study-storage';

function Quiz({ items, slug }: { items: QuizItem[]; slug: string }) {
  const t = useTranslate();
  const quizId = useId();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  return (
    <aside className="quiz" aria-labelledby={quizId}>
      <h3 id={quizId}>{t("随堂自测")}</h3>
      {items.map((item, qi) => {
        const chosen = answers[qi];
        return (
          <div className="quiz-item" key={qi}>
            <p className="quiz-q" id={`${quizId}-${qi}`}>{qi + 1}. {t(item.q)}</p>
            <div className="quiz-options" role="group" aria-labelledby={`${quizId}-${qi}`}>
              {item.options.map((op, oi) => (
                <button
                  key={oi} type="button" aria-pressed={chosen === oi}
                  className={'quiz-option' + (chosen === oi ? (oi === item.answer ? ' right' : ' wrong') : '')}
                  onClick={() => {
                    const next = { ...answers, [qi]: oi };
                    setAnswers(next);
                    if (items.every((question, index) => next[index] === question.answer)) markStudyMilestone(slug, 'passed');
                  }}
                >
                  {t(op)}
                </button>
              ))}
            </div>
            {chosen !== undefined && (
              <div className={chosen === item.answer ? 'quiz-explain ok' : 'quiz-explain no'} role="status">
                {t(chosen === item.answer ? '回答正确。' : `再想想，正确答案是「${item.options[item.answer]}」。`)} {t(item.explain)}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}

export function Explain({ algo }: { algo: AlgorithmMeta }) {
  const t = useTranslate();
  const related = algorithms.filter((a) => a.slug !== algo.slug && a.category === algo.category);
  const others = algorithms.filter((a) => a.category !== algo.category).slice(0, 3);
  return (
    <section className="panel explain">
      <header className="explain-head"><h2>{t("图文讲解")}</h2><span className="muted">{t(algo.chapter)}</span></header>
      <div className="explain-body">
        <div className="lesson-content">
          {algo.doc.map((sec) => (
            <section className="doc-section" key={sec.heading}>
              <h3>{t(sec.heading)}</h3>
              <p>{t(sec.body)}</p>
              {sec.points?.length ? <ul>{sec.points.map((pt) => <li key={pt}>{t(pt)}</li>)}</ul> : null}
            </section>
          ))}
        </div>
        <Quiz key={algo.slug} items={algo.quiz} slug={algo.slug} />
      </div>
      <div className="related">
        <h3>{t("继续学习")}</h3>
        <div className="related-links">
          {[...related, ...others].map((a) => (
            <button key={a.slug} type="button" onClick={() => navigate('algo/' + a.slug)}>
              <span>{t(a.title)}</span><span aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
