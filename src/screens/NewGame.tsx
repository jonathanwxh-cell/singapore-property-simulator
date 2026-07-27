import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useGameStore } from '@/game/useGameStore';
import { careers } from '@/data/careers';
import { householdOptions, residencyOptions } from '@/data/buyerOptions';
import { difficultySettings, type Difficulty, type BuyerResidencyStatus, type HouseholdProfile } from '@/game/types';
import { BigButton } from '@/ui/Button';
import { cn } from '@/lib/utils';
import { formatCompactCurrency } from '@/lib/format';
import { playPop } from '@/ui/sound';

const careerEmoji: Record<string, string> = {
  graduate: '🎓', banking: '💼', tech: '💻', entrepreneur: '🚀', civil: '🏛️', medical: '🩺', agent: '🏠',
};
const householdEmoji: Record<HouseholdProfile, string> = {
  'couple-family': '👨‍👩‍👧', 'single-under-35': '🧑', 'single-35-plus': '🧑‍🦱',
  'single-parent': '👩‍👧', 'multi-gen-family': '👵', 'domestic-partners': '💑', 'foreigner-investor': '🌏',
};
const difficultyMeta: Record<Difficulty, { emoji: string; blurb: string }> = {
  easy: { emoji: '🌤️', blurb: 'Generous start. Learn the ropes.' },
  normal: { emoji: '⛅', blurb: 'Realistic and balanced.' },
  hard: { emoji: '🌧️', blurb: 'Tight budgets, wild markets.' },
  tycoon: { emoji: '⛈️', blurb: 'Start from zero. For legends.' },
};

function SectionLabel({ step, children }: { step: number; children: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-coral text-[12px] font-bold text-white">{step}</span>
      <h2 className="font-jakarta text-[15px] font-bold text-ink">{children}</h2>
    </div>
  );
}

function Pick({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={() => { playPop(); onClick(); }}
      className={cn(
        'pl-press rounded-2xl border p-3 text-left transition-colors',
        active ? 'border-coral bg-coral/5 ring-2 ring-coral/40' : 'border-line-2 bg-white',
      )}
    >
      {children}
    </button>
  );
}

export default function NewGame() {
  const navigate = useNavigate();
  const newGame = useGameStore((s) => s.newGame);

  const [name, setName] = useState('');
  const [careerId, setCareerId] = useState('tech');
  const [household, setHousehold] = useState<HouseholdProfile>('couple-family');
  const [residency, setResidency] = useState<BuyerResidencyStatus>('sc');
  const [sprYear, setSprYear] = useState<1 | 2 | 3>(3);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  const chooseHousehold = (h: HouseholdProfile) => {
    setHousehold(h);
    const opt = householdOptions.find((o) => o.value === h);
    if (opt?.defaultResidency) setResidency(opt.defaultResidency);
  };

  const begin = () => {
    const opt = householdOptions.find((o) => o.value === household);
    newGame(
      name.trim() || 'You',
      careerId,
      difficulty,
      { householdProfile: household, residencyStatus: residency, age: opt?.defaultAge ?? 30, sprYear },
      undefined,
      { guidedMode: true },
    );
    navigate('/play');
  };

  return (
    <div className="mx-auto max-w-[480px] px-5 pb-32 pt-4">
      <button onClick={() => navigate('/')} className="pl-press mb-2 flex items-center gap-1 text-sm font-semibold text-ink-soft">
        <ChevronLeft size={18} /> Back
      </button>

      <h1 className="font-display text-3xl font-bold text-ink">Who are you?</h1>
      <p className="mb-5 mt-1 text-sm text-ink-soft">Four quick choices set up your story. You'll learn the rules as you play.</p>

      {/* Name */}
      <div className="mb-6">
        <SectionLabel step={1}>Your name</SectionLabel>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={18}
          placeholder="e.g. Wei Jie, Priya, Alex…"
          className="w-full rounded-2xl border border-line-2 bg-white px-4 py-3 font-jakarta text-ink outline-none focus:border-coral focus:ring-2 focus:ring-coral/30"
        />
      </div>

      {/* Career */}
      <div className="mb-6">
        <SectionLabel step={2}>What do you do?</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          {careers.map((c) => (
            <Pick key={c.id} active={careerId === c.id} onClick={() => setCareerId(c.id)}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{careerEmoji[c.id] ?? '💼'}</span>
                <div className="min-w-0">
                  <div className="truncate font-jakarta text-[13.5px] font-bold text-ink">{c.name}</div>
                  <div className="tabnums text-[12px] text-ink-soft">{formatCompactCurrency(c.startingSalary)}/mo start</div>
                </div>
              </div>
            </Pick>
          ))}
        </div>
      </div>

      {/* Who / household + residency */}
      <div className="mb-6">
        <SectionLabel step={3}>Your life right now</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          {householdOptions.map((h) => (
            <Pick key={h.value} active={household === h.value} onClick={() => chooseHousehold(h.value)}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{householdEmoji[h.value]}</span>
                <div className="truncate font-jakarta text-[13px] font-bold text-ink">{h.label}</div>
              </div>
            </Pick>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {residencyOptions.map((r) => (
            <button
              key={r.value}
              onClick={() => { playPop(); setResidency(r.value); }}
              className={cn(
                'pl-press rounded-full border px-3.5 py-2 text-[12.5px] font-bold',
                residency === r.value ? 'border-coral bg-coral text-white' : 'border-line-2 bg-white text-ink-soft',
              )}
            >
              {r.label} · {r.rateLabel}
            </button>
          ))}
        </div>
        {residency === 'spr' && (
          <div className="mt-3 rounded-2xl border border-line-2 bg-white p-3">
            <div className="text-[12px] font-bold text-ink">CPF contribution year as a PR</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([1, 2, 3] as const).map((year) => (
                <button
                  key={year}
                  onClick={() => { playPop(); setSprYear(year); }}
                  aria-pressed={sprYear === year}
                  className={cn(
                    'pl-press rounded-xl px-3 py-2 text-[12px] font-bold',
                    sprYear === year ? 'bg-grape text-white' : 'bg-paper-2 text-ink-soft',
                  )}
                >
                  Year {year}{year === 3 ? '+' : ''}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] text-ink-soft">Years 1 and 2 use graduated CPF rates; year 3+ uses the full rate.</p>
          </div>
        )}
      </div>

      {/* Difficulty */}
      <div className="mb-4">
        <SectionLabel step={4}>How hard do you want it?</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          {(Object.keys(difficultySettings) as Difficulty[]).map((d) => {
            const s = difficultySettings[d];
            return (
              <Pick key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                <div className="flex items-center justify-between">
                  <span className="font-jakarta text-[14px] font-bold text-ink">{difficultyMeta[d].emoji} {s.label}</span>
                </div>
                <div className="mt-1 text-[11.5px] leading-snug text-ink-soft">{difficultyMeta[d].blurb}</div>
                <div className="tabnums mt-1.5 text-[11px] font-semibold text-ink-faint">
                  Start {formatCompactCurrency(s.startingCash)} · Goal {formatCompactCurrency(s.targetNetWorth)}
                </div>
              </Pick>
            );
          })}
        </div>
      </div>

      {/* Begin (sticky) */}
      <motion.div
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] safe-bottom bg-gradient-to-t from-paper via-paper/95 to-transparent px-5 pt-6"
      >
        <BigButton tone="coral" onClick={begin} sub="Your story begins now" icon={<span>🔑</span>}>
          Begin
        </BigButton>
      </motion.div>
    </div>
  );
}
