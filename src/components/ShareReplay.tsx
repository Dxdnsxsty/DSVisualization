import { useTranslate } from '../i18n';
import { useState } from 'react';
import { usePlayer } from '../engine/player';
import { algorithmReplayPath } from '../engine/router';

export function ShareReplay() {
  return <ShareLink getReplay={() => {
    const { slug, input, step, trace } = usePlayer.getState();
    if (slug && trace[step]) return { path: algorithmReplayPath(slug, { input, step }), step };
  }} />;
}

export function ShareLink({ getReplay, comparison = false }: {
  getReplay: () => { path: string; step?: number } | undefined;
  comparison?: boolean;
}) {
  const t = useTranslate();
  const [notice, setNotice] = useState<{ message: string; hint: string }>();
  const [manualLink, setManualLink] = useState('');

  const copy = async () => {
    const replay = getReplay();
    if (!replay) return;

    const url = new URL(window.location.href);
    url.hash = '#/' + replay.path;
    const file = url.protocol === 'file:';
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    const link = file ? url.hash : url.href;
    const hint = file ? '将回放片段附到同一版本单文件的地址末尾。' :
      local ? '本机地址仅适合在当前电脑使用。' : '';

    let copied = false;
    try {
      await navigator.clipboard.writeText(link);
      copied = true;
    } catch { /* Show a selectable link when clipboard access is blocked. */ }
    setManualLink(copied ? '' : link);
    const message = replay.step === undefined
      ? (copied ? '已复制对比回放。' : '请手动复制对比回放。')
      : `${copied ? '已复制' : '请手动复制'}第 ${replay.step + 1} 步的${file ? '回放片段' : '演示链接'}。`;
    setNotice({ message, hint });
  };

  return (
    <div className="share-replay">
      <button type="button" className="mini" onClick={copy}>{t(comparison ? '复制对比链接' : '复制演示链接')}</button>
      {notice && <span className="muted" role="status">{t(notice.message)}{' '}{t(notice.hint)}</span>}
      {manualLink && <input aria-label={t(comparison ? '对比链接' : '演示链接')} readOnly value={manualLink} onFocus={(event) => event.target.select()} />}
    </div>
  );
}
