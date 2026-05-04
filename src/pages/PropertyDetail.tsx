import { useParams, useNavigate } from 'react-router-dom';
import { propertyTypeInfo } from '@/data/properties';
import { districts } from '@/data/districts';
import { useGameStore } from '@/game/useGameStore';
import GlassCard from '@/components/GlassCard';
import { ArrowLeft, MapPin, Bed, Bath, Maximize, Calendar, Train, ShoppingBag, Home, DollarSign, CheckCircle } from 'lucide-react';
import PropertyImage from '@/components/PropertyImage';
import { useState } from 'react';
import { formatCompactCurrency, formatCurrency, formatPercent } from '@/lib/format';
import { listingRarityInfo } from '@/data/listingChannels';
import { getDownPaymentAmount, validatePurchase } from '@/engine/purchase';
import { getListingCatalog } from '@/engine/listings';
import { selectAffordabilityReport, selectMonthlyNetCashflow, selectPotentialHousingGrant } from '@/engine/selectors';
import { TAKE_HOME_RATIO } from '@/engine/constants';
import { getLtvCap } from '@/engine/ltv';
import EligibilityBadge from '@/components/EligibilityBadge';
import { deriveEligibilityFlags, evaluatePropertyEligibility } from '@/engine/eligibility';
import { getRenovationTemplatesForType } from '@/data/renovations';
import { repairChoices, type RepairChoiceId } from '@/data/maintenanceEvents';
import type { RentalMode, RentStrategy, TenantProfileId } from '@/game/types';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { player, buyProperty, sellProperty, toggleRental, startRenovation, setTenantStrategy, resolveMaintenanceIssue, setReservePlan } = useGameStore();
  const [downPaymentPercent, setDownPaymentPercent] = useState(25);
  const [showSellConfirm, setShowSellConfirm] = useState(false);
  const [useCpfOrdinary, setUseCpfOrdinary] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const property = getListingCatalog().find(p => p.id === id);
  const district = property ? districts.find(d => d.id === property.districtId) : null;

  const ownedIndex = property ? player.properties.findIndex(op => op.propertyId === property.id) : -1;
  const isOwned = ownedIndex >= 0;
  const ownedProperty = isOwned ? player.properties[ownedIndex] : null;
  const associatedLoan = ownedProperty?.loanId ? player.loans.find(l => l.id === ownedProperty.loanId) : null;

  if (!property || !district) {
    return (
      <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4 flex items-center justify-center">
        <GlassCard>
          <h2 className="section-title text-white">Property Not Found</h2>
          <p className="text-text-secondary mt-2">The property you are looking for does not exist.</p>
          <button onClick={() => navigate('/properties')} className="btn-primary mt-4">
            Back to Properties
          </button>
        </GlassCard>
      </div>
    );
  }

  const typeInfo = propertyTypeInfo[property.type];
  const rarityInfo = listingRarityInfo[property.listingRarity];
  const activeHousingLoans = player.loans.filter(l => l.type === 'mortgage' && !l.isPaid).length;
  const minDownPaymentPercent = Math.round((1 - getLtvCap(activeHousingLoans)) * 100);
  const effectiveDownPaymentPercent = Math.max(downPaymentPercent, minDownPaymentPercent);
  const downPayment = getDownPaymentAmount(property.price, effectiveDownPaymentPercent);
  const validation = validatePurchase(player, property, downPayment);
  const cpfEligible = !property.type.startsWith('Commercial');
  const cpfApplied = cpfEligible && useCpfOrdinary ? Math.min(player.cpfOrdinary, validation.totalUpfront) : 0;
  const cashRequired = Math.max(0, validation.totalUpfront - cpfApplied);
  const monthlySurplus = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  const grantSupport = property.isHdb ? selectPotentialHousingGrant(player) : 0;
  const affordability = selectAffordabilityReport(player, cashRequired, monthlySurplus, grantSupport);
  const extraReasons = validation.reasons.filter((reason) => reason.code !== 'insufficient_cash');
  const eligibilityFlags = deriveEligibilityFlags({
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
  });
  const eligibility = evaluatePropertyEligibility({
    propertyType: property.type,
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
  });
  const eligibilityBlocked = Boolean(eligibility.blockedReason);
  const cashShortfall = Math.max(0, cashRequired - player.cash);
  const canAfford = cashShortfall === 0 && extraReasons.length === 0 && !isOwned && !eligibilityBlocked;
  const visibleMessages = Array.from(
    new Set([
      ...(cashShortfall > 0 ? [`You need ${formatCurrency(cashShortfall)} more cash after CPF OA`] : []),
      ...extraReasons.map((reason) => reason.message),
      ...(eligibility.blockedReason ? [eligibility.blockedReason] : []),
      ...(actionError ? [actionError] : []),
    ])
  );

  const handleBuy = () => {
    if (isOwned) return;
    setActionError(null);
    if (eligibilityBlocked) {
      setActionError(eligibility.blockedReason);
      return;
    }
    if (extraReasons.length > 0) {
      setActionError(extraReasons[0].message);
      return;
    }
    if (cashShortfall > 0) {
      setActionError(`You need ${formatCurrency(cashShortfall)} more cash after CPF OA.`);
      return;
    }
    const result = buyProperty(property.id, validation.downPayment, cpfApplied);
    if (result.ok) {
      setActionError(null);
      navigate('/portfolio');
      return;
    }
    setActionError(result.message);
  };

  const handleSell = () => {
    if (!isOwned) return;
    const result = sellProperty(ownedIndex);
    if (result.ok) {
      setActionError(null);
      navigate('/portfolio');
      return;
    }
    setActionError(result.message);
  };

  const handleToggleRental = () => {
    if (!isOwned) return;
    toggleRental(ownedIndex);
  };

  const handleStartRenovation = (templateId: string) => {
    if (!isOwned) return;
    const result = startRenovation(ownedIndex, templateId);
    setActionError(result.ok ? null : result.message);
  };

  const handleTenantPlan = (mode: RentalMode, profileId: TenantProfileId, rentStrategy: RentStrategy) => {
    if (!isOwned) return;
    const result = setTenantStrategy(ownedIndex, { mode, profileId, rentStrategy });
    setActionError(result.ok ? null : result.message);
  };

  const handleRepair = (issueId: string, choiceId: RepairChoiceId) => {
    if (!isOwned) return;
    const result = resolveMaintenanceIssue(ownedIndex, issueId, choiceId);
    setActionError(result.ok ? null : result.message);
  };

  const handleReserveTopUp = () => {
    const current = player.reserve?.allocatedCash ?? 0;
    const nextAllocation = Math.min(player.cash, current + 5_000);
    const result = setReservePlan({
      targetMonths: player.reserve?.targetMonths ?? 3,
      allocatedCash: nextAllocation,
      autoTopUpPct: player.reserve?.autoTopUpPct ?? 0,
    });
    setActionError(result.ok ? null : result.message);
  };

  const gain = ownedProperty ? ownedProperty.currentValue - ownedProperty.purchasePrice : 0;
  const gainPercent = ownedProperty ? (gain / ownedProperty.purchasePrice) * 100 : 0;
  const renovationOptions = getRenovationTemplatesForType(property.type);
  const tenantPlans = getTenantPlans({
    isHdb: property.isHdb,
    isCommercial: property.type.startsWith('Commercial'),
    mopRemainingMonths: ownedProperty?.mopRemainingMonths ?? 0,
  });
  const floorPlanSrc = getFloorPlanSrc(ownedProperty?.floorPlanId);

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4 game-screen">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-secondary hover:text-cyan-glow transition-colors mb-4">
          <ArrowLeft size={18} />
          <span className="font-rajdhani text-sm uppercase">Back</span>
        </button>

        <div className="relative h-64 md:h-80 rounded-xl overflow-hidden mb-6">
          <PropertyImage src={property.image} alt={property.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2 py-1 rounded text-[10px] font-rajdhani font-semibold uppercase"
                style={{ backgroundColor: typeInfo.color + '40', color: typeInfo.color }}>
                {property.type}
              </span>
              <span className="px-2 py-1 rounded text-[10px] font-rajdhani font-semibold bg-white/10 text-white">
                D{district.id} {district.region}
              </span>
              {isOwned && (
                <span className="px-2 py-1 rounded text-[10px] font-rajdhani font-semibold bg-success/20 text-success flex items-center gap-1">
                  <CheckCircle size={10} /> Owned
                </span>
              )}
              {isOwned && ownedProperty?.isRented && (
                <span className="px-2 py-1 rounded text-[10px] font-rajdhani font-semibold bg-cyan-glow/20 text-cyan-glow">
                  Rented Out
                </span>
              )}
              {!isOwned && eligibilityFlags.firstTimer && eligibility.firstTimerFriendly && (
                <EligibilityBadge label="First-Timer Friendly" tone="good" />
              )}
              {!isOwned && property.type === 'Executive Condo' && eligibility.ecEligible && (
                <EligibilityBadge label="EC Eligible" tone="good" />
              )}
              {!isOwned && eligibility.salaryCeilingExceeded && (
                <EligibilityBadge label="Salary Ceiling Exceeded" tone="blocked" />
              )}
              {!isOwned && eligibility.upgraderTier && (
                <EligibilityBadge label="Upgrader Tier" tone="warn" />
              )}
            </div>
            <h1 className="page-title text-white text-2xl md:text-4xl">{property.name}</h1>
            <p className="text-text-secondary text-sm flex items-center gap-1 mt-1">
              <MapPin size={14} /> {district.name}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <GlassCard>
              <h3 className="section-title text-white mb-4">Property Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DetailItem icon={Maximize} label="Size" value={`${property.size} sqm`} />
                <DetailItem icon={Bed} label="Bedrooms" value={String(property.bedrooms || 'N/A')} />
                <DetailItem icon={Bath} label="Bathrooms" value={String(property.bathrooms || 'N/A')} />
                <DetailItem icon={Calendar} label="Year Built" value={String(property.yearBuilt)} />
              </div>
              <p className="text-text-secondary text-sm mt-4 leading-relaxed">{property.description}</p>
            </GlassCard>

            <GlassCard>
              <h3 className="section-title text-white mb-4">Amenities & Connectivity</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="label-text text-cyan-glow text-xs mb-2">Amenities</h4>
                  <div className="space-y-1">
                    {property.amenities.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-text-secondary text-sm">
                        <ShoppingBag size={12} className="text-text-dim" />
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="label-text text-cyan-glow text-xs mb-2">MRT Lines</h4>
                  <div className="space-y-1">
                    {district.mrtLines.map((line, i) => (
                      <div key={i} className="flex items-center gap-2 text-text-secondary text-sm">
                        <Train size={12} className="text-text-dim" />
                        {line}
                      </div>
                    ))}
                  </div>
                  <p className="text-text-dim text-xs mt-3">Nearest: {property.nearestMrt}</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard accentColor={rarityInfo.accent}>
              <h3 className="section-title text-white mb-4">Investment Angle</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="label-text text-text-dim text-[10px] mb-1">Listing Channel</p>
                  <p className="font-mono text-cyan-glow">{property.listingChannel}</p>
                </div>
                <div>
                  <p className="label-text text-text-dim text-[10px] mb-1">Market Tier</p>
                  <p className="font-mono text-white">{rarityInfo.label}</p>
                </div>
                <div>
                  <p className="label-text text-text-dim text-[10px] mb-1">Archetype</p>
                  <p className="text-white">{property.archetypeLabel}</p>
                </div>
                <div>
                  <p className="label-text text-text-dim text-[10px] mb-1">Strategy</p>
                  <p className="text-white">{property.strategyTag}</p>
                </div>
              </div>
              <p className="text-text-secondary text-sm mt-4">{property.districtTheme}</p>
            </GlassCard>

            <GlassCard accentColor={eligibilityBlocked ? '#FF1744' : '#FFD740'}>
              <h3 className="section-title text-white mb-4">Eligibility</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {eligibilityFlags.firstTimer && (
                  <EligibilityBadge label="First-Timer" tone="good" />
                )}
                {eligibilityFlags.homeowner && (
                  <EligibilityBadge label="Homeowner" tone="warn" />
                )}
                {eligibilityFlags.upgrader && (
                  <EligibilityBadge label="Upgrader" tone="warn" />
                )}
                {eligibilityFlags.ecEligible && property.type === 'Executive Condo' && (
                  <EligibilityBadge label="EC Eligible" tone="good" />
                )}
                {eligibility.salaryCeilingExceeded && (
                  <EligibilityBadge label="Salary Ceiling Exceeded" tone="blocked" />
                )}
                {eligibility.upgraderTier && (
                  <EligibilityBadge label="Upgrader Tier" tone="warn" />
                )}
              </div>

              <div className="space-y-2 text-sm">
                {eligibility.firstTimerFriendly && (
                  <p className="text-success">This listing fits the early-game first-home ladder and stays readable on a starter salary.</p>
                )}
                {eligibility.salaryCeiling !== null && (
                  <p className="text-text-secondary">
                    Salary ceiling: <span className="font-mono text-white">S${eligibility.salaryCeiling.toLocaleString()}</span>
                    {' '}| Your salary: <span className={`font-mono ${eligibility.salaryCeilingExceeded ? 'text-danger' : 'text-success'}`}>S${player.salary.toLocaleString()}</span>
                  </p>
                )}
                {eligibility.blockedReason ? (
                  <p className="text-danger">{eligibility.blockedReason}</p>
                ) : (
                  <p className="text-text-secondary">
                    {eligibility.upgraderTier
                      ? 'This listing represents the next rung up. It is meant to feel more like an upgrader move than a first-home starter buy.'
                      : 'You currently meet the simplified eligibility rules for this listing.'}
                  </p>
                )}
              </div>
            </GlassCard>

            <GlassCard accentColor="#FF9100">
              <h3 className="section-title text-white mb-4">Market Analysis</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="label-text text-text-dim text-[10px]">Avg PSF (District)</p>
                  <p className="font-mono text-white text-lg">S${district.avgPSFRange[0]}-{district.avgPSFRange[1]}</p>
                </div>
                <div className="text-center">
                  <p className="label-text text-text-dim text-[10px]">Rental Yield</p>
                  <p className="font-mono text-success text-lg">{formatPercent(property.rentalYield, 1)}</p>
                </div>
                <div className="text-center">
                  <p className="label-text text-text-dim text-[10px]">Est. Monthly Rent</p>
                  <p className="font-mono text-cyan-glow text-lg">{formatCurrency(Math.round(property.price * property.rentalYield / 100 / 12))}</p>
                </div>
              </div>
            </GlassCard>

            {isOwned && ownedProperty && (
              <GlassCard accentColor="#00F0FF">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="label-text text-text-dim text-[10px] mb-1">Owner Mode</p>
                    <h3 className="section-title text-white">Property Operations</h3>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-white">{ownedProperty.conditionScore ?? 70}/100</p>
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
                    <p className="font-mono text-2xl text-cyan-glow">S${(player.reserve?.allocatedCash ?? 0).toLocaleString()}</p>
                    <p className="text-text-secondary text-xs mt-2">
                      Target: {player.reserve?.targetMonths ?? 3} month(s) of ownership surprises.
                    </p>
                    {player.reserve?.lastCoveredCost ? (
                      <p className="text-success text-[11px] mt-3">Last repair covered: S${player.reserve.lastCoveredCost.toLocaleString()}</p>
                    ) : (
                      <p className="text-text-dim text-[11px] mt-3">Repairs can draw this reserve first while still reducing cash honestly.</p>
                    )}
                    <button onClick={handleReserveTopUp} className="btn-secondary text-xs py-2 w-full mt-4">
                      Add S$5K Reserve
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
                          {ownedProperty.activeRenovation.remainingMonths} month(s) left. Rental disruption and value uplift resolve when complete.
                        </p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-3">
                        {renovationOptions.slice(0, 4).map((template) => {
                          const completed = ownedProperty.completedRenovations?.includes(template.category);
                          const unaffordable = player.cash < template.cost;
                          return (
                            <button
                              key={template.id}
                              onClick={() => handleStartRenovation(template.id)}
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
                              <div className="grid grid-cols-3 gap-2 mt-3">
                                <OperationMetric label="Cost" value={`S$${(template.cost / 1000).toFixed(0)}K`} />
                                <OperationMetric label="Rent" value={`+${template.rentUpliftPct}%`} />
                                <OperationMetric label="Value" value={`+${template.resaleUpliftPct}%`} />
                              </div>
                              {completed && <p className="text-success text-[11px] mt-2">Completed</p>}
                              {unaffordable && !completed && <p className="text-danger text-[11px] mt-2">Need more cash</p>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  <section>
                    <h4 className="font-rajdhani text-white font-semibold uppercase tracking-[0.12em] text-sm mb-3">Tenant Strategy</h4>
                    {ownedProperty.tenant && (
                      <div className="rounded-lg border border-success/30 bg-success/10 p-3 mb-3">
                        <p className="text-success font-semibold text-sm">Active lease: S${ownedProperty.tenant.contractedRent.toLocaleString()}/mo</p>
                        <p className="text-text-secondary text-xs mt-1">
                          Satisfaction {ownedProperty.tenant.satisfaction}/100 | Renewal intent {ownedProperty.tenant.renewalIntent}/100 | Strategy {ownedProperty.tenant.rentStrategy}
                        </p>
                      </div>
                    )}
                    <div className="grid md:grid-cols-3 gap-3">
                      {tenantPlans.map((plan) => (
                        <button
                          key={plan.label}
                          onClick={() => handleTenantPlan(plan.mode, plan.profileId, plan.strategy)}
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
                        {ownedProperty.openMaintenanceIssues?.map((issue) => (
                          <div key={issue.id} className="rounded-xl border border-danger/30 bg-danger/10 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-white font-semibold text-sm capitalize">{issue.category.replace('-', ' ')} issue</p>
                                <p className="text-text-secondary text-xs mt-1">
                                  {issue.severity} | Est. S${issue.estimatedCost.toLocaleString()} | Tenant impact {issue.satisfactionImpact}
                                </p>
                              </div>
                              <span className="text-danger text-[10px] font-mono uppercase">{issue.status}</span>
                            </div>
                            <div className="grid sm:grid-cols-3 gap-2 mt-3">
                              {(Object.keys(repairChoices) as RepairChoiceId[]).map((choiceId) => (
                                <button
                                  key={choiceId}
                                  onClick={() => handleRepair(issue.id, choiceId)}
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
            )}
          </div>

          <div>
            {isOwned && ownedProperty ? (
              <GlassCard accentColor="#00E676" className="sticky top-4">
                <h3 className="section-title text-white mb-4">Manage Property</h3>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Current Value</span>
                    <span className="font-mono text-white text-lg">{formatCompactCurrency(ownedProperty.currentValue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Purchase Price</span>
                    <span className="font-mono text-text-dim">{formatCompactCurrency(ownedProperty.purchasePrice)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Gain/Loss</span>
                    <span className={`font-mono ${gain >= 0 ? 'text-success' : 'text-danger'}`}>
                      {gain >= 0 ? '+' : ''}{formatCompactCurrency(gain)} ({gain >= 0 ? '+' : ''}{formatPercent(gainPercent, 1)})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Est. Monthly Rent</span>
                    <span className="font-mono text-cyan-glow">{formatCurrency(ownedProperty.monthlyRental)}</span>
                  </div>
                  {associatedLoan && !associatedLoan.isPaid && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Loan Balance</span>
                      <span className="font-mono text-warning">{formatCurrency(associatedLoan.remainingBalance)}</span>
                    </div>
                  )}

                  <div className="border-t border-divider pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Status</span>
                      <span className={`font-mono text-xs ${ownedProperty.isRented ? 'text-cyan-glow' : 'text-text-dim'}`}>
                        {ownedProperty.tenant ? `Lease (${formatCurrency(ownedProperty.tenant.contractedRent)}/mo)` : ownedProperty.isRented ? `Rented (${formatCurrency(ownedProperty.monthlyRental)}/mo)` : ownedProperty.occupancyStatus ?? 'Vacant'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-text-secondary text-sm">Condition</span>
                      <span className="font-mono text-white">{ownedProperty.conditionScore ?? 70}/100</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-text-secondary text-sm">MOP Remaining</span>
                      <span className="font-mono text-white">{ownedProperty.mopRemainingMonths ?? 0} mo</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleToggleRental}
                    className={`w-full py-3 rounded-lg font-rajdhani font-semibold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                      ownedProperty.isRented
                        ? 'bg-warning/20 text-warning border border-warning/40 hover:bg-warning/30'
                        : 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/30'
                    }`}
                  >
                    <Home size={16} />
                    {ownedProperty.isRented ? 'Stop Renting' : 'Rent Out'}
                  </button>

                  {!showSellConfirm ? (
                    <button
                      onClick={() => setShowSellConfirm(true)}
                      className="w-full py-3 rounded-lg font-rajdhani font-semibold text-sm tracking-wider uppercase bg-danger/20 text-danger border border-danger/40 hover:bg-danger/30 transition-all flex items-center justify-center gap-2"
                    >
                      <DollarSign size={16} />
                      Sell Property
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-warning text-xs text-center">
                        Sell for {formatCurrency(ownedProperty.currentValue)}?
                        {associatedLoan && !associatedLoan.isPaid && (
                          <span className="block text-text-dim mt-1">Loan will be paid off automatically.</span>
                        )}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setShowSellConfirm(false)} className="flex-1 btn-secondary text-xs py-2">Cancel</button>
                        <button onClick={handleSell} className="flex-1 btn-danger text-xs py-2">Confirm Sell</button>
                      </div>
                    </div>
                  )}
                </div>
                {actionError && (
                  <p className="text-danger text-xs text-center mt-3">{actionError}</p>
                )}
              </GlassCard>
            ) : (
              <GlassCard accentColor="#00E676" className="sticky top-4">
                <h3 className="section-title text-white mb-4">Purchase</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Price</span>
                    <span className="font-mono text-white text-lg">{formatCompactCurrency(property.price)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">PSF</span>
                    <span className="font-mono text-white">{formatCurrency(property.psf)}</span>
                  </div>

                  <div className="slider-block">
                    <label className="label-text text-text-dim text-xs block mb-2">
                      Down Payment: {effectiveDownPaymentPercent}%
                    </label>
                    <input
                      type="range"
                      min={minDownPaymentPercent}
                      max={100}
                      value={effectiveDownPaymentPercent}
                      onChange={(e) => {
                        setDownPaymentPercent(Number(e.target.value));
                        setActionError(null);
                      }}
                      className="game-slider w-full accent-cyan-glow"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-text-dim mt-1">
                      <span>{minDownPaymentPercent}%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="border-t border-divider pt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-text-secondary text-sm">Down Payment</span>
                      <span className="font-mono text-cyan-glow">{formatCurrency(validation.downPayment)}</span>
                    </div>
                    {validation.mortgageAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary text-sm">Loan Amount</span>
                        <span className="font-mono text-warning">{formatCurrency(validation.mortgageAmount)}</span>
                      </div>
                    )}
                  </div>

                  {cpfEligible && player.cpfOrdinary > 0 && (
                    <div className="border-t border-divider pt-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCpfOrdinary}
                          onChange={(e) => setUseCpfOrdinary(e.target.checked)}
                          className="mt-1 accent-cyan-glow"
                        />
                        <div>
                          <p className="text-white text-sm font-semibold">Use CPF OA toward eligible upfront costs</p>
                          <p className="text-text-secondary text-xs mt-1">
                            Available OA: S${player.cpfOrdinary.toLocaleString()} | Applied now: S${cpfApplied.toLocaleString()}
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  <div className="border-t border-divider pt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-text-secondary text-sm">BSD (Stamp Duty)</span>
                      <span className="font-mono text-text-dim">{formatCurrency(validation.bsd)}</span>
                    </div>
                    {validation.absd > 0 && (
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-text-secondary text-sm">ABSD ({player.properties.length > 0 ? '2nd+' : 'Additional'})</span>
                        <span className="font-mono text-danger">{formatCurrency(validation.absd)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-semibold">Total Upfront</span>
                      <span className="font-mono text-warning">{formatCurrency(validation.totalUpfront)}</span>
                    </div>
                  </div>

                  <div className="border-t border-divider pt-3">
                    {cpfApplied > 0 && (
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-text-secondary text-sm">CPF OA Applied</span>
                        <span className="font-mono text-success">-S${cpfApplied.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-semibold">Cash Required</span>
                      <span className="font-mono text-white">{formatCurrency(cashRequired)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-text-secondary text-sm">Your Cash</span>
                      <span className="font-mono text-white">{formatCurrency(player.cash)}</span>
                    </div>
                  </div>

                  <div className="border-t border-divider pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Monthly Surplus</span>
                      <span className={`font-mono ${monthlySurplus >= 0 ? 'text-success' : 'text-danger'}`}>
                        {monthlySurplus >= 0 ? '+' : ''}{formatCurrency(monthlySurplus)}
                      </span>
                    </div>
                    {grantSupport > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary text-sm">Potential First-Home Support</span>
                        <span className="font-mono text-cyan-glow">{formatCurrency(grantSupport)}</span>
                      </div>
                    )}
                    <div className="rounded-lg border border-glass-border bg-white/5 px-3 py-3">
                      <p className="text-white text-sm font-semibold mb-1">Affordability outlook</p>
                      <p className="text-text-secondary text-xs leading-relaxed">
                        {affordability.monthsAtCurrentPace === null
                          ? 'Current monthly surplus is too tight to project a clean purchase timeline.'
                          : affordability.monthsAtCurrentPace === 0
                            ? 'You already have enough to cover the cash requirement after CPF OA.'
                            : `At your current pace, this cash requirement is about ${affordability.monthsAtCurrentPace} months away.`}
                      </p>
                      <p className="text-text-dim text-[11px] mt-2">
                        Best accelerators: Side Gig, Property Hustle, and Claim / Plan Schemes.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBuy}
                  disabled={!canAfford}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {eligibilityBlocked ? 'Not Eligible Yet' : canAfford ? 'Buy Property' : 'Insufficient Funds'}
                </button>

                {visibleMessages.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {visibleMessages.map((message) => (
                      <p key={message} className="text-danger text-xs text-center">
                        {message}
                      </p>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OperationMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/20 p-2">
      <p className="label-text text-text-dim text-[9px]">{label}</p>
      <p className="font-mono text-white text-xs mt-0.5">{value}</p>
    </div>
  );
}

function getFloorPlanSrc(floorPlanId?: string): string {
  const id = floorPlanId ?? 'floorplan-hdb-4-room';
  return `/floorplans/${id}.svg`;
}

function getTenantPlans({
  isHdb,
  isCommercial,
  mopRemainingMonths,
}: {
  isHdb: boolean;
  isCommercial: boolean;
  mopRemainingMonths: number;
}): Array<{
  label: string;
  description: string;
  mode: RentalMode;
  profileId: TenantProfileId;
  strategy: RentStrategy;
}> {
  if (isCommercial) {
    return [
      {
        label: 'SME Market Lease',
        description: 'Balanced commercial yield with manageable default risk.',
        mode: 'commercial-lease',
        profileId: 'sme-commercial',
        strategy: 'market',
      },
      {
        label: 'Corporate Upside',
        description: 'Push rent harder, but expect more vacancy and fit-out expectations.',
        mode: 'corporate-lease',
        profileId: 'sme-commercial',
        strategy: 'aggressive',
      },
      {
        label: 'Defensive Renewal',
        description: 'Lower rent to protect occupancy through soft business cycles.',
        mode: 'commercial-lease',
        profileId: 'sme-commercial',
        strategy: 'conservative',
      },
    ];
  }

  if (isHdb && mopRemainingMonths > 0) {
    return [
      {
        label: 'Room Rental',
        description: 'MOP-safe income while keeping the flat owner-occupied in simplified rules.',
        mode: 'room-rental',
        profileId: 'local-family',
        strategy: 'market',
      },
      {
        label: 'Conservative Room',
        description: 'Lower rent, better satisfaction, less vacancy pressure.',
        mode: 'room-rental',
        profileId: 'local-family',
        strategy: 'conservative',
      },
      {
        label: 'Student Room',
        description: 'Useful near education nodes. More wear, but keeps early gameplay active.',
        mode: 'room-rental',
        profileId: 'student-tenants',
        strategy: 'market',
      },
    ];
  }

  return [
    {
      label: 'Family Market Lease',
      description: 'Balanced whole-unit lease with stable demand and moderate wear.',
      mode: 'whole-unit',
      profileId: 'local-family',
      strategy: 'market',
    },
    {
      label: 'Expat Premium',
      description: 'Higher rent for better-located or better-finished homes.',
      mode: 'corporate-lease',
      profileId: 'expat-pmet',
      strategy: 'aggressive',
    },
    {
      label: 'Defensive Lease',
      description: 'Trade some rent for occupancy and tenant happiness.',
      mode: 'whole-unit',
      profileId: 'local-family',
      strategy: 'conservative',
    },
  ];
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-white/5">
      <Icon size={18} className="text-cyan-glow mx-auto mb-1" />
      <p className="label-text text-text-dim text-[10px] mb-0.5">{label}</p>
      <p className="font-mono text-white text-sm">{value}</p>
    </div>
  );
}
