import { Clock, FastForward, Gauge, LineChart, Target, WalletCards, Wrench } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import type { NextHomePlan } from '@/engine/nextHomePlan';
import type { MonthlyIntentOption } from '@/engine/monthlyIntents';
import type { OwnershipCampaign, OwnershipCampaignTrack } from '@/engine/ownershipCampaign';

export default function NextHomeGatewayPanel({
  plan,
  campaign,
  recommendedIntent,
  onUseIntent,
  onOpenTarget,
  onAdvanceToNotableMonth,
}: {
  plan: NextHomePlan;
  campaign: OwnershipCampaign;
  recommendedIntent: MonthlyIntentOption | null;
  onUseIntent: (intent: MonthlyIntentOption) => void;
  onOpenTarget: () => void;
  onAdvanceToNotableMonth: () => void;
}) {
  const readinessTone = plan.readinessPct >= 80 ? 'text-success' : plan.readinessPct >= 45 ? 'text-warning' : 'text-cyan-glow';
  const timelineLabel = plan.phase === 'active-mop'
    ? `${plan.mopMonthsRemaining} MOP month(s) left`
    : plan.phase === 'post-mop'
      ? 'MOP complete'
      : plan.phase === 'owner-no-mop'
        ? 'No MOP lock'
        : 'First home first';

  return (
    <GlassCard accentColor="#FFD740">
      <div className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr] xl:items-center">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="label-text text-[10px] text-warning">Next Home Plan</span>
            <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-warning">
              {plan.bottleneckLabel}
            </span>
          </div>
          <h3 className="section-title text-white">{plan.targetLabel}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">{plan.summary}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <PlanMetric icon={Gauge} label="Readiness" value={`${plan.readinessPct}%`} valueClassName={readinessTone} />
            <PlanMetric icon={WalletCards} label="Need" value={formatMoney(plan.requiredCashAndCpf)} />
            <PlanMetric icon={Clock} label="Timeline" value={timelineLabel} />
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-glow via-success to-warning" style={{ width: `${plan.readinessPct}%` }} />
          </div>
          <p className="mt-3 text-xs text-text-secondary">{plan.paceLabel}</p>

          {campaign.active && campaign.activeChapter && (
            <div className="mt-4 rounded-2xl border border-cyan-glow/15 bg-cyan-glow/5 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="label-text text-[10px] text-cyan-glow">Ownership chapter</span>
                <span className="rounded-full border border-cyan-glow/30 bg-cyan-glow/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-glow">
                  {campaign.activeChapter.label}
                </span>
                <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-text-dim">
                  {campaign.activeChapter.progressPct}%
                </span>
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">{campaign.activeChapter.objective}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-text-dim">{campaign.activeChapter.milestoneLabel}</p>
              <div className="mt-4 grid gap-3">
                {campaign.tracks.map((track) => (
                  <OwnershipTrackRow key={track.id} track={track} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-glass-border bg-white/[0.03] p-4">
          <div className="mb-3 flex items-start gap-3">
            <div className="rounded-xl bg-warning/10 p-2 text-warning">
              <Target size={18} />
            </div>
            <div>
              <p className="label-text text-[10px] text-text-dim">Best move this month</p>
              <p className="font-rajdhani text-xl font-semibold text-white">{plan.recommendedMoveLabel}</p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                War chest: {formatMoney(plan.usableCashAndCpf)} / {formatMoney(plan.requiredCashAndCpf)}
                {plan.estimatedSaleEquity > 0 ? `, including ${formatMoney(plan.estimatedSaleEquity)} estimated sale equity.` : '.'}
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => recommendedIntent && onUseIntent(recommendedIntent)}
              disabled={!recommendedIntent}
              className="btn-primary min-h-11 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use Best Month
            </button>
            <button type="button" onClick={onOpenTarget} className="btn-secondary min-h-11 px-3 py-2 text-xs">
              Open Target
            </button>
            <button type="button" onClick={onAdvanceToNotableMonth} className="btn-secondary min-h-11 px-3 py-2 text-xs">
              <span className="inline-flex items-center justify-center gap-2">
                <FastForward size={14} />
                Next notable month
              </span>
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function PlanMetric({
  icon: Icon,
  label,
  value,
  valueClassName = 'text-white',
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-glass-border bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center gap-2 text-text-dim">
        <Icon size={14} />
        <span className="label-text text-[9px]">{label}</span>
      </div>
      <p className={`font-mono text-sm ${valueClassName}`}>{value}</p>
    </div>
  );
}

function formatMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `S$${(value / 1_000_000).toFixed(2)}M`;
  return `S$${Math.round(value / 1000)}K`;
}

function OwnershipTrackRow({ track }: { track: OwnershipCampaignTrack }) {
  const Icon = track.id === 'income-runway' ? WalletCards : track.id === 'home-readiness' ? Wrench : LineChart;
  const tone = track.progressPct >= 75 ? 'text-success' : track.progressPct >= 45 ? 'text-warning' : 'text-cyan-glow';

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-text-secondary">
          <Icon size={14} className={tone} />
          <span className="font-rajdhani text-sm font-semibold uppercase tracking-[0.08em] text-white">{track.label}</span>
        </div>
        <span className={`font-mono text-xs ${tone}`}>{track.progressPct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-glow to-success" style={{ width: `${track.progressPct}%` }} />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-text-dim">{track.detail}</p>
    </div>
  );
}
