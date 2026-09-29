import { useCallback, useRef, useState } from 'react';

export type SoundName =
  | 'move'
  | 'drop'
  | 'throw'
  | 'win'
  | 'draw'
  | 'click'
  | 'join'
  | 'leave'
  | 'error';

type Tone = { readonly freq: number; readonly duration: number; readonly type: OscillatorType; readonly slideTo?: number };

const TONES: Record<SoundName, readonly Tone[]> = {
  move: [{ freq: 420, duration: 0.08, type: 'triangle', slideTo: 520 }],
  drop: [{ freq: 220, duration: 0.12, type: 'square', slideTo: 150 }],
  throw: [{ freq: 520, duration: 0.1, type: 'sawtooth', slideTo: 660 }],
  win: [
    { freq: 523, duration: 0.12, type: 'triangle' },
    { freq: 659, duration: 0.12, type: 'triangle' },
    { freq: 784, duration: 0.24, type: 'triangle' },
  ],
  draw: [
    { freq: 392, duration: 0.14, type: 'sine' },
    { freq: 330, duration: 0.22, type: 'sine' },
  ],
  click: [{ freq: 660, duration: 0.05, type: 'square' }],
  join: [
    { freq: 440, duration: 0.1, type: 'sine' },
    { freq: 660, duration: 0.16, type: 'sine' },
  ],
  leave: [
    { freq: 440, duration: 0.12, type: 'sine' },
    { freq: 280, duration: 0.2, type: 'sine' },
  ],
  error: [{ freq: 180, duration: 0.18, type: 'sawtooth' }],
};

function readStoredSound(): boolean {
  if (typeof localStorage === 'undefined') return true;
  return localStorage.getItem('duel-arena:sound') !== 'off';
}

export function useSound() {
  const [enabled, setEnabled] = useState(readStoredSound);
  const contextRef = useRef<AudioContext | null>(null);

  const toggle = useCallback(() => {
    setEnabled((previous) => {
      const next = !previous;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('duel-arena:sound', next ? 'on' : 'off');
      }
      return next;
    });
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (!enabled) return;
      if (typeof window === 'undefined') return;
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const context = contextRef.current ?? new Ctor();
      contextRef.current = context;
      if (context.state === 'suspended') void context.resume();

      TONES[name].forEach((tone, index) => {
        const start = context.currentTime + index * (tone.duration + 0.02);
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = tone.type;
        oscillator.frequency.setValueAtTime(tone.freq, start);
        if (tone.slideTo) oscillator.frequency.exponentialRampToValueAtTime(tone.slideTo, start + tone.duration);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.18, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + tone.duration + 0.02);
      });
    },
    [enabled],
  );

  return { enabled, toggle, play };
}
