import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/game/useGameStore';
import { scenarios, type ScenarioOption } from '@/data/scenarios';
import type { ScenarioResolution } from '@/engine/actions';
import SceneImage from '@/components/SceneImage';
import { BigButton } from '@/ui/Button';
import { Delta } from '@/ui/Money';
import { fireConfetti } from '@/ui/confetti';
import { playCoin, playChime, playFail } from '@/ui/sound';
import { formatPercent } from '@/lib/format';

const categoryStyle: Record<string, string> = {
  Personal: 'bg-grape/15 text-grape',
  Market: 'bg-sky/15 text-sky',
  Property: 'bg-teal/15 text-teal',
  Macro: 'bg-gold/20 text-[#B9791E]',
  Rare: 'bg-coral/15 text-coral',
};

export function DecisionCard({ scenarioId, onResolved }: { scenarioId: string; onResolved: () => void }) {
  const resolveScenario = useGameStore((s) => s.resolveScenario);
  const scenario = scenarios.find((sc) => sc.id === scenarioId);
  const [result, setResult] = useState<{ option: ScenarioOption; res: ScenarioResolution } | null>(null);

  if (!scenario) {
    // Unknown scenario — fail safe so the loop never locks.
    onResolved();
    return null;
  }

  const choose = (option: ScenarioOption) => {
    const res = resolveScenario(option);
    setResult({ option, res });
    const gain = res.cashDelta + (res.cpfOrdinaryDelta ?? 0);
    if (gain > 15000) { playCoin(); fireConfetti({ count: 70, y: 0.4 }); }
    else if (res.success) playChime();
    else playFail();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="pl-card overflow-hidden p-0"
    >
      <div className="relative h-36 w-full overflow-hidden">
        <SceneImage src={scenario.image} alt={scenario.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <span className={`pl-chip absolute left-3 top-3 ${categoryStyle[scenario.category] ?? 'bg-white/80 text-ink'}`}>
          {scenario.category === 'Personal' ? '✦ Life' : scenario.category} event
        </span>
        <h2 className="absolute bottom-2 left-3 right-3 font-display text-2xl font-bold leading-tight text-white drop-shadow">
          {scenario.title}
        </h2>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="choose" exit={{ opacity: 0 }}>
              <p className="text-[14px] leading-relaxed text-ink-soft">{scenario.description}</p>
              <div className="mt-4 space-y-2.5">
                {scenario.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => choose(opt)}
                    className="pl-press w-full rounded-2xl border border-line-2 bg-white p-3.5 text-left hover:border-coral hover:bg-coral/5"
                  >
                    <div className="font-jakarta text-[14.5px] font-bold text-ink">{opt.label}</div>
                    <div className="mt-0.5 text-[12.5px] leading-snug text-ink-soft">{opt.description}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-1 font-jakarta text-[15px] font-bold text-ink">
                {result.res.success ? 'You chose:' : 'It didn’t go to plan…'} {result.option.label}
              </div>
              <p className="text-[13.5px] leading-relaxed text-ink-soft">{result.res.followUpText}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {result.res.cashDelta !== 0 && (
                  <span className="pl-chip bg-paper-2"><Delta value={result.res.cashDelta} /> cash</span>
                )}
                {(result.res.cpfOrdinaryDelta ?? 0) !== 0 && (
                  <span className="pl-chip bg-paper-2"><Delta value={result.res.cpfOrdinaryDelta} /> CPF</span>
                )}
                {result.res.creditDelta !== 0 && (
                  <span className="pl-chip bg-paper-2 tabnums font-semibold text-ink-soft">
                    {result.res.creditDelta > 0 ? '↑' : '↓'} credit {Math.abs(result.res.creditDelta)}
                  </span>
                )}
                {result.res.salaryDeltaPct !== 0 && (
                  <span className="pl-chip bg-paper-2 tabnums font-semibold text-ink-soft">
                    salary {result.res.salaryDeltaPct > 0 ? '+' : ''}{formatPercent(result.res.salaryDeltaPct * 100, 0)}
                  </span>
                )}
                {result.res.propertyValueImpactPct !== 0 && (
                  <span className="pl-chip bg-paper-2 tabnums font-semibold text-ink-soft">
                    home value {result.res.propertyValueImpactPct > 0 ? '+' : ''}{formatPercent(result.res.propertyValueImpactPct, 0)}
                  </span>
                )}
              </div>

              <div className="mt-4">
                <BigButton tone="ink" onClick={onResolved}>Continue</BigButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
