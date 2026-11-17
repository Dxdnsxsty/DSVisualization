import { useMemo, useState } from 'react';
import { algorithms, getAlgorithm } from '../algorithms/registry';
import { navigate } from '../engine/router';

export function PracticeLab() {
  const [slug, setSlug] = useState('sort/select-sort');
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const algo = getAlgorithm(slug) ?? algorithms[0];
  const task = useMemo(() => {
    const trace = algo.generate(algo.defaultInput);
    const at = Math.max(0, Math.min(trace.length - 2, 1 + ((round * 7 + algo.slug.length) % Math.max(1, trace.length - 2))));
    const next = trace[at + 1];
    const choices = [...new Set([next.phase, trace[Math.max(0, at - 1)].phase, trace[Math.min(trace.length - 1, at + 2)].phase, '算法结束'])]
      .sort((a, b) => (a + algo.slug).localeCompare(b + algo.slug));
    return { trace, at, next, choices };
  }, [algo, round]);
  const submit = (value: string) => {
    setAnswer(value);
    if (value === task.next.phase) try { localStorage.setItem(`dsv-practice-${algo.slug}`, 'done'); } catch { /* storage is optional */ }
  };
  return <main className="page lab-page"><div className="page-intro"><h1>练习中心</h1><p>先预测下一步，再打开动画验证。题目由本地 Trace 生成，可直接部署到 GitHub Pages。</p></div><div className="lab-grid"><section className="panel lab-card"><div className="panel-head"><span>预测下一步</span><select value={slug} onChange={(e) => { setSlug(e.target.value); setRound(0); setAnswer(null); }}>{algorithms.map((a) => <option key={a.slug} value={a.slug}>{a.title}</option>)}</select></div><p className="muted">{algo.title} · 已执行到第 {task.at + 1} 步：{task.trace[task.at].caption}</p><div className="lab-question">下一步会进入哪个阶段？</div><div className="lab-options">{task.choices.map((x) => <button key={x} className={answer === x ? 'primary' : ''} onClick={() => submit(x)}>{x}</button>)}</div>{answer && <div className={'lab-result' + (answer === task.next.phase ? '' : ' wrong')}>{answer === task.next.phase ? `正确。下一步：${task.next.caption}` : `还差一点，正确答案是「${task.next.phase}」。`}</div>}<p><button className="mini" onClick={() => { setRound((x) => x + 1); setAnswer(null); }}>换一题</button> <button className="mini" onClick={() => navigate(`algo/${algo.slug}`)}>打开动画验证</button></p></section><section className="panel lab-card"><div className="panel-head"><span>静态站能力边界</span></div><p>自定义输入、逐步动画、练习记录、算法对比与代码下载都在浏览器中完成，无需服务器。</p><p>运行任意 C++ / Java / Python 并自动可视化，需要浏览器 WASM 沙箱或后端编译环境，不是 GitHub Pages 的基础能力。</p><button className="primary" onClick={() => navigate('compare')}>去算法对比</button></section></div></main>;
}
