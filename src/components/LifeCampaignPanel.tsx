import { ArrowRight, Compass, Gauge, Sparkles } from 'lucide-react';
import type { LifeCampaign, LifeCampaignTone } from '@/engine/lifeCampaign';
import { cn } from '@/lib/utils';
import GlassCard from './GlassCard';

interface LifeCampaignPanelProps {
  campaign: LifeCampaign;
  onNavigate: (route: string) => void;
}

export default function LifeCampaignPanel({ campaign, onNavigate }: LifeCampaignPanelProps) {
  return (
    <GlassCard accentColor={campaign.routeColor}>
      <div className="grid gap-5 lg:grid-cols-[1.25fr,0.85fr] lg:items-stretch">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label-text mb-1 text-[10px] text-cyan-glow">Campaign Chapter</p>
              <h2 className="section-title text-white">{campaign.title}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-text-secondary">{campaign.subtitle}</p>
            </div>
            <div className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
              <p className="font-mono text-lg" style={{ color: campaign.routeColor }}>{campaign.score.overall}</p>
              <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-text-dim">Score</p>
            </div>
          </div>

          <div className="rounded-2xl border border-glass-border bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-cyan-glow" />
                <p className="text-sm font-semibold text-white">{campaign.chapter.label}</p>
              </div>
              <p className="font-mono text-xs text-text-secondary">{campaign.chapter.progressPct}%</p>
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${campaign.chapter.progressPct}%`, backgroundColor: campaign.routeColor }}
              />
            </div>
            <p className="text-xs leading-relaxed text-text-secondary">{campaign.chapter.theme}</p>
            <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.14em] text-text-dim">
              Next chapter: {campaign.nextChapterLabel}
            </p>
          </div>

          <div className={cn('rounded-2xl border p-4', toneCardClass(campaign.activeMission.tone))}>
            <p className="label-text mb-1 text-[10px] text-text-dim">Current Mission</p>
            <h3 className="font-rajdhani text-lg font-bold uppercase tracking-[0.1em] text-white">
              {campaign.activeMission.label}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{campaign.activeMission.detail}</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-black/25">
                  <div className="h-full rounded-full bg-cyan-glow" style={{ width: `${campaign.activeMission.progressPct}%` }} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(campaign.activeMission.route)}
                className="btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-4 py-3 text-sm"
              >
                {campaign.activeMission.actionLabel}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className={cn('rounded-2xl border p-4', toneCardClass(campaign.storyBeat.tone))}>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-warning" />
              <p className="label-text text-[10px] text-text-dim">Story Beat</p>
            </div>
            <h3 className="font-rajdhani text-base font-bold uppercase tracking-[0.1em] text-white">
              {campaign.storyBeat.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{campaign.storyBeat.detail}</p>
          </div>

          <div className="rounded-2xl border border-glass-border bg-black/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Gauge size={16} className="text-success" />
              <p className="label-text text-[10px] text-text-dim">Campaign Score</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ScoreChip label="Stability" value={campaign.score.stability} />
              <ScoreChip label="Wealth" value={campaign.score.wealth} />
              <ScoreChip label="Learning" value={campaign.score.learning} />
              <ScoreChip label="Stress" value={campaign.score.stress} />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-text-dim">{campaign.replayHint}</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function ScoreChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <p className="label-text text-[8px] text-text-dim">{label}</p>
      <p className={cn('mt-1 font-mono text-base', value >= 70 ? 'text-success' : value >= 40 ? 'text-warning' : 'text-danger')}>
        {value}
      </p>
    </div>
  );
}

function toneCardClass(tone: LifeCampaignTone): string {
  if (tone === 'good') return 'border-success/30 bg-success/10';
  if (tone === 'warn') return 'border-warning/35 bg-warning/10';
  if (tone === 'bad') return 'border-danger/35 bg-danger/10';
  return 'border-cyan-glow/20 bg-cyan-glow/10';
}
