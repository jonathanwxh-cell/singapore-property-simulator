import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '@/game/useGameStore';
import { readAutoSave } from '@/game/savePersistence';
import { BigButton, Btn } from '@/ui/Button';
import { Sheet } from '@/ui/Sheet';
import { formatCompactCurrency } from '@/lib/format';

const HOW_STEPS = [
  { emoji: '📅', title: 'Every month is one turn', body: 'Tap “Next Month” to collect your salary, watch the market move, and let life throw curveballs.' },
  { emoji: '🏠', title: 'Buy places, collect rent', body: 'Browse the market, snap up a home you can afford, then rent it out to build passive income.' },
  { emoji: '🇸🇬', title: 'The real Singapore rules apply', body: 'CPF, stamp duties, loan limits — they all bite. Tap “why?” anywhere to see the real numbers.' },
  { emoji: '🏆', title: 'Race to freedom', body: 'Grow your net worth to your freedom goal before you go broke — and beat your kiasu classmates.' },
];

/** Stylised HDB skyline built from CSS — no image dependency. */
function Skyline() {
  const blocks = [
    { h: 64, c: '#10B4AC' }, { h: 96, c: '#7C5CFF' }, { h: 80, c: '#3B9EFF' },
    { h: 128, c: '#FF5B5B' }, { h: 72, c: '#F4A93B' }, { h: 104, c: '#15A65B' },
    { h: 88, c: '#7C5CFF' }, { h: 60, c: '#10B4AC' },
  ];
  return (
    <div className="pointer-events-none flex items-end justify-center gap-1.5 opacity-90">
      {blocks.map((b, i) => (
        <motion.div
          key={i}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: b.h, opacity: 1 }}
          transition={{ delay: 0.15 + i * 0.06, type: 'spring', stiffness: 200, damping: 18 }}
          className="w-7 rounded-t-md"
          style={{ background: b.c }}
        >
          <div className="mt-2 grid grid-cols-2 gap-1 px-1.5">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="h-1.5 rounded-[1px] bg-white/55" />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Title() {
  const navigate = useNavigate();
  const loadGame = useGameStore((s) => s.loadGame);
  const saved = useMemo(() => readAutoSave(), []);
  const [showHow, setShowHow] = useState(false);

  const handleContinue = () => {
    if (saved) {
      loadGame(saved);
      navigate('/play');
    }
  };

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-[480px] flex-col items-center justify-between px-6 py-10 text-center">
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-2"
        >
          <span className="pl-chip bg-white/70 text-ink-soft shadow-soft">🇸🇬 A Singapore Story</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 240, damping: 18 }}
          className="font-display text-[58px] font-bold leading-[0.95] text-ink"
        >
          Property
          <span className="relative ml-2 inline-block text-coral">
            Lah!
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="absolute -bottom-1 left-0 h-2 w-full origin-left rounded-full bg-gold/60"
            />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-4 max-w-[20rem] text-balance text-[15px] leading-relaxed text-ink-soft"
        >
          You're 27, with some savings and one big dream — your own place in the
          world's most expensive city. Can you make it to <b className="text-ink">freedom</b>?
        </motion.p>

        <div className="mt-9">
          <Skyline />
          <div className="mx-auto mt-0 h-1.5 w-56 rounded-full bg-ink/10" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full space-y-3"
      >
        {saved && (
          <button
            onClick={handleContinue}
            className="pl-press w-full rounded-[20px] border border-line-2 bg-white/80 px-5 py-3 text-left shadow-soft backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Continue</div>
                <div className="font-jakarta font-bold text-ink">{saved.player.name || 'Your story'}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Net worth</div>
                <div className="tabnums font-extrabold text-money">{formatCompactCurrency(saved.player.totalNetWorth)}</div>
              </div>
            </div>
          </button>
        )}

        <BigButton tone="coral" onClick={() => navigate('/new')} icon={<span className="text-xl">▶</span>}>
          Start your story
        </BigButton>

        <Btn tone="ghost" full size="sm" onClick={() => setShowHow(true)}>
          How it works — learn as you play
        </Btn>
      </motion.div>

      <Sheet open={showHow} onClose={() => setShowHow(false)} title="How to play" subtitle="60 seconds and you're ready">
        <div className="space-y-2.5 pb-2">
          {HOW_STEPS.map((s, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl border border-line-2 bg-white p-3.5">
              <span className="text-2xl">{s.emoji}</span>
              <div>
                <div className="font-jakarta text-[14px] font-bold text-ink">{s.title}</div>
                <div className="mt-0.5 text-[13px] leading-snug text-ink-soft">{s.body}</div>
              </div>
            </div>
          ))}
          <BigButton tone="coral" onClick={() => { setShowHow(false); navigate('/new'); }} icon={<span>▶</span>}>
            Got it — start
          </BigButton>
        </div>
      </Sheet>
    </div>
  );
}
