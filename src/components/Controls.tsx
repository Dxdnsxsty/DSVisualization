import { useEffect, useState } from 'react';
import { usePlayer } from '../engine/player';
import type { AlgorithmMeta } from '../engine/types';
import { decodeMatchInput, DEFAULT_INPUT, parseInputText, parseMatchInput, randomInput, validateInput } from '../engine/input';

export function Controls({ onFullscreen, fullscreen = false }: { onFullscreen: () => void; fullscreen?: boolean }) {
  const p = usePlayer();
  const cur = p.trace[p.step];
  const total = p.trace.length;

  // 阶段去重：同名阶段只保留首次出现的步骤，点击即可跳转
  const phases: { name: string; index: number }[] = [];
  const seen = new Set<string>();
  p.trace.forEach((s, i) => {
    if (!seen.has(s.phase)) { seen.add(s.phase); phases.push({ name: s.phase, index: i }); }
  });

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
        <button onClick={onFullscreen} title={fullscreen ? '退出全屏 (F / Esc)' : '全屏 (F)'}>{fullscreen ? '退出全屏' : '全屏'}</button>
      </div>

      {!fullscreen && <div className="phase-chips">
        <span className="muted">阶段跳转</span>
        {phases.map((ph) => (
          <button key={ph.name} className={cur?.phase === ph.name ? 'chip active' : 'chip'} onClick={() => p.setStep(ph.index)}>
            {ph.name}
          </button>
        ))}
      </div>}
    </div>
  );
}

export function InputBar({ algo }: { algo: AlgorithmMeta }) {
  const p = usePlayer();
  // 校验规则来自算法元数据，不再全站写死「2–10 个 -999~999 的整数」
  const spec = algo.input ?? DEFAULT_INPUT;
  const stringMatch = spec.format === 'string-match';
  const [draft, setDraft] = useState<[string, string]>(() => stringMatch ? decodeMatchInput(p.input) : [p.input.join(', '), '']);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(stringMatch ? decodeMatchInput(p.input) : [p.input.join(', '), '']);
    setError('');
  }, [p.input, stringMatch]);

  const apply = () => {
    const { nums, error: parseError } = stringMatch ? parseMatchInput(...draft) : parseInputText(draft[0]);
    if (parseError) { setError(parseError); return; }
    const err = validateInput(spec, nums);
    if (err) { setError(err); return; }
    setError('');
    p.regenerate(nums);
  };

  const random = () => {
    const arr = randomInput(spec);
    // 随机出来的数据若自身不合法，说明规则写错了：明确报错，而不是静默回退成默认串
    const err = validateInput(spec, arr);
    if (err) { setError(`随机生成失败：${err}`); return; }
    setError('');
    p.regenerate(arr);
  };

  return (
    <form className="panel input-panel" onSubmit={(event) => { event.preventDefault(); apply(); }}>
      <div className="input-row">
        <label htmlFor="dsv-input">{stringMatch ? '主串' : '自定义数据'}</label>
        <input id="dsv-input" value={draft[0]} onChange={(e) => setDraft([e.target.value, draft[1]])}
          placeholder={stringMatch ? 'abababc' : '20, 60, 30, 10, 40'} spellCheck={stringMatch ? false : undefined} />
        {stringMatch && <>
          <label htmlFor="dsv-pattern">模式串</label>
          <input id="dsv-pattern" value={draft[1]} onChange={(e) => setDraft([draft[0], e.target.value])} placeholder="abc" spellCheck={false} />
        </>}
        <button className="primary" type="submit">生成动画</button>
        <button type="button" onClick={random}>随机</button>
        <button type="button" onClick={() => {
          setDraft(stringMatch ? decodeMatchInput(algo.defaultInput) : [algo.defaultInput.join(', '), '']);
          setError('');
          p.regenerate(algo.defaultInput);
        }}>默认</button>
      </div>
      <div className="input-hint">
        {error ? <span className="error" role="alert">{error}</span> : <span className="muted">{algo.inputHint}</span>}
        <span className="muted">改动数据会重新生成整条步骤序列</span>
      </div>
    </form>
  );
}
