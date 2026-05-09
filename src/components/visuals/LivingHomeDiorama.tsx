import { Wrench, ShieldCheck, Sofa, Users } from 'lucide-react';
import type { ElementType } from 'react';
import type { LivingHomeVisualState } from '@/engine/visuals';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

const moodClasses = {
  searching: 'from-cyan-glow/20 via-white/5 to-warning/15',
  settled: 'from-success/20 via-white/5 to-cyan-glow/10',
  earning: 'from-success/25 via-cyan-glow/10 to-warning/15',
  renovating: 'from-warning/25 via-white/5 to-cyan-glow/15',
  'repair-risk': 'from-danger/25 via-warning/10 to-white/5',
} satisfies Record<LivingHomeVisualState['mood'], string>;

export default function LivingHomeDiorama({
  home,
  className,
  compact = false,
}: {
  home: LivingHomeVisualState | null;
  className?: string;
  compact?: boolean;
}) {
  if (!home) {
    return (
      <div className={cn('overflow-hidden rounded-3xl border border-cyan-glow/20 bg-cyan-glow/10 p-4', className)}>
        <div className="relative h-44 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,#17375f,#07111d)]">
          <Skyline />
          <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-dashed border-cyan-glow/35 bg-black/35 p-4 text-center">
            <p className="label-text text-[10px] text-cyan-glow">Future home slot</p>
            <p className="mt-1 text-sm text-white">Find a first home to unlock the living-home view.</p>
          </div>
        </div>
      </div>
    );
  }

  const rentLabel = home.monthlyRent > 0 ? `${formatCurrency(home.monthlyRent)}/mo` : 'No rent';
  const conditionTone = home.conditionScore >= 75 ? 'text-success' : home.conditionScore >= 55 ? 'text-warning' : 'text-danger';

  return (
    <div className={cn('overflow-hidden rounded-3xl border border-white/10 bg-black/20', className)}>
      <div className={cn('relative overflow-hidden bg-gradient-to-br p-4', moodClasses[home.mood])}>
        <div className={cn('relative overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,#26384c,#111827)]', compact ? 'h-36' : 'h-52')}>
          <div className="absolute inset-x-8 bottom-5 h-24 -skew-y-6 rounded-2xl border-2 border-white/20 bg-[linear-gradient(135deg,#c99a6d,#74513d)] shadow-2xl" />
          <div className="absolute bottom-12 left-14 h-8 w-24 rounded-t-2xl rounded-b-lg bg-cyan-glow shadow-[92px_-22px_0_-6px_#FFD740]" />
          <div className="absolute bottom-11 right-16 h-10 w-7 rounded-lg bg-danger/80 shadow-[18px_6px_0_-2px_rgba(255,255,255,0.22)]" />
          <div className="absolute left-8 top-8 h-12 w-16 rounded-lg border border-white/15 bg-black/30">
            <div className="m-2 h-2 rounded-full bg-cyan-glow/70" />
            <div className="mx-2 mt-2 h-2 rounded-full bg-white/30" />
          </div>

          {home.activeRenovationLabel && (
            <div className="absolute right-4 top-4 rounded-full border border-warning/35 bg-warning/15 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-warning">
              Reno
            </div>
          )}
          {home.openIssueCount > 0 && (
            <div className="absolute right-4 bottom-4 rounded-full border border-danger/35 bg-danger/15 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-danger">
              Repair
            </div>
          )}
          {home.tenantSatisfaction !== null && (
            <div className="absolute left-4 bottom-4 rounded-full border border-success/35 bg-success/15 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-success">
              Tenant {home.tenantSatisfaction}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="label-text mb-1 text-[10px] text-cyan-glow">Living home</p>
            <h3 className="font-rajdhani text-xl font-bold uppercase tracking-[0.08em] text-white">{home.name}</h3>
            {!compact && <p className="mt-1 max-w-xl text-sm leading-relaxed text-text-secondary">{home.statusDetail}</p>}
          </div>
          <div className="grid min-w-[13rem] grid-cols-2 gap-2">
            <HomeChip icon={Sofa} label="Condition" value={`${home.conditionScore}/100`} valueClassName={conditionTone} />
            <HomeChip icon={Users} label="Income" value={rentLabel} valueClassName={home.monthlyRent > 0 ? 'text-success' : 'text-text-secondary'} />
            <HomeChip icon={Wrench} label="Issues" value={String(home.openIssueCount)} valueClassName={home.openIssueCount > 0 ? 'text-danger' : 'text-success'} />
            <HomeChip icon={ShieldCheck} label="Reserve" value={home.reserveProtected ? 'Covered' : 'Thin'} valueClassName={home.reserveProtected ? 'text-success' : 'text-warning'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeChip({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: ElementType;
  label: string;
  value: string;
  valueClassName: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-2">
      <div className="mb-1 flex items-center gap-1.5 text-text-dim">
        <Icon size={12} />
        <p className="label-text text-[8px]">{label}</p>
      </div>
      <p className={cn('font-mono text-[11px]', valueClassName)}>{value}</p>
    </div>
  );
}

function Skyline() {
  return (
    <>
      <div className="absolute bottom-0 left-5 h-24 w-10 rounded-t bg-cyan-glow/20" />
      <div className="absolute bottom-0 left-20 h-36 w-12 rounded-t bg-white/15" />
      <div className="absolute bottom-0 left-36 h-28 w-10 rounded-t bg-warning/20" />
      <div className="absolute bottom-0 right-20 h-32 w-12 rounded-t bg-success/20" />
      <div className="absolute bottom-0 right-6 h-24 w-10 rounded-t bg-cyan-glow/20" />
    </>
  );
}
