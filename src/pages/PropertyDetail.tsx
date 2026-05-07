import { useParams, useNavigate } from 'react-router-dom';
import { propertyTypeInfo } from '@/data/properties';
import { districts } from '@/data/districts';
import { useGameStore } from '@/game/useGameStore';
import GlassCard from '@/components/GlassCard';
import { ArrowLeft, MapPin, Bed, Bath, Maximize, Calendar, Train, ShoppingBag, CheckCircle } from 'lucide-react';
import PropertyImage from '@/components/PropertyImage';
import { useMemo, useRef, useState } from 'react';
import { formatCurrency, formatPercent } from '@/lib/format';
import { listingRarityInfo } from '@/data/listingChannels';
import { getDownPaymentAmount, validatePurchase } from '@/engine/purchase';
import { getListingCatalog } from '@/engine/listings';
import { selectAffordabilityReport, selectAvailableCash, selectMonthlyNetCashflow, selectPotentialHousingGrant, selectReservedCash } from '@/engine/selectors';
import { HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT, TAKE_HOME_RATIO } from '@/engine/constants';
import { getLtvCap } from '@/engine/ltv';
import EligibilityBadge from '@/components/EligibilityBadge';
import { deriveEligibilityFlags, evaluatePropertyEligibility } from '@/engine/eligibility';
import { assessDealReadiness, getDealNextFix } from '@/engine/decisionCoach';
import {
  buildBtoReadinessPlan,
  buildPracticePurchasePlan,
  buildSeniorRightsizingPlan,
} from '@/engine/practicePurchase';
import { getRenovationTemplatesForType } from '@/data/renovations';
import type { RepairChoiceId } from '@/data/maintenanceEvents';
import { getTenantLeaseOptions } from '@/engine/propertyOperations';
import RuleGlossaryPanel from '@/components/RuleGlossaryPanel';
import type { MortgageFinancingMode, RentalMode, RentStrategy, TenantLeaseDecisionId, TenantProfileId } from '@/game/types';
import { DetailItem } from './property/PropertyDetailComponents';
import { getFloorPlanSrc, getTenantPlans } from './property/propertyDetailFormatters';

import PropertyOperations from '@/components/PropertyDetail/PropertyOperations';
import PropertySummary from '@/components/PropertyDetail/PropertySummary';
import PurchasePanel from '@/components/PropertyDetail/PurchasePanel';

function PracticeMetric({ label, value, tone }: { label: string; value: string; tone: 'good' | 'bad' | 'neutral' }) {
  return (
    <div className="rounded-lg border border-glass-border bg-black/20 p-2">
      <p className="label-text text-[8px] text-text-dim">{label}</p>
      <p className={`mt-1 font-mono text-[11px] ${tone === 'good' ? 'text-success' : tone === 'bad' ? 'text-danger' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}

function QuickPurchasePanel({
  propertyName, readiness, summary, projectedMonthlySurplus, cashRequired,
  canAfford, onReview, onBuy, compact = false, className = 'mb-6',
}: {
  propertyName: string; readiness: 'ready' | 'stretch' | 'blocked'; summary: string;
  projectedMonthlySurplus: number; cashRequired: number; canAfford: boolean;
  onReview: () => void; onBuy: () => void; compact?: boolean; className?: string;
}) {
  return (
    <GlassCard
      accentColor={readiness === 'ready' ? '#00E676' : readiness === 'stretch' ? '#FFD740' : '#FF1744'}
      className={className}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr,auto] lg:items-center">
        <div>
          <p className="label-text mb-1 text-[10px] text-cyan-glow">Purchase snapshot</p>
          <h2 className="section-title text-white">
            {compact ? `Can you buy ${propertyName}?` : `Review ${propertyName} before the long scroll`}
          </h2>
          {!compact && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">{summary}</p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-md">
            <PracticeMetric label="Cash required" value={formatCurrency(cashRequired)} tone={readiness === 'blocked' ? 'bad' : 'neutral'} />
            <PracticeMetric label="After-debt surplus" value={formatCurrency(projectedMonthlySurplus)} tone={projectedMonthlySurplus >= 0 ? 'good' : 'bad'} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[22rem] lg:grid-cols-1">
          <button type="button" onClick={onReview} className="btn-secondary min-h-11 px-4 py-3 text-sm">
            Practice / review purchase
          </button>
          <button
            type="button"
            onClick={onBuy}
            disabled={!canAfford}
            className="btn-primary min-h-11 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {canAfford ? 'Buy Property' : readiness === 'blocked' ? 'Fix blocker first' : 'Build cash first'}
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { player, buyProperty, sellProperty, toggleRental, startRenovation, setTenantStrategy, applyTenantLeaseDecision, resolveMaintenanceIssue, setReservePlan } = useGameStore();
  const [downPaymentPercent, setDownPaymentPercent] = useState(HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT);
  const [financingMode, setFinancingMode] = useState<MortgageFinancingMode>('hdb-concessionary');
  const [showSellConfirm, setShowSellConfirm] = useState(false);
  const [useCpfOrdinary, setUseCpfOrdinary] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const purchasePanelRef = useRef<HTMLDivElement>(null);

  const property = getListingCatalog().find(p => p.id === id);
  const district = property ? districts.find(d => d.id === property.districtId) : null;

  const ownedIndex = property ? player.properties.findIndex(op => op.propertyId === property.id) : -1;
  const isOwned = ownedIndex >= 0;
  const ownedProperty = isOwned ? player.properties[ownedIndex] : null;
  const associatedLoan = ownedProperty?.loanId ? player.loans.find(l => l.id === ownedProperty.loanId) : null;

  const eligibilityFlags = useMemo(() => deriveEligibilityFlags({
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
    buyerProfile: player.buyerProfile,
  }), [player.salary, player.properties, player.firstHomePurchased, player.ownedPrivateHome, player.buyerProfile]);

  const seniorRightsizingPlan = useMemo(() => buildSeniorRightsizingPlan(player), [player]);

  const purchaseComputations = useMemo(() => {
    if (!property) return null;
    const activeHousingLoans = player.loans.filter(l => l.type === 'mortgage' && !l.isPaid).length;
    const effectiveFinancingMode: MortgageFinancingMode = property.isHdb ? financingMode : 'bank';
    const minDpPct = effectiveFinancingMode === 'hdb-concessionary'
      ? HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT
      : Math.round((1 - getLtvCap(activeHousingLoans)) * 100);
    const effectiveDpPct = Math.max(downPaymentPercent, minDpPct);
    const downPayment = getDownPaymentAmount(property.price, effectiveDpPct);
    const validation = validatePurchase(player, property, downPayment, effectiveFinancingMode);
    const dealReadiness = assessDealReadiness({ player, property, downPaymentPercent: effectiveDpPct, useCpfOrdinary, financingMode: effectiveFinancingMode });
    const dealNextFix = getDealNextFix(dealReadiness);
    const monthlySurplus = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
    const grantSupport = property.isHdb ? selectPotentialHousingGrant(player) : 0;
    const affordability = selectAffordabilityReport(player, dealReadiness.cashRequired, monthlySurplus, grantSupport);
    const eligibility = evaluatePropertyEligibility({ propertyType: property.type, salary: player.salary, properties: player.properties, firstHomePurchased: player.firstHomePurchased, ownedPrivateHome: player.ownedPrivateHome, buyerProfile: player.buyerProfile });
    const practicePlan = buildPracticePurchasePlan({ player, property, readiness: dealReadiness });
    const btoReadinessPlan = buildBtoReadinessPlan(player, property);
    return { activeHousingLoans, effectiveFinancingMode, minDownPaymentPercent: minDpPct, effectiveDownPaymentPercent: effectiveDpPct, downPayment, validation, dealReadiness, dealNextFix, monthlySurplus, affordability, eligibility, practicePlan, btoReadinessPlan };
  }, [player, property, financingMode, downPaymentPercent, useCpfOrdinary]);

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
  const {
    activeHousingLoans, effectiveFinancingMode, minDownPaymentPercent, effectiveDownPaymentPercent,
    validation, dealReadiness, dealNextFix, monthlySurplus, affordability, eligibility,
    practicePlan, btoReadinessPlan,
  } = purchaseComputations!;
  const cpfEligible = !property.type.startsWith('Commercial');
  const cpfApplied = dealReadiness.cpfApplied;
  const cashRequired = dealReadiness.cashRequired;
  const availableCash = selectAvailableCash(player);
  const reservedCash = selectReservedCash(player);
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
    const result = buyProperty(property.id, validation.downPayment, cpfApplied, effectiveFinancingMode);
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
  const handleReviewPurchase = () => {
    purchasePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

        {!isOwned && (
          <div className="md:hidden">
            <QuickPurchasePanel
              propertyName={property.name}
              readiness={dealReadiness.verdict}
              summary={practicePlan.summary}
              projectedMonthlySurplus={practicePlan.projectedMonthlySurplusAfterPurchase}
              cashRequired={cashRequired}
              canAfford={canAfford}
              onReview={handleReviewPurchase}
              onBuy={handleBuy}
              compact
              className="mb-4"
            />
          </div>
        )}

        <div className="relative mb-4 h-52 overflow-hidden rounded-xl md:mb-6 md:h-80">
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

        {!isOwned && (
          <div className="hidden md:block">
            <QuickPurchasePanel
              propertyName={property.name}
              readiness={dealReadiness.verdict}
              summary={practicePlan.summary}
              projectedMonthlySurplus={practicePlan.projectedMonthlySurplusAfterPurchase}
              cashRequired={cashRequired}
              canAfford={canAfford}
              onReview={handleReviewPurchase}
              onBuy={handleBuy}
            />
          </div>
        )}

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
                {!isOwned && eligibility.blockedAdvice.length > 0 && (
                  <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2">
                    <p className="label-text text-[10px] text-danger">Why it is blocked</p>
                    <div className="mt-2 space-y-1">
                      {eligibility.blockedAdvice.map((advice) => (
                        <p key={advice} className="text-text-secondary text-xs leading-relaxed">• {advice}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            <RuleGlossaryPanel
              title="Rule Cheatsheet"
              termIds={property.isHdb
                ? ['hfe', 'hdb-loan', 'hdb-resale-levy', 'mop', 'hdb-room-rental', 'cpf-oa', 'msr', 'tdsr', 'cov', 'cpf-refund']
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
              <PropertyOperations
                ownedProperty={ownedProperty}
                property={property}
                player={player}
                reservedCash={reservedCash}
                availableCash={availableCash}
                propertyRepairExposure={propertyRepairExposure}
                propertyUnprotectedRisk={propertyUnprotectedRisk}
                floorPlanSrc={floorPlanSrc}
                renovationOptions={renovationOptions}
                tenantPlans={tenantPlans}
                leaseOptions={leaseOptions}
                leaseDecisionMadeThisTurn={leaseDecisionMadeThisTurn}
                actionError={actionError}
                onStartRenovation={handleStartRenovation}
                onTenantPlan={handleTenantPlan}
                onLeaseDecision={handleLeaseDecision}
                onRepair={handleRepair}
                onReserveTopUp={handleReserveTopUp}
              />
            )}
          </div>

          <div>
            {isOwned && ownedProperty ? (
              <PropertySummary
                ownedProperty={ownedProperty}
                property={property}
                player={player}
                associatedLoan={associatedLoan}
                gain={gain}
                gainPercent={gainPercent}
                quickRentalBlockedByMop={quickRentalBlockedByMop}
                actionError={actionError}
                showSellConfirm={showSellConfirm}
                onShowSellConfirm={setShowSellConfirm}
                onToggleRental={handleToggleRental}
                onTenantPlan={handleTenantPlan}
                onSell={handleSell}
              />
            ) : (
              <PurchasePanel
                property={property}
                player={player}
                effectiveFinancingMode={effectiveFinancingMode}
                effectiveDownPaymentPercent={effectiveDownPaymentPercent}
                minDownPaymentPercent={minDownPaymentPercent}
                downPaymentPercent={downPaymentPercent}
                activeHousingLoans={activeHousingLoans}
                useCpfOrdinary={useCpfOrdinary}
                cpfEligible={cpfEligible}
                cpfApplied={cpfApplied}
                cashRequired={cashRequired}
                monthlySurplus={monthlySurplus}
                availableCash={availableCash}
                reservedCash={reservedCash}
                grantSupport={grantSupport}
                affordability={affordability}
                validation={validation}
                dealReadiness={dealReadiness}
                dealNextFix={dealNextFix}
                practicePlan={practicePlan}
                btoReadinessPlan={btoReadinessPlan}
                seniorRightsizingPlan={seniorRightsizingPlan}
                eligibilityBlocked={eligibilityBlocked}
                cashShortfall={cashShortfall}
                canAfford={canAfford}
                visibleMessages={visibleMessages}
                purchasePanelRef={purchasePanelRef}
                onBuy={handleBuy}
                onSetFinancingMode={setFinancingMode}
                onSetDownPaymentPercent={setDownPaymentPercent}
                onSetUseCpfOrdinary={setUseCpfOrdinary}
                onSetActionError={setActionError}
                onNavigate={navigate}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

