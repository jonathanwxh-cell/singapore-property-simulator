import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/game/useGameStore';
import { scenarios, categoryColors } from '@/data/scenarios';
import { difficultySettings } from '@/game/types';
import GlassCard from '@/components/GlassCard';
import { Sparkles, CheckCircle, X } from 'lucide-react';
import type { ScenarioOption } from '@/data/scenarios';
import { STARTER_SCENARIO_TURN } from '@/engine/constants';
import { assessScenarioOption, type ScenarioOptionAssessment } from '@/engine/decisionCoach';

export default function Scenarios() {
  const { currentScenario, resolveScenario, player, setCurrentScenario } = useGameStore();
  const [result, setResult] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  const activeScenario = currentScenario
    ? scenarios.find(s => s.id === currentScenario)
    : null;

  const handleOption = (option: ScenarioOption) => {
    const assessment = assessScenarioOption(player, option);
    if (!assessment.canChoose) return;

    const resolution = resolveScenario(option);
    setResult(resolution.followUpText);
    setResolved(true);
  };

  const handleDismiss = () => {
    setResult(null);
    setResolved(false);
    setCurrentScenario(null);
  };

  if (!activeScenario && !result) {
    const cadence = difficultySettings[player.difficulty].eventFrequency;
    const cadenceRemainder = player.turnCount % cadence;
    const nextIn = player.properties.length === 0 && player.turnCount < STARTER_SCENARIO_TURN
      ? STARTER_SCENARIO_TURN - player.turnCount
      : player.turnCount > 0
        ? (cadenceRemainder === 0 ? cadence : cadence - cadenceRemainder)
        : cadence;

    return (
      <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="page-title text-white mb-6">AI Scenarios</h1>
          {player.turnCount === 0 ? (
            <GlassCard className="text-center py-8">
              <Sparkles size={40} className="text-purple-glow mx-auto mb-3" />
              <p className="text-text-secondary">Scenarios will appear here as you play the game.</p>
              <p className="text-text-dim text-sm mt-1">Your first one is guaranteed early so the run starts with a real decision.</p>
            </GlassCard>
          ) : (
            <>
              <GlassCard className="mb-6" accentColor="#7C4DFF">
                <div className="flex items-center gap-3">
                  <Sparkles size={24} className="text-purple-glow" />
                  <div>
                    <h3 className="section-title text-white">Next Scenario In</h3>
                    <p className="text-text-secondary text-sm">{nextIn} turns</p>
                  </div>
                </div>
              </GlassCard>
              <h3 className="section-title text-white mb-4">Available Scenarios</h3>
              <div className="space-y-3">
                {scenarios.map((scenario) => {
                  const color = categoryColors[scenario.category];
                  return (
                    <GlassCard key={scenario.id} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20`, color }}>
                        <Sparkles size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-rajdhani font-semibold text-white">{scenario.title}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded font-rajdhani uppercase" style={{ backgroundColor: `${color}20`, color }}>
                            {scenario.category}
                          </span>
                        </div>
                        <p className="text-text-secondary text-xs truncate">{scenario.description}</p>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (activeScenario && !resolved) {
    const color = categoryColors[activeScenario.category];
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }} className="w-full max-w-lg">
            <GlassCard accentColor={color} className="relative">
              <button onClick={handleDismiss} className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors"><X size={20} /></button>
              <div className="mb-4"><span className="text-[10px] px-2 py-0.5 rounded font-rajdhani uppercase" style={{ backgroundColor: `${color}20`, color }}>{activeScenario.category}</span></div>
              <img
                src={activeScenario.id === 'career-review' ? '/career-review-key-art.png' : activeScenario.image}
                alt={activeScenario.id === 'career-review' ? 'Career Review' : activeScenario.title}
                className="mb-4 h-40 w-full rounded-xl object-cover opacity-85"
              />
              <h2 className="page-title text-xl text-white mb-2">{activeScenario.title}</h2>
              <p className="text-text-secondary text-sm mb-6 leading-relaxed">{activeScenario.description}</p>
              <div className="space-y-2">
                {activeScenario.options.map((option, i) => {
                  const assessment = assessScenarioOption(player, option);
                  const tone = scenarioToneClasses(assessment);
                  return (
                    <button
                      key={i}
                      onClick={() => handleOption(option)}
                      disabled={!assessment.canChoose}
                      className={`w-full text-left p-4 rounded-lg border transition-all group disabled:cursor-not-allowed disabled:opacity-70 ${tone.card}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`font-rajdhani font-semibold text-white transition-colors ${assessment.canChoose ? 'group-hover:text-cyan-glow' : ''}`}>{option.label}</p>
                          <p className="text-text-secondary text-xs mt-1">{option.description}</p>
                        </div>
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.16em] ${tone.badge}`}>
                          {assessment.tone}
                        </span>
                      </div>
                      <p className={`text-xs mt-3 ${tone.text}`}>{assessment.summary}</p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {assessment.facts.map((fact) => (
                          <span key={fact} className="rounded-full border border-glass-border bg-white/5 px-2 py-1 text-[10px] text-text-secondary">
                            {fact}
                          </span>
                        ))}
                      </div>
                      {assessment.warning && (
                        <p className={`text-xs mt-3 leading-relaxed ${assessment.canChoose ? 'text-warning' : 'text-danger'}`}>
                          {assessment.warning}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (result) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-lg">
          <GlassCard accentColor="#00E676" className="text-center py-8">
            <CheckCircle size={48} className="text-success mx-auto mb-4" />
            <h2 className="section-title text-white mb-3">Scenario Resolved</h2>
            <p className="text-text-secondary text-sm mb-6">{result}</p>
            <button onClick={handleDismiss} className="btn-primary">Continue</button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return null;
}

function scenarioToneClasses(assessment: ScenarioOptionAssessment) {
  if (!assessment.canChoose) {
    return {
      card: 'border-danger/50 bg-danger/10',
      badge: 'border-danger/40 bg-danger/10 text-danger',
      text: 'text-danger',
    };
  }

  const classes = {
    upside: {
      card: 'border-success/35 bg-success/10 hover:border-success/70',
      badge: 'border-success/40 bg-success/10 text-success',
      text: 'text-success',
    },
    safe: {
      card: 'border-cyan-glow/30 bg-cyan-glow/5 hover:border-cyan-glow/60',
      badge: 'border-cyan-glow/40 bg-cyan-glow/10 text-cyan-glow',
      text: 'text-cyan-glow',
    },
    caution: {
      card: 'border-warning/35 bg-warning/10 hover:border-warning/70',
      badge: 'border-warning/40 bg-warning/10 text-warning',
      text: 'text-warning',
    },
    danger: {
      card: 'border-danger/50 bg-danger/10 hover:border-danger/70',
      badge: 'border-danger/40 bg-danger/10 text-danger',
      text: 'text-danger',
    },
  } satisfies Record<ScenarioOptionAssessment['tone'], { card: string; badge: string; text: string }>;

  return classes[assessment.tone];
}
