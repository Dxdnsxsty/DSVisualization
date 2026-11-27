import { useRef, useState } from 'react';
import { exportStudyBackup, importStudyBackup } from '../engine/study-backup';
import { useTranslate } from '../i18n';

export function StudyBackup({ onImport }: { onImport: () => void }) {
  const t = useTranslate();
  const file = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');

  function download() {
    const url = URL.createObjectURL(new Blob([exportStudyBackup()], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ds-visual-study.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function restore(backup: File) {
    try {
      const result = importStudyBackup(await backup.text());
      if (result === 'success') {
        setStatus('学习记录已合并。');
        onImport();
      } else {
        setStatus(result === 'storage' ? '浏览器无法保存学习记录。' : '无法导入。请检查学习记录文件的格式或版本。');
      }
    } catch { setStatus('无法读取学习记录文件。'); }
  }

  return (
    <div className="study-backup">
      <button className="mini" type="button" onClick={download}>{t('导出学习记录')}</button>
      <button className="mini" type="button" onClick={() => file.current?.click()}>{t('导入学习记录')}</button>
      <input ref={file} type="file" accept=".json,application/json" aria-label={t('学习记录文件')} hidden
        onChange={(event) => {
          const backup = event.target.files?.[0];
          event.target.value = '';
          if (backup) void restore(backup);
        }} />
      {status && <span className="muted" role="status">{t(status)}</span>}
    </div>
  );
}
