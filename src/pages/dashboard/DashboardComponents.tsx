// Pure presentational components for Dashboard.tsx. Accept already-computed
// values as props — no game state or selectors here. Helpers without JSX
// live in dashboardFormatters.ts.
import type React from 'react';
import { ArrowRight } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import type { getNextBestMoves } from '@/engine/decisionCoach';
import type { FirstHomeMission } from '@/engine/firstHomeMissions';
import { coachToneClasses, missionToneClasses } from './dashboardFormatters';

export function DecisionMoveCard({
  move,
  onOpen,
}: {
  move: ReturnType<typeof getNextBestMoves>[number];
  onOpen: () => void;
}) {
  const tone = coachToneClasses(move.urgency);

  return (
    <button
      onClick={onOpen}
      className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${tone.card}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`text-[10px] font-mono uppercase tracking-[0.18em] ${tone.label}`}>{move.urgency}</span>
        <ArrowRight size={14} className={tone.label} />
      </div>
      <p className="font-rajdhani font-semibold text-white mt-2">{move.title}</p>
      <p className="text-text-secondary text-xs mt-2 leading-relaxed">{move.detail}</p>
      <p className={`text-xs font-semibold mt-3 ${tone.label}`}>{move.actionLabel}</p>
    </button>
  );
}

export function FirstHomeMissionCard({
  mission,
  onOpen,
}: {
  mission: FirstHomeMission;
  onOpen: () => void;
}) {
  const tone = missionToneClasses(mission);

  return (
    <button
      onClick={onOpen}
      className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${tone.card}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`text-[10px] font-mono uppercase tracking-[0.18em] ${tone.label}`}>
          {mission.completed ? 'done' : mission.tone}
        </span>
        <ArrowRight size={14} className={tone.label} />
      </div>
      <p className="font-rajdhani font-semibold text-white mt-2">{mission.label}</p>
      <p className="text-text-secondary text-xs mt-2 leading-relaxed">{mission.detail}</p>
    </button>
  );
}

export function AttentionCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}) {
  const toneClass = {
    good: 'text-success',
    warn: 'text-warning',
    bad: 'text-danger',
    neutral: 'text-white',
  } satisfies Record<typeof tone, string>;

  return (
    <div className="rounded-xl border border-glass-border bg-white/[0.03] p-3">
      <p className="label-text text-text-dim text-[10px]">{label}</p>
      <p className={`font-mono text-sm mt-1 ${toneClass[tone]}`}>{value}</p>
      <p className="text-text-secondary text-xs mt-2 leading-relaxed">{detail}</p>
    </div>
  );
}

export function LifeRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-cyan-glow" />
        <span className="text-text-secondary text-sm">{label}</span>
      </div>
      <span className="font-mono text-sm text-white">{value}</span>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, color, change, detail }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  change?: string;
  detail?: string;
}) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
      <div className="flex items-center gap-2 mb-2"><Icon size={18} style={{ color }} /><span className="label-text text-text-dim text-[10px]">{label}</span></div>
      <div className="flex items-end gap-2">
        <span className="font-mono text-xl font-bold text-white">{value}</span>
        {change && <span className={`text-[10px] font-mono mb-1 ${change.startsWith('+') ? 'text-success' : 'text-danger'}`}>{change}</span>}
      </div>
      {detail && <p className="text-text-dim text-[10px] mt-1">{detail}</p>}
    </GlassCard>
  );
}

export function CashflowRow({ label, value, type, isTotal }: {
  label: string;
  value: number;
  type: 'income' | 'expense';
  isTotal?: boolean;
}) {
  const color = isTotal ? (value >= 0 ? '#00E676' : '#FF1744') : type === 'income' ? '#00E676' : '#FF1744';
  return (
    <div className="flex items-center justify-between">
      <span className={`${isTotal ? 'text-white font-semibold' : 'text-text-secondary'} text-sm`}>{label}</span>
      <span className="font-mono text-sm" style={{ color }}>{type === 'expense' && !isTotal ? '-' : ''}{isTotal && value >= 0 ? '+' : ''}S${Math.abs(value).toLocaleString()}</span>
    </div>
  );
}

export function CareerMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'good' | 'warn' | 'blocked';
}) {
  const toneClasses = {
    good: 'text-success',
    warn: 'text-warning',
    blocked: 'text-danger',
  } satisfies Record<typeof tone, string>;

  return (
    <div className="rounded-lg bg-white/5 p-3">
      <p className="label-text text-text-dim text-[10px]">{label}</p>
      <p className={`font-mono text-sm ${toneClasses[tone]}`}>{value}</p>
    </div>
  );
}
