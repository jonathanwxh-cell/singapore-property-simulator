// Pure presentational components for Life.tsx. Accept already-computed
// values as props.
import type React from 'react';
import GlassCard from '@/components/GlassCard';
import SceneImage from '@/components/SceneImage';
import type { LifeActionDefinition } from '@/data/lifeActions';

export function LifeStatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} style={{ color }} />
        <span className="label-text text-text-dim text-[10px]">{label}</span>
      </div>
      <p className="font-mono text-xl font-bold text-white">{value}</p>
    </GlassCard>
  );
}

export function SnapshotRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-text-secondary text-sm">{label}</span>
      <span className={`font-mono text-sm ${positive === undefined ? 'text-white' : positive ? 'text-success' : 'text-warning'}`}>{value}</span>
    </div>
  );
}

export function ProgressLine({ label, value, max }: { label: string; value: number; max: number }) {
  const safeValue = Math.max(0, Math.min(max, value));
  const percent = (safeValue / max) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono text-white">{safeValue}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-cyan-glow" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function HeroMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-glass-border bg-white/5 px-3 py-3">
      <p className="text-text-dim text-[10px] font-mono uppercase tracking-[0.18em]">{label}</p>
      <p className={`font-mono text-sm mt-1 ${tone}`}>{value}</p>
    </div>
  );
}

export function LifeActionOptionCard({
  action,
  selected,
  selectedTone,
  onClick,
}: {
  action: LifeActionDefinition;
  selected: boolean;
  selectedTone: 'primary' | 'secondary';
  onClick: () => void;
}) {
  const selectedClasses = selectedTone === 'primary'
    ? 'border-cyan-glow/60 bg-cyan-glow/10'
    : 'border-purple-glow/60 bg-purple-glow/10';
  const idleClasses = selectedTone === 'primary'
    ? 'border-glass-border bg-white/5 hover:border-cyan-glow/40 hover:bg-cyan-glow/5'
    : 'border-glass-border bg-white/5 hover:border-purple-glow/40 hover:bg-purple-glow/5';
  const selectedLabel = selectedTone === 'primary' ? 'text-cyan-glow' : 'text-purple-glow';

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-3 transition-all ${selected ? selectedClasses : idleClasses}`}
    >
      <SceneImage src={action.image} alt={action.imageAlt} className="h-28 w-full rounded-lg object-cover mb-3" />
      <div className="flex items-center justify-between gap-3">
        <p className={`font-rajdhani font-semibold ${selected ? selectedLabel : 'text-white'}`}>{action.label}</p>
        <span className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em]" style={{ color: action.accent }}>
          {action.visualLabel}
        </span>
      </div>
      <p className="text-text-secondary text-xs mt-2 leading-relaxed">{action.description}</p>
    </button>
  );
}
