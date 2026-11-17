import { useEffect, useState } from 'react';
import { usePlayer } from '../engine/player';
import type { AlgorithmMeta } from '../engine/types';
import { DEFAULT_INPUT, parseInputText, randomInput, validateInput } from '../engine/input';

export function Controls({ onFullscreen }: { onFullscreen: () => void }) {
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
        <button onClick={onFullscreen} title="全屏 (F)">全屏</button>
      </div>

      <div className="phase-chips">
        <span className="muted">阶段跳转</span>
        {phases.map((ph) => (
          <button key={ph.name} className={cur?.phase === ph.name ? 'chip active' : 'chip'} onClick={() => p.setStep(ph.index)}>
            {ph.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function InputBar({ algo }: { algo: AlgorithmMeta }) {
  const p = usePlayer();
  // 校验规则来自算法元数据，不再全站写死「2–10 个 -999~999 的整数」
  const spec = algo.input ?? DEFAULT_INPUT;
  const [text, setText] = useState(p.input.join(', '));
  const [error, setError] = useState('');

  useEffect(() => { setText(p.input.join(', ')); setError(''); }, [p.input]);

  const apply = (raw: string): boolean => {
    const { nums, error: parseError } = parseInputText(raw);
    if (parseError) { setError(parseError); return false; }
    const err = validateInput(spec, nums);
    if (err) { setError(err); return false; }
    setError('');
    p.regenerate(nums);
    return true;
  };

  const random = () => {
    const arr = randomInput(spec);
    setText(arr.join(', '));
    // 随机出来的数据若自身不合法，说明规则写错了：明确报错，而不是静默回退成默认串
    const err = validateInput(spec, arr);
    if (err) { setError(`随机生成失败：${err}`); return; }
    setError('');
    p.regenerate(arr);
  };

  return (
    <div className="panel input-panel">
      <div className="input-row">
        <label htmlFor="dsv-input">自定义数据</label>
        <input id="dsv-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="20, 60, 30, 10, 40" />
        <button className="primary" onClick={() => apply(text)}>生成动画</button>
        <button onClick={random}>随机</button>
        <button onClick={() => { setText(algo.defaultInput.join(', ')); setError(''); p.regenerate(algo.defaultInput); }}>默认</button>
      </div>
      <div className="input-hint">
        {error ? <span className="error">{error}</span> : <span className="muted">{algo.inputHint}</span>}
        <span className="muted">改动数据会重新生成整条步骤序列</span>
      </div>
    </div>
  );
}
