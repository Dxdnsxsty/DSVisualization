import { useLayoutEffect, useRef, useState } from 'react';
import { usePlayer } from '../engine/player';
import { tokenize } from '../engine/highlight';
import type { AlgorithmMeta, TraceStep } from '../engine/types';

const LANG_LABEL: Record<string, string> = { cpp: 'C++', python: 'Python' };

export function CodePane({ algo }: { algo: AlgorithmMeta }) {
  const p = usePlayer();
  const lines = algo.code[p.lang] ?? [];
  const activeAnchor = p.trace[p.step]?.anchor;
  const [copied, setCopied] = useState(false);

  const boxRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const prevTop = useRef<number | null>(null);

  /**
   * 当前行高亮不是「整行变色」，而是一块独立的高亮板：
   * 换步时它从上一行滑到下一行（transform 位移），视觉上像光标在走。
   * 位移距离过大（如点击跳转跨了几十行）时不做滑动，否则会看到一道长划线。
   */
  useLayoutEffect(() => {
    const box = boxRef.current;
    const caret = caretRef.current;
    if (!box || !caret) return;
    const active = box.querySelector<HTMLElement>('.code-line.active');
    if (!active) {
      caret.style.opacity = '0';
      prevTop.current = null;
      return;
    }
    const top = active.offsetTop;
    const height = active.offsetHeight;
    const first = prevTop.current === null;
    const far = first || Math.abs(top - prevTop.current!) > height * 6;

    caret.style.opacity = '1';
    if (far) {
      caret.style.transition = 'none';
      caret.style.transform = `translateY(${top}px)`;
      caret.style.height = `${height}px`;
      requestAnimationFrame(() => { caret.style.transition = ''; });
    } else {
      caret.style.transform = `translateY(${top}px)`;
      caret.style.height = `${height}px`;
    }
    prevTop.current = top;

    // 跟随滚动：只滚代码区内部，绝不带动整页
    const pad = 12;
    if (top < box.scrollTop + pad) box.scrollTop = Math.max(top - pad, 0);
    else if (top + height > box.scrollTop + box.clientHeight - pad) {
      box.scrollTop = top + height - box.clientHeight + pad;
    }
  }, [activeAnchor, p.lang, lines.length]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.map((l) => l.text).join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const download = () => {
    const ext = p.lang === 'python' ? 'py' : 'cpp';
    const prefix = p.lang === 'python' ? '# ' : '// ';
    const text = `${prefix}${algo.title} · DS·Visual 教学示例\n${prefix}输入示例：${p.input.join(', ')}\n\n${lines.map((l) => l.text).join('\n')}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${algo.slug.replace('/', '-')}.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="panel code-panel">
      <header className="panel-head code-head">
        <span className="code-title">代码</span>
        <span className="panel-actions">
          {Object.keys(algo.code).map((lang) => (
            <button key={lang} className={p.lang === lang ? 'mini active' : 'mini'} onClick={() => p.setLang(lang)}>
              {LANG_LABEL[lang] ?? lang}
            </button>
          ))}
        </span>
      </header>

      <div className="code-toolbar">
        <span>当前执行：<code>{activeAnchor ?? '—'}</code></span>
        <span className="panel-actions">
          <button className="mini" onClick={copy}>{copied ? '已复制' : '复制'}</button>
          <button className="mini" onClick={download}>下载</button>
        </span>
      </div>

      <div className="code-lines" ref={boxRef}>
        <div className="code-caret" ref={caretRef} aria-hidden="true" />
        {lines.map((line, i) => (
          <div
            key={i}
            className={'code-line' + (line.anchor && line.anchor === activeAnchor ? ' active' : '') + (line.anchor ? ' clickable' : '')}
            onClick={() => line.anchor && p.jumpToAnchor(line.anchor)}
            title={line.anchor ? `跳到锚点 ${line.anchor} 对应的步骤` : undefined}
          >
            <span className="ln">{i + 1}</span>
            <code>
              {tokenize(line.text, p.lang).map((t, j) => (
                <span key={j} className={`tok-${t.kind}`}>{t.text}</span>
              ))}
            </code>
          </div>
        ))}
      </div>

      <div className="code-foot">点击带高亮标记的代码行，可直接跳到对应动画步骤。</div>
    </section>
  );
}

export function VarPane({ step }: { step: TraceStep }) {
  const [tab, setTab] = useState<'vars' | 'stack'>('vars');
  return (
    <section className="panel var-panel">
      <header className="panel-head">
        <span>变量 / 调用栈</span>
        <span className="panel-actions">
          <button className={tab === 'vars' ? 'mini active' : 'mini'} onClick={() => setTab('vars')}>变量</button>
          <button className={tab === 'stack' ? 'mini active' : 'mini'} onClick={() => setTab('stack')}>调用栈</button>
        </span>
      </header>
      {tab === 'vars' ? (
        <div className="var-grid">
          {Object.entries(step.vars).map(([k, v]) => (
            <div key={k} className="var-item"><span>{k}</span><code>{String(v)}</code></div>
          ))}
        </div>
      ) : (
        <div className="var-empty">
          {step.callStack?.length
            ? step.callStack.map((f, i) => <div key={i} className="stack-frame">#{i} {f}</div>)
            : '本算法不涉及递归；递归栈可视化字段 TraceStep.callStack 已预留，P1 接入递归算法后启用。'}
        </div>
      )}
    </section>
  );
}
