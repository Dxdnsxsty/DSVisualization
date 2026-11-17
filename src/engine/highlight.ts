/**
 * STUB: 轻量行级着色器。P2 可整体替换为 Shiki/Monaco，只要保留 tokenize(line, lang) 接口。
 * P0 的核心需求是「行 ↔ 步骤」同步，不需要完整语法高亮。
 */
export interface Token {
  text: string;
  kind: 'plain' | 'keyword' | 'comment' | 'number';
}

const KEYWORDS = 'int|void|for|if|else|while|return|struct|typedef|NULL|true|false|def|range|in|len|print|class|None|True|False|and|or|not|const|auto|bool|std|using|namespace';

export function tokenize(line: string, lang: string): Token[] {
  const commentStart = lang === 'python' ? /#.*$/ : /\/\/.*$/;
  const re = new RegExp(`(${commentStart.source}|\\b(?:${KEYWORDS})\\b|\\b\\d+\\b)`, 'g');
  const out: Token[] = [];
  let last = 0;
  for (const m of line.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: line.slice(last, at), kind: 'plain' });
    const t = m[0];
    const kind: Token['kind'] = /^\s*(\/\/|#)/.test(t) || t.startsWith('//')
      ? 'comment'
      : /^\d+$/.test(t)
        ? 'number'
        : 'keyword';
    out.push({ text: t, kind });
    last = at + t.length;
  }
  if (last < line.length) out.push({ text: line.slice(last), kind: 'plain' });
  return out.length ? out : [{ text: line, kind: 'plain' }];
}
