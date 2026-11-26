export interface ComparisonPlayback {
  steps: [number, number];
  last: [number, number];
  playing: boolean;
  speed: number;
}

export type ComparisonAction =
  | { type: 'toggle' | 'pause' | 'next' | 'prev' | 'tick' | 'reset' }
  | { type: 'seek'; side: 0 | 1; step: number }
  | { type: 'speed'; speed: number };

export function createComparisonPlayback(lengths: [number, number], steps: [number, number] = [0, 0]): ComparisonPlayback {
  const last: [number, number] = [Math.max(0, lengths[0] - 1), Math.max(0, lengths[1] - 1)];
  return { steps: [Math.min(steps[0], last[0]), Math.min(steps[1], last[1])], last, playing: false, speed: 1 };
}

export function comparisonFinished(state: ComparisonPlayback): boolean {
  return state.steps.every((step, side) => step === state.last[side]);
}

/** 双侧独立位置，共用播放时钟；手动定位和单步操作都会暂停。 */
export function comparisonReducer(state: ComparisonPlayback, action: ComparisonAction): ComparisonPlayback {
  switch (action.type) {
    case 'toggle':
      if (state.playing) return { ...state, playing: false };
      if (state.last.every((last) => last === 0)) return state;
      return { ...state, steps: comparisonFinished(state) ? [0, 0] : state.steps, playing: true };
    case 'pause': return { ...state, playing: false };
    case 'reset': return { ...state, steps: [0, 0], playing: false };
    case 'prev': return { ...state, steps: [Math.max(0, state.steps[0] - 1), Math.max(0, state.steps[1] - 1)], playing: false };
    case 'tick':
    case 'next': {
      if (action.type === 'tick' && !state.playing) return state;
      const next: ComparisonPlayback = {
        ...state,
        steps: [Math.min(state.last[0], state.steps[0] + 1), Math.min(state.last[1], state.steps[1] + 1)],
        playing: action.type === 'tick' && state.playing,
      };
      if (comparisonFinished(next)) next.playing = false;
      return next;
    }
    case 'seek': {
      if (!Number.isFinite(action.step)) return state;
      const steps: [number, number] = [...state.steps];
      steps[action.side] = Math.max(0, Math.min(state.last[action.side], Math.trunc(action.step)));
      return { ...state, steps, playing: false };
    }
    case 'speed':
      return [0.5, 1, 2, 4].includes(action.speed) ? { ...state, speed: action.speed } : state;
  }
}
