// Tiny WebAudio sound effects — no assets, no deps. Synthesized blips behind a
// global enabled flag (wired to settings.soundEnabled). Lazily creates the
// AudioContext on first play so we respect browser autoplay rules.

let enabled = true;
let ctx: AudioContext | null = null;

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!enabled) return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface ToneOpts {
  freq: number;
  to?: number;
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}

function tone({ freq, to, dur = 0.16, type = 'sine', gain = 0.07, delay = 0 }: ToneOpts) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to && to !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Cash / money-in — bright rising two-note "ka-ching". */
export function playCoin() {
  tone({ freq: 880, to: 1320, dur: 0.1, type: 'triangle', gain: 0.06 });
  tone({ freq: 1320, to: 1760, dur: 0.16, type: 'triangle', gain: 0.05, delay: 0.08 });
}

/** Keys handed over — triumphant little arpeggio. */
export function playKeys() {
  [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.18, type: 'triangle', gain: 0.06, delay: i * 0.07 }));
}

/** Soft month-tick / page woosh. */
export function playWoosh() {
  tone({ freq: 420, to: 180, dur: 0.22, type: 'sine', gain: 0.04 });
}

/** Tap / select pop. */
export function playPop() {
  tone({ freq: 600, to: 900, dur: 0.07, type: 'square', gain: 0.03 });
}

/** Negative / blocked / loss. */
export function playFail() {
  tone({ freq: 300, to: 140, dur: 0.32, type: 'sawtooth', gain: 0.05 });
}

/** Light confirmation chime. */
export function playChime() {
  tone({ freq: 784, dur: 0.14, type: 'sine', gain: 0.05 });
  tone({ freq: 1175, dur: 0.2, type: 'sine', gain: 0.04, delay: 0.06 });
}
