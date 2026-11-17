import type { InputSpec } from './types';

/** 未声明 input 的算法按这个规则校验：2–10 个 -999~999 的整数 */
export const DEFAULT_INPUT: InputSpec = { min: -999, max: 999, minLen: 2, maxLen: 10 };

/** 合法返回 null，否则返回给用户看的错误文案 */
export function validateInput(spec: InputSpec, nums: number[]): string | null {
  const min = spec.min ?? -999;
  const max = spec.max ?? 999;
  const minLen = spec.minLen ?? 2;
  const maxLen = spec.maxLen ?? 10;

  if (minLen === maxLen) {
    if (nums.length !== minLen) return `本算法需要 ${minLen} 个数`;
  } else if (nums.length < minLen || nums.length > maxLen) {
    return `请输入 ${minLen}–${maxLen} 个数`;
  }
  if (nums.some((n) => !Number.isInteger(n))) return '只能输入整数';
  if (nums.some((n) => n < min || n > max)) return `数值需在 ${min} ~ ${max} 之间`;
  return spec.check ? spec.check(nums) : null;
}

/**
 * 生成一组合法输入。
 * 范围窄（如顶点个数 3–6）时直接在其中取值；范围宽时取 10–99，避免动辄三位数。
 */
export function randomInput(spec: InputSpec): number[] {
  if (spec.random) return spec.random();
  const min = spec.min ?? -999;
  const max = spec.max ?? 999;
  const minLen = spec.minLen ?? 2;
  const maxLen = spec.maxLen ?? 10;
  const span = max - min;
  const lo = span <= 20 ? min : Math.max(min, 10);
  const hi = span <= 20 ? max : Math.min(max, 99);
  const sample = () => {
    const len = minLen === maxLen ? minLen : minLen + Math.floor(Math.random() * (maxLen - minLen + 1));
    return Array.from({ length: len }, () => lo + Math.floor(Math.random() * (hi - lo + 1)));
  };
  // min/max 只描述单值范围，字段之间的约束（如「人数 2–12、报数 1–9」）只能靠 check 判断，
  // 因此单次均匀采样未必合法：重试若干次，避免用户点「随机」直接撞上报错。
  for (let i = 0; i < 24; i++) {
    const arr = sample();
    if (validateInput(spec, arr) === null) return arr;
  }
  return sample();
}

/** 把输入框里的文本解析成数字数组；解析失败时 error 非空 */
export function parseInputText(raw: string): { nums: number[]; error: string | null } {
  const parts = raw.split(/[\s,，、]+/).filter(Boolean);
  if (parts.length === 0) return { nums: [], error: '请输入数据' };
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n))) return { nums, error: '只能输入数字' };
  return { nums, error: null };
}
