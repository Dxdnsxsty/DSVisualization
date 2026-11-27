import { useTranslate } from '../i18n';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePlayer } from '../engine/player';
import { CustomGraphDialog, CustomTreeDialog } from './StructureDialogs';
import { ShareReplay } from './ShareReplay';
import type { AlgorithmMeta } from '../engine/types';
import { arrayPositionLabel, decodeArrayPositionInput, decodeMatchInput, DEFAULT_INPUT, encodeArrayPositionInput, GRAPH_SIZE_INPUT, parseInputText, parseMatchInput, randomInput, validateInput } from '../engine/input';
import { levelTree } from '../engine/structure-input';
import { hasCustomPracticeQuestion, supportsCustomPractice } from '../engine/practice';
import { exerciseReplayPath, navigate } from '../engine/router';

export function Controls({ fullscreen = false }: { fullscreen?: boolean }) {
  const t = useTranslate();
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
        <span className="step-no">{t("步骤 ")}{p.step + 1} / {total}</span>
        <span className="phase-tag">{t(cur?.phase ?? '—')}</span>
        <span className="caption-text">{t(cur?.caption ?? '正在生成步骤…')}</span>
      </div>

      <div className="controls">
        <button onClick={() => p.setStep(0)} title={t("跳到开头 (Home)")}>|◀</button>
        <button onClick={p.prev} title={t("上一步 (←)")}>◀</button>
        <button className="primary" onClick={p.toggle} title={t("播放 / 暂停 (空格)")}>{t(p.playing ? '暂停' : '播放')}</button>
        <button onClick={p.next} title={t("下一步 (→)")}>▶</button>
        <button onClick={() => p.setStep(total - 1)} title={t("跳到结尾 (End)")}>▶|</button>
        <input
          className="progress"
          type="range"
          min={0}
          max={Math.max(0, total - 1)}
          value={p.step}
          onChange={(e) => p.setStep(Number(e.target.value))}
          aria-label={t("播放进度")}
        />
        <select value={p.speed} onChange={(e) => p.setSpeed(Number(e.target.value))} aria-label={t("播放速度")}>
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={4}>4×</option>
        </select>
      </div>

      {!fullscreen && <div className="phase-chips">
        <span className="muted">{t("阶段跳转")}</span>
        {phases.map((ph) => (
          <button key={ph.name} className={cur?.phase === ph.name ? 'chip active' : 'chip'} onClick={() => p.setStep(ph.index)}>
            {t(ph.name)}
          </button>
        ))}
      </div>}
      {!fullscreen && <ShareReplay />}
      {showPractice && cur && <div className="practice-from-demo">
        <button type="button" className="mini" disabled={!canPractice} onClick={() => {
        const { slug, input, step } = usePlayer.getState();
        navigate(exerciseReplayPath({ slug, input, step }));
        }}>{t("用这组数据练习")}</button>
        {!canPractice && <span className="muted">{t(slug === 'tree/inorder'
          ? '至少需要两个不同的结点值，才能生成选择题。'
          : slug === 'graph/dijkstra' ? '这张图没有可出题的选点或松弛步骤。'
          : '这张图没有可出题的遍历步骤，请多添加几个顶点或边。')}</span>}
      </div>}
    </div>
  );
}

export function InputBar({ algo }: { algo: AlgorithmMeta }) {
  const t = useTranslate();
  const { input, regenerate } = usePlayer(useShallow((state) => ({
    input: state.slug === algo.slug ? state.input : algo.defaultInput,
    regenerate: state.regenerate,
  })));
  // 校验规则来自算法元数据，不再全站写死「2–10 个 -999~999 的整数」
  const spec = algo.input ?? DEFAULT_INPUT;
  const stringMatch = spec.format === 'string-match';
  const graphSize = spec.format === 'graph-size';
  const treeLevel = spec.format === 'tree-level';
  const positionLabel = arrayPositionLabel(spec.format);
  const graphIsCustom = graphSize && input[0] === -1;
  const preset = graphIsCustom ? algo.defaultInput : input;
  const inputDraft = (input: number[]): [string, string] => {
    if (stringMatch) return decodeMatchInput(input);
    if (positionLabel) {
      const { values, position } = decodeArrayPositionInput(input);
      return [values.join(', '), String(position)];
    }
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
  }, [preset, stringMatch, graphSize, positionLabel]);

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
    const position = /^\d+$/.test(draft[1].trim()) ? Number(draft[1]) : 0;
    const nextInput = positionLabel ? encodeArrayPositionInput(nums, position) : nums;
    const err = validateInput(spec, nextInput);
    if (err) { setError(err); return; }
    applyInput(nextInput);
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
      <section className="panel graph-input" aria-label={t("树输入")}>
        <div className="graph-input-bar">
          <div className="graph-input-status"><strong>{t("树输入")}</strong><span className="muted" role="status">{count}{t(" 个结点")}</span></div>
          <div className="graph-input-options">
            <button type="button" onClick={random}>{t("随机")}</button>
            <button type="button" onClick={() => applyInput(algo.defaultInput)}>{t("默认")}</button>
            <button type="button" ref={customTrigger} aria-haspopup="dialog" onClick={() => setCustomOpen(true)}>{t("自定义二叉树")}</button>
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
          <label htmlFor="dsv-input">{t(stringMatch ? '主串' : graphSize ? '顶点数量' : '自定义数据')}</label>
          <input id="dsv-input" value={draft[0]} onChange={(e) => setDraft([e.target.value, draft[1]])}
            placeholder={stringMatch ? 'abababc' : '20, 60, 30, 10, 40'} spellCheck={stringMatch ? false : undefined} />
          {stringMatch && <>
            <label htmlFor="dsv-pattern">{t("模式串")}</label>
            <input id="dsv-pattern" value={draft[1]} onChange={(e) => setDraft([draft[0], e.target.value])} placeholder="abc" spellCheck={false} />
          </>}
          {positionLabel && <div className="input-position">
            <label htmlFor="dsv-position">{t(positionLabel)}</label>
            <input id="dsv-position" inputMode="numeric" value={draft[1]} onChange={(e) => setDraft([draft[0], e.target.value])}
              aria-describedby="dsv-position-hint" />
          </div>}
          <button className="primary" type="submit">{t("生成动画")}</button>
          <button type="button" onClick={random}>{t("随机")}</button>
          <button type="button" onClick={() => {
            setDraft(inputDraft(algo.defaultInput));
            applyInput(algo.defaultInput);
          }}>{t("默认")}</button>
        </div>
        {algo.graphCases && <div className="graph-cases" aria-label={t("图案例")}>
          {algo.graphCases.map((example) => <button type="button" key={example.id}
            className={!graphIsCustom && (preset[1] ?? 0) === example.id ? 'chip active' : 'chip'}
            aria-pressed={!graphIsCustom && (preset[1] ?? 0) === example.id}
            onClick={() => applyInput([preset[0], example.id])}>{t(example.label)}</button>)}
          {!graphIsCustom && <span className="muted">{t(presetCase?.description)}</span>}
        </div>}
        <div className="input-hint" id={positionLabel ? 'dsv-position-hint' : undefined}>
          {error ? <span className="error" role="alert">{t(error)}</span> : <span className="muted">{t(algo.inputHint)}</span>}
        </div>
      </form>
  );
  if (!algo.customGraph) return presetForm;

  return (
    <section className="panel graph-input" aria-label={t("图输入")}>
      <div className="graph-input-bar">
        <div className="graph-input-status">
          <strong>{t("图输入")}</strong>
          <span className="muted" role="status">{t(graphIsCustom ? `自定义 · ${input[1]} 个顶点` : `${presetCase?.label ?? '预设'} · ${preset[0]} 个顶点`)}</span>
        </div>
        <div className="graph-input-options">
          <button type="button" ref={presetTrigger} aria-controls="dsv-preset-graph" aria-expanded={presetOpen}
            onClick={() => setPresetOpen((open) => !open)}>{t(presetOpen ? '收起预设' : '预设案例')}</button>
          <button type="button" ref={customTrigger} aria-haspopup="dialog" onClick={() => {
            setPresetOpen(false);
            setCustomOpen(true);
          }}>{t("自定义图")}</button>
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
