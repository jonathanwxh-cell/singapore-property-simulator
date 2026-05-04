import GlassCard from '@/components/GlassCard';
import { getRunArc } from '@/engine/runDirector';
import type { Player, RouteMilestoneStatus } from '@/game/types';
import { ArrowRight, Flag, Lock, Sparkles } from 'lucide-react';

interface RunArcPanelProps {
  player: Player;
  compact?: boolean;
  onOpenRoute?: (route: string) => void;
}

export default function RunArcPanel({ player, compact = false, onOpenRoute }: RunArcPanelProps) {
  const arc = getRunArc(player);
  const active = arc.activeMilestone;
  const visibleMilestones = compact ? arc.milestones.slice(0, 3) : arc.milestones;

  return (
    <GlassCard accentColor={arc.route.accentColor}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="label-text text-text-dim text-[10px] mb-1">Life Arc</p>
          <h3 className="section-title text-white">{arc.route.label}</h3>
          <p className="text-text-secondary text-sm mt-1 max-w-3xl">{arc.route.tagline}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-lg" style={{ color: arc.route.accentColor }}>{arc.progressPct}%</p>
          <p className="text-text-dim text-[10px]">{arc.phaseLabel}</p>
        </div>
      </div>

      <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${arc.progressPct}%`, backgroundColor: arc.route.accentColor }}
        />
      </div>

      {!compact && (
        <div className="grid lg:grid-cols-[1fr,1fr] gap-3 mb-4">
          <div className="rounded-xl border border-glass-border bg-white/[0.03] p-3">
            <p className="label-text text-text-dim text-[10px] mb-1">Route Lesson</p>
            <p className="text-white text-sm font-medium">{arc.lesson}</p>
            <p className="text-text-secondary text-xs mt-1 leading-relaxed">{arc.whyItMatters}</p>
          </div>
          <div className="rounded-xl border border-glass-border bg-white/[0.03] p-3">
            <p className="label-text text-text-dim text-[10px] mb-1">Next Milestone</p>
            {active ? (
              <>
                <p className="text-white text-sm font-medium">{active.label}</p>
                <p className="text-text-secondary text-xs mt-1 leading-relaxed">{active.detail}</p>
                {onOpenRoute && (
                  <button onClick={() => onOpenRoute(active.route)} className="btn-secondary mt-3 px-3 py-2 text-xs inline-flex items-center gap-2">
                    {active.actionLabel}
                    <ArrowRight size={14} />
                  </button>
                )}
              </>
            ) : (
              <p className="text-success text-sm">Route complete. Try a different arc next run.</p>
            )}
          </div>
        </div>
      )}

      <div className={`grid gap-2 ${compact ? 'sm:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-4'}`}>
        {visibleMilestones.map((milestone) => (
          <button
            key={milestone.id}
            onClick={() => onOpenRoute?.(milestone.route)}
            disabled={!onOpenRoute || milestone.status === 'locked'}
            className={`rounded-xl border p-3 text-left transition-all ${milestoneClass(milestone.status)}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-rajdhani text-white text-sm font-semibold leading-tight">{milestone.label}</p>
              <MilestoneIcon status={milestone.status} />
            </div>
            <p className="text-text-dim text-[10px] mt-1 uppercase tracking-[0.08em]">{milestone.impact} | {milestone.progressPct}%</p>
            {!compact && <p className="text-text-secondary text-xs mt-2 leading-relaxed">{milestone.detail}</p>}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

function MilestoneIcon({ status }: { status: RouteMilestoneStatus }) {
  if (status === 'completed') return <Sparkles size={15} className="text-success shrink-0" />;
  if (status === 'active') return <Flag size={15} className="text-warning shrink-0" />;
  return <Lock size={14} className="text-text-dim shrink-0" />;
}

function milestoneClass(status: RouteMilestoneStatus): string {
  if (status === 'completed') return 'border-success/30 bg-success/10 hover:border-success/50';
  if (status === 'active') return 'border-warning/40 bg-warning/10 hover:border-warning/60 cursor-pointer';
  return 'border-glass-border bg-white/[0.02] opacity-70 cursor-default';
}
