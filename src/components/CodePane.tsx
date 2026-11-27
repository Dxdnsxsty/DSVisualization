import { useTranslate } from '../i18n';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePlayer } from '../engine/player';
import { tokenize } from '../engine/highlight';
import { arrayPositionLabel, decodeArrayPositionInput, decodeMatchInput } from '../engine/input';
import { decodeCustomGraph, formatTreeInput } from '../engine/structure-input';
import type { AlgorithmMeta, TraceStep } from '../engine/types';

const LANG_LABEL: Record<string, string> = { cpp: 'C++', python: 'Python' };

export function CodePane({ algo }: { algo: AlgorithmMeta }) {
  const t = useTranslate();
  const p = usePlayer(useShallow(({ slug, lang, input, setLang, jumpToAnchor }) =>
    ({ lang, input: slug === algo.slug ? input : algo.defaultInput, setLang, jumpToAnchor })));
  const lines = useMemo(() => algo.codeForInput?.(p.lang, p.input) ?? algo.code[p.lang] ?? algo.code.cpp,
    [algo, p.lang, p.input]);
  const activeAnchor = usePlayer((state) => state.trace[state.step]?.anchor);
  const tokenLines = useMemo(() => lines.map((line) => tokenize(
    line.text.replace(/"((?:\\.|[^"\\])*)"/g, (literal, message: string) => {
      const translated = t(message);
      return translated === message ? literal : JSON.stringify(translated);
    }),
    p.lang,
  )), [lines, p.lang, t]);
  const displayToken = (token: ReturnType<typeof tokenize>[number]) =>
    token.kind === 'comment'
      ? token.text.replace(/^(\/\/|#)(\s*)(.*)$/, (_, marker, gap, comment) => marker + gap + t(comment))
      : token.text;
  const displayCode = () => tokenLines.map((line) => line.map(displayToken).join('')).join('\n');
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
  }, [activeAnchor, p.lang, lines]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(displayCode());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const download = () => {
    const ext = p.lang === 'python' ? 'py' : 'cpp';
    const prefix = p.lang === 'python' ? '# ' : '// ';
    const code = displayCode();
    const title = `${prefix}${t(algo.title)}`;
    const example = t(formatExampleInput(algo, p.input));
    const text = algo.runnable
      ? `${title} ${t('· DS·Visual 教学示例')}\n${prefix}${t('输入示例：')}${example}\n\n${algo.runnable(p.lang, p.input, code)}\n`
      : `${title} ${t('· DS·Visual 教学片段')}\n${prefix}${t('动画输入（供参考）：')}${example}\n\n${code}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${algo.slug.replace('/', '-')}.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  function formatExampleInput(algo: AlgorithmMeta, input: number[]) {
    const [main, pattern] = algo.input?.format === 'string-match' ? decodeMatchInput(input) : [];
    const graph = algo.customGraph ? decodeCustomGraph(input) : undefined;
    if (main !== undefined) return `主串 ${main}，模式串 ${pattern}`;
    const positionLabel = arrayPositionLabel(algo.input?.format);
    if (positionLabel) {
      const { values, position } = decodeArrayPositionInput(input);
      return `${values.join(', ')} · ${t(positionLabel)} ${position}`;
    }
    if (algo.input?.format === 'tree-level') return formatTreeInput(input);
    if (graph) {
      const weighted = algo.customGraph === 'weighted' || algo.customGraph === 'weighted-signed';
      const separator = algo.customGraph === 'undirected' ? '–' : '→';
      const edges = graph.edges.map(([from, to, weight]) =>
        `${graph.labels[from]}${separator}${graph.labels[to]}${weighted ? ` (${weight})` : ''}`);
      const source = algo.customGraph === 'directed' ? '' : `，起点 ${graph.labels[graph.source]}`;
      return `顶点 ${graph.labels.join(', ')}${source}，边 ${edges.join(', ') || '无'}`;
    }
    return input.join(', ');
  }

  return (
    <section className="panel code-panel">
      <header className="panel-head code-head">
        <span className="code-title">{t("代码")}</span>
        <span className="panel-actions">
          {Object.keys(algo.code).map((lang) => (
            <button key={lang} className={p.lang === lang ? 'mini active' : 'mini'} onClick={() => p.setLang(lang)}>
              {t(LANG_LABEL[lang] ?? lang)}
            </button>
          ))}
        </span>
      </header>

      <div className="code-toolbar">
        <span>{t("当前执行：")}<code>{t(activeAnchor ?? '—')}</code></span>
        <span className="panel-actions">
          <button className="mini" onClick={copy}>{t(copied ? '已复制' : '复制')}</button>
          <button className="mini" onClick={download}>{t("下载")}</button>
        </span>
      </div>

      <div className="code-lines" ref={boxRef}>
        <div className="code-caret" ref={caretRef} aria-hidden="true" />
        {lines.map((line, i) => (
          <div
            key={i}
            className={'code-line' + (line.anchor && line.anchor === activeAnchor ? ' active' : '') + (line.anchor ? ' clickable' : '')}
            onClick={() => line.anchor && p.jumpToAnchor(line.anchor)}
            role={line.anchor ? 'button' : undefined}
            tabIndex={line.anchor ? 0 : undefined}
            onKeyDown={(event) => {
              if (line.anchor && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                p.jumpToAnchor(line.anchor);
              }
            }}
            title={t(line.anchor ? `跳到锚点 ${line.anchor} 对应的步骤` : undefined)}
          >
            <span className="ln">{i + 1}</span>
            <code>
              {tokenLines[i].map((token, j) => (
                <span key={j} className={`tok-${token.kind}`}>{displayToken(token)}</span>
              ))}
            </code>
          </div>
        ))}
      </div>

      <div className="code-foot">{t("点击带高亮标记的代码行，可直接跳到对应动画步骤。")}</div>
    </section>
  );
}

export function VarPane({ step }: { step: TraceStep }) {
  const t = useTranslate();
  const [tab, setTab] = useState<'vars' | 'stack'>('vars');
  return (
    <section className="panel var-panel">
      <header className="panel-head">
        <span>{t("变量 / 调用栈")}</span>
        <span className="panel-actions">
          <button className={tab === 'vars' ? 'mini active' : 'mini'} onClick={() => setTab('vars')}>{t("变量")}</button>
          <button className={tab === 'stack' ? 'mini active' : 'mini'} onClick={() => setTab('stack')}>{t("调用栈")}</button>
        </span>
      </header>
      {tab === 'vars' ? (
        <div className="var-grid">
          {Object.entries(step.vars).map(([k, v]) => (
            <div key={k} className="var-item"><span>{t(k)}</span><code>{t(String(v))}</code></div>
          ))}
        </div>
      ) : (
        <div className="var-empty">
          {t(step.callStack?.length
            ? step.callStack.map((f, i) => <div key={i} className="stack-frame">#{i} {t(f)}</div>)
            : '当前步骤没有活动的递归调用。')}
        </div>
      )}
    </section>
  );
}
