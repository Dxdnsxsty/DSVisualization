import { create } from 'zustand';
import type { TraceStep } from './types';
import { getAlgorithm } from '../algorithms/registry';

interface PlayerState {
  slug: string;
  input: number[];
  trace: TraceStep[];
  step: number;
  playing: boolean;
  speed: number;
  lang: string;
  load: (slug: string) => void;
  regenerate: (input: number[]) => void;
  setStep: (n: number) => void;
  next: () => void;
  prev: () => void;
  setPlaying: (v: boolean) => void;
  toggle: () => void;
  setSpeed: (v: number) => void;
  setLang: (v: string) => void;
  jumpToAnchor: (anchor: string) => void;
  phaseStarts: () => { index: number; phase: string }[];
}

export const usePlayer = create<PlayerState>((set, get) => ({
  slug: '',
  input: [],
  trace: [],
  step: 0,
  playing: false,
  speed: 1,
  lang: 'cpp',

  load: (slug) => {
    if (get().slug === slug && get().trace.length > 0) return;
    const algo = getAlgorithm(slug);
    if (!algo) return;
    set({
      slug,
      input: algo.defaultInput,
      trace: algo.generate(algo.defaultInput),
      step: 0,
      playing: false,
      lang: 'cpp',
    });
  },

  regenerate: (input) => {
    const algo = getAlgorithm(get().slug);
    if (!algo) return;
    set({ input, trace: algo.generate(input), step: 0, playing: false });
  },

  setStep: (n) => {
    const { trace } = get();
    const clamped = Math.max(0, Math.min(trace.length - 1, n));
    set({ step: clamped, playing: clamped >= trace.length - 1 ? false : get().playing });
  },
  next: () => get().setStep(get().step + 1),
  prev: () => get().setStep(get().step - 1),
  setPlaying: (v) => {
    const { trace, step } = get();
    if (v && step >= trace.length - 1) set({ step: 0, playing: true });
    else set({ playing: v });
  },
  toggle: () => get().setPlaying(!get().playing),
  setSpeed: (v) => set({ speed: v }),
  setLang: (v) => set({ lang: v }),

  jumpToAnchor: (anchor) => {
    const idx = get().trace.findIndex((s) => s.anchor === anchor);
    if (idx >= 0) set({ step: idx, playing: false });
  },

  phaseStarts: () => {
    const out: { index: number; phase: string }[] = [];
    get().trace.forEach((s, i) => {
      if (i === 0 || s.phase !== get().trace[i - 1].phase) out.push({ index: i, phase: s.phase });
    });
    return out;
  },
}));
