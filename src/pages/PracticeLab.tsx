import { useMemo, useState } from 'react';
import { algorithms, getAlgorithm } from '../algorithms/registry';
import { Stage } from '../components/Stage';
import { decodeMatchInput } from '../engine/input';
import { practiceQuestions } from '../engine/practice';
import { algorithmReplayPath, navigate } from '../engine/router';

export function PracticeLab() {
  const [slug, setSlug] = useState('stack/seq-stack');
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const algo = getAlgorithm(slug) ?? algorithms[0];
  const questions = useMemo(() => practiceQuestions(algo), [algo]);
  const task = questions.length > 0 ? questions[round % questions.length] : undefined;
  const matchInput = task && algo.input?.format === 'string-match' ? decodeMatchInput(task.input) : undefined;
  const inputLabel = matchInput ? `主串 ${matchInput[0]}，模式串 ${matchInput[1]}` : task?.input.join(', ');

  const chooseAlgorithm = (value: string) => {
    setSlug(value);
    setRound(0);
    setAnswer(null);
  };

  const submit = (value: string) => {
    setAnswer(value);
    if (value === task?.answer) {
      try { localStorage.setItem(`dsv-practice-${algo.slug}`, 'done'); } catch { /* 浏览器存储不可用时也能答题。 */ }
    }
  };

  return (
    <main className="page lab-page">
      <div className="page-intro"><h1>练习中心</h1><p>观察当前状态，预测下一步，再到动画中验证。</p></div>
      <section className="panel lab-card">
        <div className="panel-head">
          <label htmlFor="practice-algorithm">选择算法</label>
          <select id="practice-algorithm" value={slug} onChange={(event) => chooseAlgorithm(event.target.value)}>
            {algorithms.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}
          </select>
        </div>
        {task ? <>
          <p className="muted">本题输入 {inputLabel} · 第 {task.step + 1} 步</p>
          <Stage scene={task.before.scene} />
          <p>{task.before.caption}</p>
          <p className="lab-question" id="practice-question">{task.prompt}</p>
          <div className="lab-options" role="group" aria-labelledby="practice-question">
            {task.choices.map((choice) => (
              <button key={choice} type="button" className={answer === choice ? 'primary' : ''} aria-pressed={answer === choice}
                onClick={() => submit(choice)}>{choice}</button>
            ))}
          </div>
          {answer !== null && <div role="status" className={`lab-result${answer === task.answer ? '' : ' wrong'}`}>
            {answer === task.answer ? '回答正确。' : `正确答案是「${task.answer}」。`}{task.after.caption}
          </div>}
          <p>
            <button type="button" className="mini" onClick={() => { setRound((value) => value + 1); setAnswer(null); }}>换一题</button>{' '}
            {answer !== null && <button type="button" className="mini" onClick={() => navigate(algorithmReplayPath(algo.slug, { input: task.input, step: task.step }))}>
              从第 {task.step + 1} 步打开动画
            </button>}
          </p>
        </> : <p className="muted">这个算法暂时没有可用的练习题。</p>}
      </section>
    </main>
  );
}
