import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePlayer } from '../engine/player';
import { CustomGraphDialog, CustomTreeDialog } from './StructureDialogs';
import { ShareReplay } from './ShareReplay';
import type { AlgorithmMeta } from '../engine/types';
import { decodeMatchInput, DEFAULT_INPUT, GRAPH_SIZE_INPUT, parseInputText, parseMatchInput, randomInput, validateInput } from '../engine/input';
import { levelTree } from '../engine/structure-input';
import { hasCustomPracticeQuestion, supportsCustomPractice } from '../engine/practice';
import { exerciseReplayPath, navigate } from '../engine/router';

export function Controls({ fullscreen = false }: { fullscreen?: boolean }) {
  const p = usePlayer(useShallow(({ trace, step, playing, speed, setStep, prev, next, toggle, setSpeed }) =>
    ({ trace, step, playing, speed, setStep, prev, next, toggle, setSpeed })));
  const cur = p.trace[p.step];
  const total = p.trace.length;
  const slug = usePlayer((state) => state.slug);
  const showPractice = !fullscreen && supportsCustomPractice(slug);
  const canPractice = useMemo(() => showPractice && hasCustomPracticeQuestion(slug, p.trace), [showPractice, slug, p.trace]);

  // 阶段去重：同名阶段只保留首次出现的步骤，点击即可跳转
  const phases = useMemo(() => {
    const result: { name: string; index: number }[] = [];
    const seen = new Set<string>();
    p.trace.forEach((s, i) => {
      if (!seen.has(s.phase)) { seen.add(s.phase); result.push({ name: s.phase, index: i }); }
    });
    return result;
  }, [p.trace]);

  return (
    <div className="panel controls-panel">
      <div className="caption" aria-live="polite">
        <span className="step-no">步骤 {p.step + 1} / {total}</span>
        <span className="phase-tag">{cur?.phase ?? '—'}</span>
        <span className="caption-text">{cur?.caption ?? '正在生成步骤…'}</span>
      </div>

      <div className="controls">
        <button onClick={() => p.setStep(0)} title="跳到开头 (Home)">|◀</button>
        <button onClick={p.prev} title="上一步 (←)">◀</button>
        <button className="primary" onClick={p.toggle} title="播放 / 暂停 (空格)">{p.playing ? '暂停' : '播放'}</button>
        <button onClick={p.next} title="下一步 (→)">▶</button>
        <button onClick={() => p.setStep(total - 1)} title="跳到结尾 (End)">▶|</button>
        <input
          className="progress"
          type="range"
          min={0}
          max={Math.max(0, total - 1)}
          value={p.step}
          onChange={(e) => p.setStep(Number(e.target.value))}
          aria-label="播放进度"
        />
        <select value={p.speed} onChange={(e) => p.setSpeed(Number(e.target.value))} aria-label="播放速度">
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={4}>4×</option>
        </select>
      </div>

      {!fullscreen && <div className="phase-chips">
        <span className="muted">阶段跳转</span>
        {phases.map((ph) => (
          <button key={ph.name} className={cur?.phase === ph.name ? 'chip active' : 'chip'} onClick={() => p.setStep(ph.index)}>
            {ph.name}
          </button>
        ))}
      </div>}
      {!fullscreen && <ShareReplay />}
      {showPractice && cur && <div className="practice-from-demo">
        <button type="button" className="mini" disabled={!canPractice} onClick={() => {
        const { slug, input, step } = usePlayer.getState();
        navigate(exerciseReplayPath({ slug, input, step }));
        }}>用这组数据练习</button>
        {!canPractice && <span className="muted">{slug === 'tree/inorder'
          ? '至少需要两个不同的结点值，才能生成选择题。'
          : '这张图没有可出题的选点或松弛步骤。'}</span>}
      </div>}
    </div>
  );
}

export function InputBar({ algo }: { algo: AlgorithmMeta }) {
  const { input, regenerate } = usePlayer(useShallow((state) => ({
    input: state.slug === algo.slug ? state.input : algo.defaultInput,
    regenerate: state.regenerate,
  })));
  // 校验规则来自算法元数据，不再全站写死「2–10 个 -999~999 的整数」
  const spec = algo.input ?? DEFAULT_INPUT;
  const stringMatch = spec.format === 'string-match';
  const graphSize = spec.format === 'graph-size';
  const treeLevel = spec.format === 'tree-level';
  const graphIsCustom = graphSize && input[0] === -1;
  const preset = graphIsCustom ? algo.defaultInput : input;
  const inputDraft = (input: number[]): [string, string] => {
    if (stringMatch) return decodeMatchInput(input);
    return [graphSize ? String(input[0]) : input.join(', '), ''];
  };
  const [draft, setDraft] = useState<[string, string]>(() => inputDraft(preset));
  const [error, setError] = useState('');
  const [presetOpen, setPresetOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const presetTrigger = useRef<HTMLButtonElement>(null);
  const customTrigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setDraft(inputDraft(preset));
    setError('');
  }, [preset, stringMatch, graphSize]);

  const applyInput = (nextInput: number[]) => {
    setError('');
    regenerate(nextInput);
    if (algo.customGraph) {
      setPresetOpen(false);
      presetTrigger.current?.focus();
    }
  };

  const apply = () => {
    const { nums, error: parseError } = stringMatch ? parseMatchInput(...draft) : parseInputText(draft[0]);
    if (parseError) { setError(parseError); return; }
    if (graphSize) {
      const presetError = validateInput(GRAPH_SIZE_INPUT, nums);
      if (nums.length !== 1 || presetError) { setError('请输入一个 3–6 的顶点数量'); return; }
      if (algo.graphCases) nums.push(preset[1] ?? 0);
    }
    const err = validateInput(spec, nums);
    if (err) { setError(err); return; }
    applyInput(nums);
  };

  const random = () => {
    const arr = randomInput(spec);
    if (graphSize && algo.graphCases) arr.push(preset[1] ?? 0);
    // 随机出来的数据若自身不合法，说明规则写错了：明确报错，而不是静默回退成默认串
    const err = validateInput(spec, arr);
    if (err) { setError(`随机生成失败：${err}`); return; }
    applyInput(arr);
  };

  if (treeLevel) {
    const count = levelTree(input).vals.length;
    return (
      <section className="panel graph-input" aria-label="树输入">
        <div className="graph-input-bar">
          <div className="graph-input-status"><strong>树输入</strong><span className="muted" role="status">{count} 个结点</span></div>
          <div className="graph-input-options">
            <button type="button" onClick={random}>随机</button>
            <button type="button" onClick={() => applyInput(algo.defaultInput)}>默认</button>
            <button type="button" ref={customTrigger} aria-haspopup="dialog" onClick={() => setCustomOpen(true)}>自定义二叉树</button>
          </div>
        </div>
        {customOpen && <CustomTreeDialog input={input} regenerate={regenerate} onClose={() => {
          setCustomOpen(false);
          customTrigger.current?.focus();
        }} />}
      </section>
    );
  }

  const presetCase = algo.graphCases?.find(({ id }) => id === (preset[1] ?? 0));
  const presetForm = (
      <form className={algo.customGraph ? 'input-panel' : 'panel input-panel'} onSubmit={(event) => { event.preventDefault(); apply(); }}>
        <div className="input-row">
          <label htmlFor="dsv-input">{stringMatch ? '主串' : graphSize ? '顶点数量' : '自定义数据'}</label>
          <input id="dsv-input" value={draft[0]} onChange={(e) => setDraft([e.target.value, draft[1]])}
            placeholder={stringMatch ? 'abababc' : '20, 60, 30, 10, 40'} spellCheck={stringMatch ? false : undefined} />
          {stringMatch && <>
            <label htmlFor="dsv-pattern">模式串</label>
            <input id="dsv-pattern" value={draft[1]} onChange={(e) => setDraft([draft[0], e.target.value])} placeholder="abc" spellCheck={false} />
          </>}
          <button className="primary" type="submit">生成动画</button>
          <button type="button" onClick={random}>随机</button>
          <button type="button" onClick={() => {
            setDraft(inputDraft(algo.defaultInput));
            applyInput(algo.defaultInput);
          }}>默认</button>
        </div>
        {algo.graphCases && <div className="graph-cases" aria-label="图案例">
          {algo.graphCases.map((example) => <button type="button" key={example.id}
            className={!graphIsCustom && (preset[1] ?? 0) === example.id ? 'chip active' : 'chip'}
            aria-pressed={!graphIsCustom && (preset[1] ?? 0) === example.id}
            onClick={() => applyInput([preset[0], example.id])}>{example.label}</button>)}
          {!graphIsCustom && <span className="muted">{presetCase?.description}</span>}
        </div>}
        <div className="input-hint">
          {error ? <span className="error" role="alert">{error}</span> : <span className="muted">{algo.inputHint}</span>}
        </div>
      </form>
  );
  if (!algo.customGraph) return presetForm;

  return (
    <section className="panel graph-input" aria-label="图输入">
      <div className="graph-input-bar">
        <div className="graph-input-status">
          <strong>图输入</strong>
          <span className="muted" role="status">{graphIsCustom ? `自定义 · ${input[1]} 个顶点` : `${presetCase?.label ?? '预设'} · ${preset[0]} 个顶点`}</span>
        </div>
        <div className="graph-input-options">
          <button type="button" ref={presetTrigger} aria-controls="dsv-preset-graph" aria-expanded={presetOpen}
            onClick={() => setPresetOpen((open) => !open)}>{presetOpen ? '收起预设' : '预设案例'}</button>
          <button type="button" ref={customTrigger} aria-haspopup="dialog" onClick={() => {
            setPresetOpen(false);
            setCustomOpen(true);
          }}>自定义图</button>
        </div>
      </div>
      <div id="dsv-preset-graph" className="graph-input-body" hidden={!presetOpen}>{presetForm}</div>
      {customOpen && <CustomGraphDialog algo={algo} input={input} regenerate={regenerate} onClose={() => {
        setCustomOpen(false);
        customTrigger.current?.focus();
      }} />}
    </section>
  );
}
