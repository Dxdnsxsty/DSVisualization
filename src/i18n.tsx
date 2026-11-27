import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Language = 'zh-CN' | 'en';
type Translate = <T>(value: T) => T;
type Dictionary = Record<string, string>;

const STORAGE_KEY = 'dsv-language';
const hasChinese = /\p{Script=Han}/u;
const unchanged: Translate = (value) => value;
const Locale = createContext({ language: 'zh-CN' as Language, busy: false, loadFailed: false, toggle: () => {}, t: unchanged });

function preferredLanguage(): Language {
  try { return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh-CN'; }
  catch { return 'zh-CN'; }
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function englishTranslator(dictionary: Dictionary): Translate {
  // Trace captions are generated from Chinese templates. Match the most specific source
  // template first, then translate its captured values without changing the trace itself.
  const patterns = Object.entries(dictionary)
    .filter(([key]) => /\{\d+\}/.test(key))
    .map(([key, english]) => {
      const parts = key.split(/(\{\d+\})/);
      return {
        prefix: parts[0],
        suffix: parts.at(-1)!,
        specificity: parts.filter((_, index) => index % 2 === 0).join('').length,
        pattern: new RegExp('^' + parts.map((part, index) => index % 2 ? '([\\s\\S]*?)' : escapeRegex(part)).join('') + '$'),
        english,
      };
    }).sort((a, b) => b.specificity - a.specificity);
  const cache = new Map<string, string>();

  const translate = (value: string, depth = 0): string => {
    if (!hasChinese.test(value) || depth > 8) return value;
    const existing = cache.get(value);
    if (existing !== undefined) return existing;
    const key = value.trim();
    let output = Object.hasOwn(dictionary, key) ? dictionary[key] : undefined;
    if (output === undefined) {
      for (const { prefix, suffix, pattern, english } of patterns) {
        if (!key.startsWith(prefix) || !key.endsWith(suffix)) continue;
        const match = pattern.exec(key);
        if (!match) continue;
        output = english.replace(/\{(\d+)\}/g, (_, index) => translate(match[Number(index) + 1] ?? '', depth + 1));
        break;
      }
    }
    // Generated labels occasionally combine several independently defined terms.
    output ??= key.replace(/\p{Script=Han}+/gu, (word) => Object.hasOwn(dictionary, word) ? dictionary[word] : word);
    const result = value.replace(key, () => output);
    if (cache.size > 2048) cache.clear();
    cache.set(value, result);
    return result;
  };

  return <T,>(value: T): T => typeof value === 'string' ? translate(value) as T : value;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [requested, setRequested] = useState(preferredLanguage);
  const [english, setEnglish] = useState<Translate>();
  const [loadFailed, setLoadFailed] = useState(false);
  const language = requested === 'en' && english ? 'en' : 'zh-CN';
  const busy = requested === 'en' && !english;

  useEffect(() => {
    if (!busy) return;
    let active = true;
    void import('./locales/en.json').then(({ default: dictionary }) => {
      if (active) setEnglish(() => englishTranslator(dictionary));
    }).catch(() => {
      if (active) {
        setRequested('zh-CN');
        setLoadFailed(true);
      }
    });
    return () => { active = false; };
  }, [busy]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === 'en' ? 'Data Structures Visualized' : '数据结构可视化 · 分步理解算法';
  }, [language]);

  function toggle() {
    const next = language === 'en' ? 'zh-CN' : 'en';
    setLoadFailed(false);
    setRequested(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Storage is optional. */ }
  }

  return (
    <Locale.Provider value={{
      language, busy, loadFailed, toggle, t: language === 'en' ? english! : unchanged,
    }}>
      {children}
    </Locale.Provider>
  );
}

export function useLocale() { return useContext(Locale); }
export function useTranslate(): Translate { return useLocale().t; }
