import { X } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { formatCompactCurrency, formatCurrency } from '@/lib/format';
import type { DealComparisonResult } from '@/engine/dealComparison';

interface DealComparePanelProps {
  comparison: DealComparisonResult;
  mode: 'selected' | 'suggested';
  onOpenProperty: (propertyId: string) => void;
  onRemove: (propertyId: string) => void;
  onClear: () => void;
}

export function DealComparePanel({
  comparison,
  mode,
  onOpenProperty,
  onRemove,
  onClear,
}: DealComparePanelProps) {
  return (
    <GlassCard accentColor="#7C4DFF" className="mb-6">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="label-text mb-1 text-[10px] text-purple-glow">Practice mode</p>
          <h2 className="section-title text-white">Compare Before You Buy</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-text-secondary">
            {comparison.summary.headline} {comparison.summary.detail}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-purple-glow/25 bg-purple-glow/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-purple-glow">
            {mode === 'selected' ? 'Your picks' : 'Suggested set'}
          </span>
          {mode === 'selected' && (
            <button type="button" onClick={onClear} className="btn-secondary min-h-10 px-3 py-2 text-xs">
              Clear picks
            </button>
          )}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {comparison.items.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border p-4 ${
              comparison.summary.bestId === item.id
                ? 'border-success/40 bg-success/10'
                : 'border-glass-border bg-white/[0.03]'
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-rajdhani text-lg font-semibold text-white">{item.name}</p>
                <p className="text-[11px] text-text-dim">{item.type} | {item.routeFitLabel}</p>
              </div>
              {mode === 'selected' && (
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-text-secondary hover:text-white"
                  aria-label={`Remove ${item.name} from comparison`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CompareMetric label="Cash after CPF" value={formatCompactCurrency(item.cashRequired)} tone={item.verdict === 'blocked' ? 'bad' : 'good'} />
              <CompareMetric label="Duties / levy" value={formatCompactCurrency(item.upfrontDuties)} tone="neutral" />
              <CompareMetric label="Monthly surplus" value={formatCurrency(item.monthlySurplusAfterPurchase)} tone={item.monthlySurplusAfterPurchase >= 0 ? 'good' : 'bad'} />
              <CompareMetric label="Yield" value={`${item.rentalYieldPct}%`} tone={item.rentalYieldPct >= 4 ? 'good' : 'neutral'} />
            </div>
            <div className={`mt-3 rounded-xl border p-3 ${
              item.verdict === 'ready'
                ? 'border-success/25 bg-success/10'
                : item.verdict === 'stretch'
                  ? 'border-warning/25 bg-warning/10'
                  : 'border-danger/25 bg-danger/10'
            }`}>
              <p className="label-text mb-1 text-[9px] text-text-dim">Practice read</p>
              <p className="text-xs leading-relaxed text-text-secondary">{item.nextFix}</p>
            </div>
            <div className="mt-3 rounded-xl border border-warning/20 bg-warning/10 p-3">
              <p className="label-text mb-1 text-[9px] text-warning">Worst case</p>
              <p className="text-xs leading-relaxed text-text-secondary">{item.worstCase}</p>
            </div>
            <button type="button" onClick={() => onOpenProperty(item.id)} className="btn-secondary mt-3 w-full py-3 text-xs">
              Open deal page
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-text-dim">
        Use Compare on listing cards to swap the suggested set. Comparing does not reserve cash, advance time, or buy anything.
      </p>
    </GlassCard>
  );
}

interface CompareMetricProps {
  label: string;
  value: string;
  tone: 'good' | 'bad' | 'neutral';
}

function CompareMetric({ label, value, tone }: CompareMetricProps) {
  const toneClass = tone === 'good' ? 'text-success' : tone === 'bad' ? 'text-danger' : 'text-white';
  return (
    <div className="rounded-xl border border-glass-border bg-black/20 p-3">
      <p className="label-text text-[9px] text-text-dim">{label}</p>
      <p className={`mt-1 font-mono text-sm ${toneClass}`}>{value}</p>
    </div>
  );
}

export function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-glass-border bg-black/20 p-3">
      <p className="label-text text-text-dim text-[10px]">{label}</p>
      <p className="font-mono text-white mt-1">{value}</p>
    </div>
  );
}

export function MarketFact({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-glass-border bg-white/[0.03] p-3">
      <p className="label-text text-text-dim text-[10px]">{label}</p>
      <p className="font-mono text-2xl text-white mt-1">{value}</p>
      <p className="text-text-secondary text-xs mt-1">{detail}</p>
    </div>
  );
}
