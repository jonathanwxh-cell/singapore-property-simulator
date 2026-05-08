import GlassCard from '@/components/GlassCard';
import { OperationMetric, LeaseOptionButton } from '@/pages/property/PropertyDetailComponents';
import { formatCurrency } from '@/lib/format';
import { formatRentalMode } from '@/pages/property/propertyDetailFormatters';
import { repairChoices, type RepairChoiceId } from '@/data/maintenanceEvents';
import { getRenovationQuote, renovationContractors, type RenovationTemplate } from '@/data/renovations';
import type { OwnedProperty, Player, RentalMode, RenovationContractorTier, TenantProfileId, RentStrategy, TenantLeaseDecisionId } from '@/game/types';
import type { TenantLeaseOption } from '@/engine/propertyOperations';
import type { ListingProperty } from '@/engine/listings';
import { DEFAULT_CONDITION_SCORE } from '@/engine/constants';

type TenantPlan = {
  label: string;
  description: string;
  mode: RentalMode;
  profileId: TenantProfileId;
  strategy: RentStrategy;
};

export default function PropertyOperations({
  ownedProperty,
  property,
  player,
  reservedCash,
  availableCash,
  propertyRepairExposure,
  propertyUnprotectedRisk,
  floorPlanSrc,
  renovationOptions,
  renovationContractorTier,
  tenantPlans,
  leaseOptions,
  leaseDecisionMadeThisTurn,
  actionError,
  onSelectRenovationContractor,
  onStartRenovation,
  onTenantPlan,
  onLeaseDecision,
  onRepair,
  onReserveTopUp,
}: {
  ownedProperty: OwnedProperty;
  property: ListingProperty;
  player: Player;
  reservedCash: number;
  availableCash: number;
  propertyRepairExposure: number;
  propertyUnprotectedRisk: number;
  floorPlanSrc: string;
  renovationOptions: RenovationTemplate[];
  renovationContractorTier: RenovationContractorTier;
  tenantPlans: TenantPlan[];
  leaseOptions: TenantLeaseOption[];
  leaseDecisionMadeThisTurn: boolean;
  actionError: string | null;
  onSelectRenovationContractor: (tier: RenovationContractorTier) => void;
  onStartRenovation: (templateId: string) => void;
  onTenantPlan: (mode: RentalMode, profileId: TenantProfileId, strategy: RentStrategy) => void;
  onLeaseDecision: (decisionId: TenantLeaseDecisionId) => void;
  onRepair: (issueId: string, choiceId: RepairChoiceId) => void;
  onReserveTopUp: () => void;
}) {
  return (
    <GlassCard accentColor="#00F0FF">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="label-text text-text-dim text-[10px] mb-1">Owner Mode</p>
          <h3 className="section-title text-white">Property Operations</h3>
        </div>
        <div className="text-right">
          <p className="font-mono text-white">{ownedProperty.conditionScore ?? DEFAULT_CONDITION_SCORE}/100</p>
          <p className="text-text-dim text-[10px]">condition</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr,240px] gap-4 mb-5">
        <div className="rounded-xl border border-glass-border bg-white/[0.03] p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-rajdhani text-white font-semibold uppercase tracking-[0.12em] text-sm">Floor Plan</h4>
            <span className="text-text-dim text-[10px] font-mono">{ownedProperty.floorPlanId ?? 'floorplan'}</span>
          </div>
          <img src={floorPlanSrc} alt={`${property.name} floor plan`} className="w-full rounded-lg border border-divider bg-void-navy/80" />
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <OperationMetric label="Tenant" value={ownedProperty.tenant ? `${ownedProperty.tenant.satisfaction}/100` : 'None'} />
            <OperationMetric label="MOP" value={`${ownedProperty.mopRemainingMonths ?? 0} mo`} />
            <OperationMetric label="Issues" value={String(ownedProperty.openMaintenanceIssues?.length ?? 0)} />
          </div>
        </div>

        <div className="rounded-xl border border-glass-border bg-white/[0.03] p-4">
          <h4 className="font-rajdhani text-white font-semibold uppercase tracking-[0.12em] text-sm mb-3">Reserve</h4>
          <p className="font-mono text-2xl text-cyan-glow">{formatCurrency(reservedCash)}</p>
          <p className="text-text-secondary text-xs mt-2">
            Target: {player.reserve?.targetMonths ?? 3} month(s) of ownership surprises. Available cash after reserve: {formatCurrency(availableCash)}.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <OperationMetric label="Open Exposure" value={formatCurrency(propertyRepairExposure)} />
            <OperationMetric label="Unprotected" value={formatCurrency(propertyUnprotectedRisk)} />
          </div>
          {player.reserve?.lastCoveredCost ? (
            <p className="text-success text-[11px] mt-3">Last repair covered: S${player.reserve.lastCoveredCost.toLocaleString()}</p>
          ) : propertyUnprotectedRisk > 0 ? (
            <p className="text-warning text-[11px] mt-3">Current open issues exceed reserve. A repair will still hit available cash.</p>
          ) : (
            <p className="text-text-dim text-[11px] mt-3">This is earmarked inside your cash balance, so the HUD now separates available cash from reserve.</p>
          )}
          <button onClick={onReserveTopUp} className="btn-secondary text-xs py-2 w-full mt-4">
            Earmark S$5K Reserve
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <section>
          <h4 className="font-rajdhani text-white font-semibold uppercase tracking-[0.12em] text-sm mb-3">Upgrade Plans</h4>
          {ownedProperty.activeRenovation ? (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
              <p className="text-warning font-semibold text-sm">{ownedProperty.activeRenovation.label} in progress</p>
              <p className="text-text-secondary text-xs mt-1">
                {ownedProperty.activeRenovation.remainingMonths} month(s) left with the {renovationContractors[ownedProperty.activeRenovation.contractorTier ?? 'standard'].label.toLowerCase()}.
                {ownedProperty.activeRenovation.projectedPaybackMonths
                  ? ` Approximate payback: ${ownedProperty.activeRenovation.projectedPaybackMonths} month(s).`
                  : ' Rental disruption and value uplift resolve when complete.'}
              </p>
            </div>
          ) : (
            <div>
              <div className="rounded-xl border border-glass-border bg-white/[0.03] p-3 mb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="label-text text-text-dim text-[10px] mb-1">Contractor Route</p>
                    <p className="text-text-secondary text-xs max-w-2xl">
                      Pick one renovation crew style, then compare every project through that lens. This makes ROI clearer without hiding the tradeoff.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(renovationContractors).map((contractor) => {
                      const selected = renovationContractorTier === contractor.id;
                      return (
                        <button
                          key={contractor.id}
                          type="button"
                          onClick={() => onSelectRenovationContractor(contractor.id)}
                          className={`rounded-full border px-3 py-1.5 text-[11px] font-rajdhani font-semibold uppercase tracking-[0.12em] transition-colors ${
                            selected
                              ? 'border-cyan-glow/60 bg-cyan-glow/15 text-cyan-glow'
                              : 'border-glass-border bg-black/20 text-text-secondary hover:border-cyan-glow/40'
                          }`}
                        >
                          {contractor.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="text-text-dim text-[11px] mt-2">{renovationContractors[renovationContractorTier].summary}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {renovationOptions.slice(0, 4).map((template) => {
                  const completed = ownedProperty.completedRenovations?.includes(template.category);
                  const quote = getRenovationQuote(template, renovationContractorTier, ownedProperty.monthlyRental);
                  const unaffordable = player.cash < quote.cost;
                  return (
                    <button
                      key={template.id}
                      onClick={() => onStartRenovation(template.id)}
                      disabled={completed || unaffordable}
                      className="text-left rounded-xl border border-glass-border bg-white/[0.03] p-4 hover:border-cyan-glow/50 disabled:opacity-45 disabled:hover:border-glass-border transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-white font-semibold text-sm">{template.label}</p>
                          <p className="text-text-secondary text-xs mt-1 line-clamp-2">{template.description}</p>
                        </div>
                        <span className="text-[10px] font-mono text-cyan-glow uppercase">{template.strategy}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        <OperationMetric label="Cost" value={`S$${(quote.cost / 1000).toFixed(0)}K`} />
                        <OperationMetric label="Rent" value={`+${quote.rentUpliftPct}%`} />
                        <OperationMetric label="Value" value={`+${quote.resaleUpliftPct}%`} />
                        <OperationMetric label="ETA" value={`${quote.durationMonths} mo`} />
                      </div>
                      <p className="text-text-dim text-[11px] mt-2">
                        {renovationContractors[renovationContractorTier].label} | Risk {quote.riskPct}% | Payback {quote.projectedPaybackMonths ?? 'n/a'} mo
                      </p>
                      {completed && <p className="text-success text-[11px] mt-2">Completed</p>}
                      {unaffordable && !completed && <p className="text-danger text-[11px] mt-2">Need more cash</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section>
          <h4 className="font-rajdhani text-white font-semibold uppercase tracking-[0.12em] text-sm mb-3">Tenant Strategy</h4>
          {ownedProperty.tenant && (
            <div className="rounded-lg border border-success/30 bg-success/10 p-3 mb-3">
              <p className="text-success font-semibold text-sm">
                Active {formatRentalMode(ownedProperty.tenant.rentalMode)}: S${ownedProperty.tenant.contractedRent.toLocaleString()}/mo
              </p>
              <p className="text-text-secondary text-xs mt-1">
                Satisfaction {ownedProperty.tenant.satisfaction}/100 | Renewal intent {ownedProperty.tenant.renewalIntent}/100 | Strategy {ownedProperty.tenant.rentStrategy}
              </p>
              <p className="text-text-dim text-[11px] mt-1">
                Lease ends in {Math.max(0, ownedProperty.tenant.leaseEndTurn - player.turnCount)} month(s). Decide whether to preserve occupancy, push rent, or reset to market.
              </p>
              {ownedProperty.tenant.lastMonthlyEventTurn === player.turnCount && (
                <p className="text-cyan-glow text-[11px] mt-1">
                  A tenant event resolved this month. Check the dashboard or portfolio health note to see whether it was an upside or a warning.
                </p>
              )}
            </div>
          )}
          {leaseOptions.length > 0 && (
            <div className="mb-4 rounded-xl border border-cyan-glow/20 bg-cyan-glow/5 p-3">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="label-text text-text-dim text-[10px] mb-1">Renewal Mini-Game</p>
                  <h5 className="font-rajdhani text-white font-semibold uppercase tracking-[0.1em] text-sm">Lease Decision Board</h5>
                </div>
                <span className="rounded-full border border-cyan-glow/30 px-2 py-1 text-[10px] font-mono text-cyan-glow">
                  Tenant Ops 2.0
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                {leaseOptions.map((option) => (
                  <LeaseOptionButton key={option.id} option={option} onSelect={onLeaseDecision} />
                ))}
              </div>
            </div>
          )}
          {leaseDecisionMadeThisTurn && (
            <div className="mb-4 rounded-xl border border-success/25 bg-success/10 p-3">
              <p className="font-rajdhani text-sm font-semibold uppercase tracking-[0.1em] text-success">
                Lease decision locked for this month
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Advance to next month before making another tenant decision for this property.
              </p>
            </div>
          )}
          <div className="grid md:grid-cols-3 gap-3">
            {tenantPlans.map((plan) => (
              <button
                key={plan.label}
                onClick={() => onTenantPlan(plan.mode, plan.profileId, plan.strategy)}
                className="text-left rounded-xl border border-glass-border bg-white/[0.03] p-4 hover:border-success/50 transition-colors"
              >
                <p className="text-white font-semibold text-sm">{plan.label}</p>
                <p className="text-text-secondary text-xs mt-1">{plan.description}</p>
                <p className="text-[10px] font-mono text-cyan-glow mt-3 uppercase">{plan.strategy} | {plan.mode}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h4 className="font-rajdhani text-white font-semibold uppercase tracking-[0.12em] text-sm mb-3">Repairs</h4>
          {(ownedProperty.openMaintenanceIssues?.length ?? 0) === 0 ? (
            <div className="rounded-lg border border-glass-border bg-white/[0.03] p-3">
              <p className="text-text-secondary text-sm">No open maintenance issues. Keep the reserve ready; Singapore homes are patient until they are suddenly not patient.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid md:grid-cols-[180px,1fr] gap-3 rounded-xl border border-danger/30 bg-danger/10 p-3">
                <img src="/maintenance-alert-card.svg" alt="Maintenance alert illustration" className="w-full rounded-lg border border-divider bg-void-navy/70" />
                <div>
                  <p className="font-rajdhani text-danger font-semibold uppercase tracking-[0.12em] text-sm">Maintenance Queue</p>
                  <p className="text-text-secondary text-xs mt-1 leading-relaxed">
                    Singapore homes rarely fail on schedule: air-con servicing, waterproofing, appliance replacement, and MCST levies can all bite cashflow. Choose cheap fixes for short-term relief or preventive work to protect satisfaction.
                  </p>
                  <p className="text-text-dim text-[11px] mt-2">Open exposure: {formatCurrency(propertyRepairExposure)} | Reserve gap: {formatCurrency(propertyUnprotectedRisk)}</p>
                </div>
              </div>
              {ownedProperty.openMaintenanceIssues?.map((issue) => (
                <div key={issue.id} className="rounded-xl border border-danger/30 bg-danger/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-semibold text-sm">{issue.label ?? `${issue.category.replace('-', ' ')} issue`}</p>
                      <p className="text-text-secondary text-xs mt-1">
                        {issue.severity} | Est. S${issue.estimatedCost.toLocaleString()} | Tenant impact {issue.satisfactionImpact}
                      </p>
                      {issue.riskTag && (
                        <p className="text-warning text-[11px] mt-1">{issue.riskTag}</p>
                      )}
                    </div>
                    <span className="text-danger text-[10px] font-mono uppercase">{issue.status}</span>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2 mt-3">
                    {(Object.keys(repairChoices) as RepairChoiceId[]).map((choiceId) => (
                      <button
                        key={choiceId}
                        onClick={() => onRepair(issue.id, choiceId)}
                        className="btn-secondary text-xs py-2"
                      >
                        {repairChoices[choiceId].label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {actionError && (
        <p className="text-danger text-xs text-center mt-4">{actionError}</p>
      )}
    </GlassCard>
  );
}
