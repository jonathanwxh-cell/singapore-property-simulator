import GlassCard from '@/components/GlassCard';
import { AttentionCard } from '../DashboardComponents';

export default function PropertyOperationsPanel({
  openIssues,
  activeRenovations,
  weakTenant,
  latestOperationTitle,
  reserveCash,
  onOpenPortfolio,
}: {
  openIssues: Array<{ category: string; estimatedCost: number }>;
  activeRenovations: Array<{ activeRenovation?: { label: string; remainingMonths: number } }>;
  weakTenant?: { tenant?: { satisfaction: number } };
  latestOperationTitle?: string;
  reserveCash: number;
  onOpenPortfolio: () => void;
}) {
  return (
    <GlassCard accentColor={openIssues.length > 0 ? '#FF1744' : activeRenovations.length > 0 ? '#FFD740' : '#00E676'}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="label-text mb-1 text-[10px] text-text-dim">This Month Needs Attention</p>
          <h3 className="section-title text-white">Property Operations</h3>
        </div>
        <button onClick={onOpenPortfolio} className="btn-secondary px-3 py-2 text-xs">Open Portfolio</button>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <AttentionCard
          label="Repairs"
          value={openIssues.length > 0 ? `${openIssues.length} open` : 'Clear'}
          detail={openIssues[0] ? `${openIssues[0].category} issue: S$${openIssues[0].estimatedCost.toLocaleString()}` : 'No urgent maintenance on the board.'}
          tone={openIssues.length > 0 ? 'bad' : 'good'}
        />
        <AttentionCard
          label="Upgrades"
          value={activeRenovations.length > 0 ? `${activeRenovations.length} active` : 'Ready'}
          detail={activeRenovations[0]?.activeRenovation ? `${activeRenovations[0].activeRenovation.label}: ${activeRenovations[0].activeRenovation.remainingMonths} mo left` : 'Pick an upgrade on an owned property detail page.'}
          tone={activeRenovations.length > 0 ? 'warn' : 'neutral'}
        />
        <AttentionCard
          label="Tenants"
          value={weakTenant?.tenant ? `${weakTenant.tenant.satisfaction}/100` : 'Stable'}
          detail={weakTenant?.tenant ? 'Tenant happiness is slipping. Consider repairs or a defensive rent strategy.' : 'No low-satisfaction leases flagged.'}
          tone={weakTenant?.tenant ? 'bad' : 'good'}
        />
        <AttentionCard
          label="Reserve"
          value={`S$${reserveCash.toLocaleString()}`}
          detail={latestOperationTitle ?? 'Set aside runway before maintenance bites.'}
          tone={reserveCash > 0 ? 'good' : 'warn'}
        />
      </div>
    </GlassCard>
  );
}
