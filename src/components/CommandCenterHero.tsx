import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import type { CommandCenterState, VitalMetric } from '@/engine/commandCenter';
import { cn } from '@/lib/utils';
import GlassCard from './GlassCard';
import NextMonthCTA from './NextMonthCTA';

interface CommandCenterHeroProps {
  state: CommandCenterState;
  onNavigate: (route: string) => void;
}

const urgencyAccent = {
  critical: '#FF1744',
  warn: '#FFD740',
  good: '#00E676',
  neutral: '#00F0FF',
} satisfies Record<CommandCenterState['objective']['urgency'], string>;

export default function CommandCenterHero({ state, onNavigate }: CommandCenterHeroProps) {
  const objective = state.objective;

  return (
    <GlassCard accentColor={urgencyAccent[objective.urgency]} className="mb-6 overflow-hidden" padding="none">
      <div className="relative p-5 lg:p-6">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-cyan-glow/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-success/10 blur-3xl" />

        <div className="relative grid gap-5 xl:grid-cols-[1fr,360px]">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-glow/30 bg-cyan-glow/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-glow">
                <Compass size={13} /> This Month
              </span>
              <span className={cn(
                'rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em]',
                objective.urgency === 'critical'
                  ? 'border-danger/30 bg-danger/10 text-danger'
                  : objective.urgency === 'warn'
                    ? 'border-warning/30 bg-warning/10 text-warning'
                    : objective.urgency === 'good'
                      ? 'border-success/30 bg-success/10 text-success'
                      : 'border-white/10 bg-white/5 text-text-secondary',
              )}>
                {objective.urgency === 'critical' ? 'Needs response' : objective.urgency === 'warn' ? 'Worth checking' : objective.urgency === 'good' ? 'Opportunity' : 'Guided'}
              </span>
            </div>

            <h2 className="page-title max-w-3xl text-2xl text-white md:text-4xl">{objective.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">{objective.detail}</p>

            <div className="mt-3 xl:hidden">
              <NextMonthCTA variant="inline" className="py-2.5" showDetail={false} />
            </div>

            <p className="mt-3 max-w-3xl text-xs leading-relaxed text-text-dim md:text-sm">
              <Sparkles size={13} className="mr-1 inline text-warning" />
              {objective.why}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {objective.primaryRoute && (
                <button
                  type="button"
                  onClick={() => objective.primaryRoute && onNavigate(objective.primaryRoute)}
                  className="btn-primary inline-flex items-center gap-2 px-4 py-3 text-sm"
                >
                  {objective.primaryActionLabel}
                  <ArrowRight size={15} />
                </button>
              )}
              {objective.secondaryActions.map((action) => (
                <button
                  key={`${action.label}-${action.route}`}
                  type="button"
                  onClick={() => onNavigate(action.route)}
                  className="btn-secondary px-4 py-3 text-sm"
                >
                  {action.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-text-dim">
              {state.advance.tone === 'blocked'
                ? 'This action does not advance time. Resolve the blocker first, then use Next Month.'
                : 'Opening a page does not advance time. Use Next Month only after your plan feels ready.'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="order-2 sm:order-1">
              <VitalMetricStrip metrics={state.vitalMetrics} />
            </div>
            <NextMonthCTA variant="inline" className="hidden xl:block" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function VitalMetricStrip({ metrics }: { metrics: VitalMetric[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
      {metrics.map((metric) => (
        <div key={metric.id} className="rounded-2xl border border-glass-border bg-black/20 p-3">
          <p className="label-text text-[10px] text-text-dim">{metric.label}</p>
          <p className={cn(
            'mt-1 font-mono text-lg',
            metric.tone === 'good'
              ? 'text-success'
              : metric.tone === 'warn'
                ? 'text-warning'
                : metric.tone === 'bad'
                  ? 'text-danger'
                  : 'text-white',
          )}>
            {metric.value}
          </p>
          <p className="mt-0.5 text-[11px] text-text-dim">{metric.detail}</p>
        </div>
      ))}
    </div>
  );
}
