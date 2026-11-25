import { useMemo, useState } from 'react';
import { algorithms, getAlgorithm } from '../algorithms/registry';
import { Stage } from '../components/Stage';
import { decodeMatchInput } from '../engine/input';
import { practiceQuestions } from '../engine/practice';
import { practiceQuestionId, readPracticeMistakes, savePracticeMistakes, type PracticeMistake } from '../engine/practice-review';
import { algorithmReplayPath, navigate } from '../engine/router';

export function PracticeLab() {
  const [slug, setSlug] = useState('stack/seq-stack');
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(readPracticeMistakes);
  const [storageFailed, setStorageFailed] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState<PracticeMistake>();
  const algo = getAlgorithm(slug) ?? algorithms[0];
  const questions = useMemo(() => practiceQuestions(algo), [algo]);
  const taskAlgo = reviewing && review ? getAlgorithm(review.slug) ?? algo : algo;
  const task = reviewing ? review?.question : questions.length ? questions[round % questions.length] : undefined;
  const matchInput = task && taskAlgo.input?.format === 'string-match' ? decodeMatchInput(task.input) : undefined;
  const inputLabel = matchInput ? `主串 ${matchInput[0]}，模式串 ${matchInput[1]}` : task?.input.join(', ');
  const mastered = reviewing && !!task && answer === task.answer;

  const chooseAlgorithm = (value: string) => {
    setSlug(value);
    setRound(0);
    setAnswer(null);
  };

  const chooseMode = (reviewMode: boolean) => {
    if (reviewMode === reviewing) return;
    setReviewing(reviewMode);
    setReview(reviewMode ? mistakes[0] : undefined);
    setAnswer(null);
  };

  const nextQuestion = () => {
    if (reviewing) {
      const index = mistakes.findIndex(({ id }) => id === review?.id);
      setReview(mistakes.length ? mistakes[(index + 1) % mistakes.length] : undefined);
    } else {
      setRound((value) => value + 1);
    }
    setAnswer(null);
  };

  const updateMistakes = (nextMistakes: PracticeMistake[]) => {
    setMistakes(nextMistakes);
    setStorageFailed(!savePracticeMistakes(nextMistakes));
  };

  const submit = (value: string) => {
    if (!task || mastered) return;
    setAnswer(value);
    const id = practiceQuestionId(taskAlgo.slug, task);
    if (value === task.answer) {
      try { localStorage.setItem(`dsv-practice-${taskAlgo.slug}`, 'done'); } catch { /* 浏览器存储不可用时也能答题。 */ }
      if (reviewing) updateMistakes(mistakes.filter((item) => item.id !== id));
    } else {
      const mistake = { id, slug: taskAlgo.slug, choice: value, question: task };
      updateMistakes(mistakes.some((item) => item.id === id)
        ? mistakes.map((item) => item.id === id ? mistake : item) : [...mistakes, mistake]);
    }
  };

  return (
    <main className="page lab-page">
      <div className="page-intro"><h1>练习中心</h1><p>观察当前状态，预测下一步，再到动画中验证。</p></div>
      <section className="panel lab-card">
        <div className="practice-modes" role="group" aria-label="练习模式">
          <button type="button" aria-pressed={!reviewing} onClick={() => chooseMode(false)}>普通练习</button>
          <button type="button" aria-pressed={reviewing} onClick={() => chooseMode(true)}>只练错题（{mistakes.length}）</button>
        </div>
        {storageFailed && <p className="muted">当前浏览器无法保存错题，离开此页后本次改动可能丢失。</p>}
        {!reviewing && <div className="panel-head">
          <label htmlFor="practice-algorithm">选择算法</label>
          <select id="practice-algorithm" value={slug} onChange={(event) => chooseAlgorithm(event.target.value)}>
            {algorithms.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}
          </select>
        </div>}
        {task ? <>
          <p className="muted">{reviewing && `${taskAlgo.title} · `}本题输入 {inputLabel} · 第 {task.step + 1} 步</p>
          <Stage scene={task.before.scene} />
          <p>{task.before.caption}</p>
          <p className="lab-question" id="practice-question">{task.prompt}</p>
          <div className="lab-options" role="group" aria-labelledby="practice-question">
            {task.choices.map((choice) => (
              <button key={choice} type="button" className={answer === choice ? 'primary' : ''} aria-pressed={answer === choice} disabled={mastered}
                onClick={() => submit(choice)}>{choice}</button>
            ))}
          </div>
          {answer !== null && <div role="status" className={`lab-result${answer === task.answer ? '' : ' wrong'}`}>
            {answer === task.answer ? '回答正确。' : `正确答案是「${task.answer}」。`}{task.after.caption}
            {reviewing && review && <div>复习前错选「{review.choice}」。{mastered && '已移出待复习错题。'}</div>}
          </div>}
          <p>
            <button type="button" className="mini" onClick={nextQuestion}>{reviewing && mistakes.length === 0 ? '结束复习' : '换一题'}</button>{' '}
            {(reviewing || answer !== null) && <button type="button" className="mini" onClick={() => navigate(algorithmReplayPath(taskAlgo.slug, { input: task.input, step: task.step }))}>
              从第 {task.step + 1} 步打开动画
            </button>}
          </p>
        </> : <p className="muted">{reviewing ? '没有待复习的错题。' : '这个算法暂时没有可用的练习题。'}</p>}
      </section>
    </main>
  );
}
