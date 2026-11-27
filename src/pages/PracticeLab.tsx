import { useTranslate } from '../i18n';
import { useMemo, useState } from 'react';
import { algorithms, getAlgorithm } from '../algorithms/registry';
import { Stage } from '../components/Stage';
import { decodeMatchInput } from '../engine/input';
import { customPracticeQuestions, practiceQuestions, supportsCustomPractice } from '../engine/practice';
import { practiceQuestionId, readPracticeMistakes, savePracticeMistakes, type PracticeMistake } from '../engine/practice-review';
import { algorithmReplayPath, navigate, type ExerciseReplay } from '../engine/router';
import { decodeCustomGraph, formatTreeInput } from '../engine/structure-input';

function describeInput(algo: NonNullable<ReturnType<typeof getAlgorithm>>, input: number[]): string {
  if (algo.input?.format === 'string-match') {
    const [main, pattern] = decodeMatchInput(input);
    return `主串 ${main}，模式串 ${pattern}`;
  }
  if (algo.input?.format === 'tree-level') return formatTreeInput(input);
  if (algo.slug === 'graph/dijkstra') {
    const graph = decodeCustomGraph(input);
    if (graph) return `顶点 ${graph.labels.join('、')}，起点 ${graph.labels[graph.source]}，边 ${graph.edges.map(([from, to, weight]) =>
      `${graph.labels[from]}→${graph.labels[to]} (${weight})`).join('、') || '无'}`;
  }
  return input.join(', ');
}

export function PracticeLab({ exercise }: { exercise?: ExerciseReplay }) {
  const t = useTranslate();
  const [slug, setSlug] = useState('stack/seq-stack');
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(readPracticeMistakes);
  const [storageFailed, setStorageFailed] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState<PracticeMistake>();
  const exerciseAlgo = exercise && supportsCustomPractice(exercise.slug) ? getAlgorithm(exercise.slug) : undefined;
  const algo = exerciseAlgo ?? getAlgorithm(slug) ?? algorithms[0];
  const questions = useMemo(() => exercise && exerciseAlgo
    ? customPracticeQuestions(exerciseAlgo, exercise.input)
    : practiceQuestions(algo), [algo, exercise, exerciseAlgo]);
  const first = exerciseAlgo && exercise ? questions.findIndex(({ step }) => step >= exercise.step) : 0;
  const taskAlgo = reviewing && review ? getAlgorithm(review.slug) ?? algo : algo;
  const task = reviewing ? review?.question : questions.length ? questions[(round + Math.max(0, first)) % questions.length] : undefined;
  const inputLabel = task && describeInput(taskAlgo, task.input);
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
      <div className="page-intro"><h1>{t("练习中心")}</h1><p>{t("观察当前状态，预测下一步，再到动画中验证。")}</p></div>
      <section className="panel lab-card">
        <div className="practice-modes" role="group" aria-label={t("练习模式")}>
          <button type="button" aria-pressed={!reviewing} onClick={() => chooseMode(false)}>{t("普通练习")}</button>
          <button type="button" aria-pressed={reviewing} onClick={() => chooseMode(true)}>{t(`只练错题（${mistakes.length}）`)}</button>
        </div>
        {storageFailed && <p className="muted">{t("当前浏览器无法保存错题，离开此页后本次改动可能丢失。")}</p>}
        {!reviewing && exerciseAlgo && <div className="panel-head">
          <span>{t(exerciseAlgo.title)}{t(" · 当前数据练习")}</span>
          <button type="button" className="mini" onClick={() => navigate('lab')}>{t("返回预设题库")}</button>
        </div>}
        {!reviewing && !exerciseAlgo && <div className="panel-head">
          <label htmlFor="practice-algorithm">{t("选择算法")}</label>
          <select id="practice-algorithm" value={slug} onChange={(event) => chooseAlgorithm(event.target.value)}>
            {algorithms.map((item) => <option key={item.slug} value={item.slug}>{t(item.title)}</option>)}
          </select>
        </div>}
        {task ? <>
          <p className="muted">{reviewing && `${t(taskAlgo.title)} · `}{t(`本题输入 ${inputLabel} · 第 ${task.step + 1} 步`)}</p>
          <Stage scene={task.before.scene} />
          <p>{t(task.before.caption)}</p>
          <p className="lab-question" id="practice-question">{t(task.prompt)}</p>
          <div className="lab-options" role="group" aria-labelledby="practice-question">
            {task.choices.map((choice) => (
              <button key={choice} type="button" className={answer === choice ? 'primary' : ''} aria-pressed={answer === choice} disabled={mastered}
                onClick={() => submit(choice)}>{t(choice)}</button>
            ))}
          </div>
          {answer !== null && <div role="status" className={`lab-result${answer === task.answer ? '' : ' wrong'}`}>
            {t(answer === task.answer ? '回答正确。' : `正确答案是「${task.answer}」。`)}{t(task.after.caption)}
            {reviewing && review && <div>{t(`复习前错选「${review.choice}」。`)}{mastered && t('已移出待复习错题。')}</div>}
          </div>}
          <p>
            <button type="button" className="mini" onClick={nextQuestion}>{t(reviewing && mistakes.length === 0 ? '结束复习' : '换一题')}</button>{' '}
            {(reviewing || answer !== null) && <button type="button" className="mini" onClick={() => navigate(algorithmReplayPath(taskAlgo.slug, { input: task.input, step: task.step }))}>{t(`从第 ${task.step + 1} 步打开动画`)}</button>}
          </p>
        </> : <p className="muted">{t(reviewing ? '没有待复习的错题。' :
          exerciseAlgo ? '这组数据没有可出题的步骤。可以换一组输入或返回预设题库。' : '这个算法暂时没有可用的练习题。')}</p>}
      </section>
    </main>
  );
}
