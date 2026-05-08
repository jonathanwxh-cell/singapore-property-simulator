import { ArrowUpRight, Compass, MapPinned, Target } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import type { NextHomeShortlistItem, OwnershipForkOption } from '@/engine/ownershipForks';

export default function OwnershipForksPanel({
  forks,
  shortlist,
  onPlayFork,
  onOpenRoute,
  onOpenBuy,
}: {
  forks: OwnershipForkOption[];
  shortlist: NextHomeShortlistItem[];
  onPlayFork: (fork: OwnershipForkOption) => void;
  onOpenRoute: (route: string) => void;
  onOpenBuy: () => void;
}) {
  return (
    <GlassCard accentColor="#7C4DFF">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="label-text mb-1 text-[10px] text-purple-glow">MOP chapter forks</p>
          <h3 className="section-title text-white">Specific moments inside the wait</h3>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-text-secondary">
            These are the two most relevant chapter beats right now. Playing one advances a month with a more specific ownership consequence than the generic plan picker alone.
          </p>
        </div>
        <button type="button" onClick={onOpenBuy} className="btn-secondary min-h-11 px-4 py-2 text-xs">
          Pin more targets
        </button>
      </div>

      <div className="mb-4 rounded-2xl border border-purple-glow/20 bg-purple-glow/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Target size={15} className="text-purple-glow" />
          <p className="label-text text-[10px] text-purple-glow">Next-home shortlist</p>
        </div>
        {shortlist.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-4 text-sm text-text-secondary">
            Pin up to three future homes from Buy or any listing page. Market-intel forks will use the first pinned target as the lead objective.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {shortlist.map((item, index) => (
              <button
                key={item.propertyId}
                type="button"
                onClick={() => onOpenRoute(item.route)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  index === 0
                    ? 'border-purple-glow/40 bg-white/[0.05]'
                    : 'border-glass-border bg-black/20 hover:border-purple-glow/30'
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-text-dim">
                    {index === 0 ? 'Lead target' : `Target ${index + 1}`}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.14em] ${
                    item.readinessLabel === 'Reachable'
                      ? 'border border-success/30 bg-success/10 text-success'
                      : item.readinessLabel === 'Stretch'
                        ? 'border border-warning/30 bg-warning/10 text-warning'
                        : 'border border-white/10 bg-black/30 text-text-dim'
                  }`}>
                    {item.readinessLabel}
                  </span>
                </div>
                <p className="font-rajdhani text-lg font-semibold text-white">{item.name}</p>
                <p className="mt-1 text-[11px] text-text-dim">{item.type} | {item.districtLabel}</p>
                <p className="mt-3 font-mono text-sm text-cyan-glow">S${Math.round(item.price / 1000)}K</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {forks.map((fork) => (
          <div
            key={fork.id}
            className={`rounded-2xl border p-4 ${
              fork.tone === 'good'
                ? 'border-success/30 bg-success/10'
                : fork.tone === 'warn'
                  ? 'border-warning/30 bg-warning/10'
                  : 'border-glass-border bg-white/[0.03]'
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Compass size={14} className={fork.tone === 'warn' ? 'text-warning' : fork.tone === 'good' ? 'text-success' : 'text-purple-glow'} />
                  <span className="label-text text-[10px] text-text-dim">Chapter fork</span>
                </div>
                <p className="font-rajdhani text-lg font-semibold text-white">{fork.title}</p>
              </div>
              <button
                type="button"
                onClick={() => onOpenRoute(fork.route)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-text-secondary hover:text-white"
                aria-label={`Open target for ${fork.title}`}
              >
                <ArrowUpRight size={14} />
              </button>
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">{fork.detail}</p>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="mb-1 flex items-center gap-2 text-text-dim">
                <MapPinned size={13} />
                <span className="label-text text-[9px]">Visible payoff</span>
              </div>
              <p className="text-xs leading-relaxed text-text-secondary">{fork.payoff}</p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => onPlayFork(fork)} className="btn-primary min-h-11 px-3 py-2 text-xs">
                Play this fork
              </button>
              <button type="button" onClick={() => onOpenRoute(fork.route)} className="btn-secondary min-h-11 px-3 py-2 text-xs">
                Open target
              </button>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
