import { CheckCircle2, Circle, Trophy } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import type { FirstRunQuest } from '@/engine/runQuest';

export default function FirstRunQuestPanel({
  quest,
  onNavigate,
  onContinueStep,
}: {
  quest: FirstRunQuest;
  onNavigate: (route: string) => void;
  onContinueStep: (step: FirstRunQuest['steps'][number]) => void;
}) {
  return (
    <GlassCard accentColor="#00E676">
      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr,auto] lg:items-center">
        <div>
          <p className="label-text mb-1 text-[10px] text-success">Beginner quest</p>
          <h3 className="section-title text-white">{quest.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">{quest.beginnerHint}</p>
        </div>
        <div className="min-w-[12rem]">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.16em] text-text-dim">
            <span>Progress</span>
            <span className="text-success">{quest.progressPct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-success" style={{ width: `${quest.progressPct}%` }} />
          </div>
        </div>
      </div>

      {quest.rewardBeat && (
        <div className={`mb-4 rounded-2xl border p-3 ${
          quest.rewardBeat.tone === 'good'
            ? 'border-success/30 bg-success/10'
            : quest.rewardBeat.tone === 'warn'
              ? 'border-warning/30 bg-warning/10'
              : 'border-cyan-glow/25 bg-cyan-glow/10'
        }`}>
          <div className="flex items-start gap-3">
            <Trophy size={18} className={quest.rewardBeat.tone === 'warn' ? 'text-warning' : 'text-success'} />
            <div>
              <p className="font-rajdhani text-sm font-semibold uppercase tracking-[0.12em] text-white">{quest.rewardBeat.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">{quest.rewardBeat.detail}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-4">
        {quest.steps.map((step) => {
          const isActive = quest.activeStep?.id === step.id;
          const Icon = step.completed ? CheckCircle2 : Circle;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onNavigate(step.route)}
              className={`rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 ${
                step.completed
                  ? 'border-success/30 bg-success/10'
                  : isActive
                    ? 'border-cyan-glow/40 bg-cyan-glow/10'
                    : 'border-glass-border bg-white/[0.03]'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <Icon size={16} className={step.completed ? 'text-success' : isActive ? 'text-cyan-glow' : 'text-text-dim'} />
                <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em] text-text-dim">
                  {step.rewardLabel}
                </span>
              </div>
              <p className="font-rajdhani text-sm font-semibold uppercase tracking-[0.1em] text-white">{step.label}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{step.detail}</p>
            </button>
          );
        })}
      </div>

      {quest.activeStep && (
        <button type="button" onClick={() => onContinueStep(quest.activeStep!)} className="btn-primary mt-4 w-full py-3 text-sm">
          Continue: {quest.activeStep.label}
        </button>
      )}
    </GlassCard>
  );
}
