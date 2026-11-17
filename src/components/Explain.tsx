import { useState } from 'react';
import { algorithms, getAlgorithm } from '../algorithms/registry';
import { navigate } from '../engine/router';
import type { AlgorithmMeta, QuizItem } from '../engine/types';

function Quiz({ items }: { items: QuizItem[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  return (
    <div className="quiz">
      <h3>随堂自测</h3>
      {items.map((item, qi) => {
        const chosen = answers[qi];
        return (
          <div className="quiz-item" key={qi}>
            <div className="quiz-q">{qi + 1}. {item.q}</div>
            <div className="quiz-options">
              {item.options.map((op, oi) => (
                <button
                  key={oi}
                  className={'quiz-option' + (chosen === oi ? (oi === item.answer ? ' right' : ' wrong') : '')}
                  onClick={() => setAnswers({ ...answers, [qi]: oi })}
                >
                  {op}
                </button>
              ))}
            </div>
            {chosen !== undefined && (
              <div className={chosen === item.answer ? 'quiz-explain ok' : 'quiz-explain no'}>
                {chosen === item.answer ? '回答正确。' : `再想想，正确答案是「${item.options[item.answer]}」。`} {item.explain}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Explain({ algo }: { algo: AlgorithmMeta }) {
  const related = algorithms.filter((a) => a.slug !== algo.slug && a.category === algo.category);
  const others = algorithms.filter((a) => a.category !== algo.category).slice(0, 3);
  return (
    <section className="panel explain">
      <header className="panel-head"><span>图文讲解</span><span className="muted">{algo.chapter}</span></header>
      <div className="explain-body">
        {algo.doc.map((sec) => (
          <div className="doc-section" key={sec.heading}>
            <h3>{sec.heading}</h3>
            <p>{sec.body}</p>
            {sec.points && (
              <ul>{sec.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
            )}
          </div>
        ))}
        <Quiz items={algo.quiz} />
        <div className="related">
          <h3>继续学习</h3>
          <div className="related-links">
            {related.map((a) => (
              <button key={a.slug} onClick={() => navigate('algo/' + a.slug)}>{a.title} →</button>
            ))}
            {others.map((a) => (
              <button key={a.slug} onClick={() => navigate('algo/' + a.slug)}>{a.title} →</button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
