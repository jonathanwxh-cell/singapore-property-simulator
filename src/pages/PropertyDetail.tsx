import { useParams, useNavigate } from 'react-router-dom';
import { propertyTypeInfo } from '@/data/properties';
import { districts } from '@/data/districts';
import { useGameStore } from '@/game/useGameStore';
import GlassCard from '@/components/GlassCard';
import { ArrowLeft, MapPin, Bed, Bath, Maximize, Calendar, Train, ShoppingBag, Home, DollarSign, CheckCircle } from 'lucide-react';
import PropertyImage from '@/components/PropertyImage';
import GlossaryTerm from '@/components/GlossaryTerm';
import { useState } from 'react';
import { formatCompactCurrency, formatCurrency, formatPercent } from '@/lib/format';
import { listingRarityInfo } from '@/data/listingChannels';
import { getDownPaymentAmount, validatePurchase } from '@/engine/purchase';
import { getListingCatalog } from '@/engine/listings';
import { selectAffordabilityReport, selectAvailableCash, selectMonthlyNetCashflow, selectPotentialHousingGrant, selectReservedCash } from '@/engine/selectors';
import { TAKE_HOME_RATIO } from '@/engine/constants';
import { getLtvCap } from '@/engine/ltv';
import EligibilityBadge from '@/components/EligibilityBadge';
import { deriveEligibilityFlags, evaluatePropertyEligibility } from '@/engine/eligibility';
import { assessDealReadiness } from '@/engine/decisionCoach';
import { getRenovationTemplatesForType } from '@/data/renovations';
import { repairChoices, type RepairChoiceId } from '@/data/maintenanceEvents';
import { getTenantLeaseOptions } from '@/engine/propertyOperations';
import RuleGlossaryPanel from '@/components/RuleGlossaryPanel';
import type { RentalMode, RentStrategy, TenantLeaseDecisionId, TenantProfileId } from '@/game/types';
import {
  DetailItem,
  LeaseOptionButton,
  OperationMetric,
} from './property/PropertyDetailComponents';
import {
  formatOwnershipStatus,
  formatRentalMode,
  getFloorPlanSrc,
  getTenantPlans,
} from './property/propertyDetailFormatters';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { player, buyProperty, sellProperty, toggleRental, startRenovation, setTenantStrategy, applyTenantLeaseDecision, resolveMaintenanceIssue, setReservePlan } = useGameStore();
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
  const dealReadiness = assessDealReadiness({
    player,
    property,
    downPaymentPercent: effectiveDownPaymentPercent,
    useCpfOrdinary,
  });
  const cpfEligible = !property.type.startsWith('Commercial');
  const cpfApplied = dealReadiness.cpfApplied;
  const cashRequired = dealReadiness.cashRequired;
  const monthlySurplus = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  const availableCash = selectAvailableCash(player);
  const reservedCash = selectReservedCash(player);
  const grantSupport = property.isHdb ? selectPotentialHousingGrant(player) : 0;
  const affordability = selectAffordabilityReport(player, cashRequired, monthlySurplus, grantSupport);
  const extraReasons = validation.reasons.filter((reason) => reason.code !== 'insufficient_cash');
  const eligibilityFlags = deriveEligibilityFlags({
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
    buyerProfile: player.buyerProfile,
  });
  const eligibility = evaluatePropertyEligibility({
    propertyType: property.type,
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
    buyerProfile: player.buyerProfile,
  });
  const eligibilityBlocked = Boolean(eligibility.blockedReason);
  const cashShortfall = Math.max(0, cashRequired - player.cash);
  const canAfford = dealReadiness.verdict !== 'blocked' && cashShortfall === 0 && extraReasons.length === 0 && !isOwned && !eligibilityBlocked;
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

  const handleLeaseDecision = (decisionId: TenantLeaseDecisionId) => {
    if (!isOwned) return;
    const result = applyTenantLeaseDecision(ownedIndex, decisionId);
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
  const leaseOptions = ownedProperty ? getTenantLeaseOptions(ownedProperty, player.turnCount) : [];
  const leaseDecisionMadeThisTurn = ownedProperty?.tenant?.lastLeaseDecisionTurn === player.turnCount;
  const propertyRepairExposure = ownedProperty?.openMaintenanceIssues?.reduce((sum, issue) => sum + issue.estimatedCost, 0) ?? 0;
  const propertyUnprotectedRisk = Math.max(0, propertyRepairExposure - reservedCash);
  const floorPlanSrc = getFloorPlanSrc(ownedProperty?.floorPlanId);
  const quickRentalBlockedByMop = Boolean(
    ownedProperty
      && property.isHdb
      && !ownedProperty.isRented
      && (ownedProperty.mopRemainingMonths ?? 0) > 0
  );

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space px-4 pb-8 game-screen">
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
                  {ownedProperty.tenant?.rentalMode === 'room-rental' ? 'Room Rented' : 'Rented Out'}
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

        {isOwned && ownedProperty && (
          <GlassCard accentColor="#00E676" className="mb-6">
            <div className="grid gap-4 lg:grid-cols-[1fr,auto] lg:items-center">
              <div>
                <p className="label-text mb-1 text-[10px] text-success">First Owner Checklist</p>
                <h2 className="section-title text-white">Make this property do something this month</h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  The first owned month should not feel like a spreadsheet. Pick one clear ownership action: room-rent safely during MOP, protect a reserve, or go back to the command center.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[34rem]">
                {property.isHdb && (ownedProperty.mopRemainingMonths ?? 0) > 0 && !ownedProperty.tenant && (
                  <button
                    type="button"
                    onClick={() => handleTenantPlan('room-rental', 'local-family', 'market')}
                    className="btn-primary py-3 text-sm"
                  >
                    Start MOP-Safe Room Rental
                  </button>
                )}
                <button type="button" onClick={handleReserveTopUp} className="btn-secondary py-3 text-sm">
                  Protect S$5K Reserve
                </button>
                <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary py-3 text-sm">
                  Back to Monthly Plan
                </button>
              </div>
            </div>
          </GlassCard>
        )}

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

            <RuleGlossaryPanel
              title="Rule Cheatsheet"
              termIds={property.isHdb
                ? ['hfe', 'mop', 'hdb-room-rental', 'cpf-oa', 'msr', 'tdsr', 'cov', 'cpf-refund']
                : property.type.startsWith('Commercial')
                  ? ['commercial-bsd', 'sora', 'reserve-cash', 'tdsr']
                  : ['absd', 'bsd', 'cpf-oa', 'tdsr', 'sora', 'reserve-cash']}
              compact
            />

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
                    <button onClick={handleReserveTopUp} className="btn-secondary text-xs py-2 w-full mt-4">
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
                        <p className="text-success font-semibold text-sm">
                          Active {formatRentalMode(ownedProperty.tenant.rentalMode)}: S${ownedProperty.tenant.contractedRent.toLocaleString()}/mo
                        </p>
                        <p className="text-text-secondary text-xs mt-1">
                          Satisfaction {ownedProperty.tenant.satisfaction}/100 | Renewal intent {ownedProperty.tenant.renewalIntent}/100 | Strategy {ownedProperty.tenant.rentStrategy}
                        </p>
                        <p className="text-text-dim text-[11px] mt-1">
                          Lease ends in {Math.max(0, ownedProperty.tenant.leaseEndTurn - player.turnCount)} month(s). Decide whether to preserve occupancy, push rent, or reset to market.
                        </p>
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
                            <LeaseOptionButton key={option.id} option={option} onSelect={handleLeaseDecision} />
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
              <GlassCard accentColor="#00E676" className="lg:sticky lg:top-4 lg:max-h-[36rem] lg:overflow-y-auto">
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
                        {formatOwnershipStatus(ownedProperty)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-text-secondary text-sm">Condition</span>
                      <span className="font-mono text-white">{ownedProperty.conditionScore ?? 70}/100</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-text-secondary text-sm"><GlossaryTerm termId="mop">MOP</GlossaryTerm> Remaining</span>
                      <span className="font-mono text-white">{ownedProperty.mopRemainingMonths ?? 0} mo</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {quickRentalBlockedByMop && !ownedProperty.tenant && (
                    <button
                      type="button"
                      onClick={() => handleTenantPlan('room-rental', 'local-family', 'market')}
                      className="w-full rounded-lg border border-success/40 bg-success/20 py-3 text-sm font-semibold uppercase tracking-wider text-success transition-all hover:bg-success/30"
                    >
                      Start MOP-Safe Room Rental
                    </button>
                  )}
                  <button
                    onClick={handleToggleRental}
                    disabled={quickRentalBlockedByMop}
                    className={`w-full py-3 rounded-lg font-rajdhani font-semibold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                      quickRentalBlockedByMop
                        ? 'bg-white/5 text-text-dim border border-glass-border cursor-not-allowed'
                        : ownedProperty.isRented
                        ? 'bg-warning/20 text-warning border border-warning/40 hover:bg-warning/30'
                        : 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/30'
                    }`}
                  >
                    <Home size={16} />
                    {quickRentalBlockedByMop ? 'Whole-Flat Rental Locked' : ownedProperty.tenant?.rentalMode === 'room-rental' ? 'End Room Lease' : ownedProperty.isRented ? 'Stop Renting' : 'Rent Out'}
                  </button>
                  {quickRentalBlockedByMop && (
                    <p className="text-text-dim text-xs text-center">
                      MOP still requires owner occupation. Use a room-rental tenant strategy above instead of the whole-flat shortcut.
                    </p>
                  )}

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
              <GlassCard accentColor="#00E676" className="lg:sticky lg:top-4 lg:max-h-[34rem] lg:overflow-y-auto">
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
                      <span className="text-text-secondary text-sm"><GlossaryTerm termId="bsd">BSD</GlossaryTerm> Stamp Duty</span>
                      <span className="font-mono text-text-dim">{formatCurrency(validation.bsd)}</span>
                    </div>
                    {validation.absd > 0 && (
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-text-secondary text-sm"><GlossaryTerm termId="absd">ABSD</GlossaryTerm> ({player.properties.length > 0 ? '2nd+' : 'Additional'})</span>
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
                        <span className="text-text-secondary text-sm"><GlossaryTerm termId="cpf-oa">CPF OA</GlossaryTerm> Applied</span>
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
                    {reservedCash > 0 && (
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-text-secondary text-sm">Available After Reserve</span>
                        <span className="font-mono text-cyan-glow">{formatCurrency(availableCash)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-divider pt-3 space-y-2">
                    <div className={`rounded-lg border px-3 py-3 ${
                      dealReadiness.verdict === 'ready'
                        ? 'border-success/30 bg-success/10'
                        : dealReadiness.verdict === 'stretch'
                          ? 'border-warning/30 bg-warning/10'
                          : 'border-danger/30 bg-danger/10'
                    }`}>
                      <p className={`text-sm font-semibold ${
                        dealReadiness.verdict === 'ready'
                          ? 'text-success'
                          : dealReadiness.verdict === 'stretch'
                            ? 'text-warning'
                            : 'text-danger'
                      }`}>
                        {dealReadiness.verdict === 'ready' ? 'Deal ready' : dealReadiness.verdict === 'stretch' ? 'Deal is tight' : 'Deal blocked'}
                      </p>
                      <p className="text-text-secondary text-xs mt-1 leading-relaxed">{dealReadiness.headline}</p>
                      <div className="grid gap-1 mt-3">
                        {dealReadiness.facts.slice(0, 3).map((fact) => (
                          <p key={fact} className="text-text-dim text-[11px]">{fact}</p>
                        ))}
                      </div>
                      {dealReadiness.warnings.map((warning) => (
                        <p key={warning} className="text-warning text-[11px] mt-2 leading-relaxed">{warning}</p>
                      ))}
                    </div>
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

                <div className="mt-4 rounded-card border border-divider bg-glass-fill/95 p-4 backdrop-blur-xl lg:sticky lg:bottom-0 lg:-mx-4 lg:-mb-4 lg:rounded-b-card lg:border-x-0 lg:border-b-0">
                  <button
                    onClick={handleBuy}
                    disabled={!canAfford}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {dealReadiness.ctaLabel}
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
                </div>
              </GlassCard>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

