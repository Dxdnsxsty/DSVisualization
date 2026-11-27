import { useTranslate } from '../i18n';
import { useState } from 'react';
import { usePlayer } from '../engine/player';
import { algorithmReplayPath } from '../engine/router';

export function ShareReplay() {
  const t = useTranslate();
  const [message, setMessage] = useState('');
  const [manualLink, setManualLink] = useState('');

  const copy = async () => {
    const { slug, input, step, trace } = usePlayer.getState();
    if (!slug || !trace[step]) return;

    const url = new URL(window.location.href);
    url.hash = '#/' + algorithmReplayPath(slug, { input, step });
    const file = url.protocol === 'file:';
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    const link = file ? url.hash : url.href;
    const hint = file ? '将回放片段附到同一版本单文件的地址末尾。' :
      local ? '本机地址仅适合在当前电脑使用。' : '';

    try {
      await navigator.clipboard.writeText(link);
      setManualLink('');
      setMessage(`已复制第 ${step + 1} 步的${file ? '回放片段' : '演示链接'}。${hint}`);
    } catch {
      setManualLink(link);
      setMessage(`请手动复制第 ${step + 1} 步的${file ? '回放片段' : '演示链接'}。${hint}`);
    }
  };

  return (
    <div className="share-replay">
      <button type="button" className="mini" onClick={copy}>{t("复制演示链接")}</button>
      <span className="muted" role="status">{t(message)}</span>
      {manualLink && <input aria-label={t("演示链接")} readOnly value={manualLink} onFocus={(event) => event.target.select()} />}
    </div>
  );
}
