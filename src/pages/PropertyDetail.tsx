import { useParams, useNavigate } from 'react-router-dom';
import { propertyTypeInfo } from '@/data/properties';
import { districts } from '@/data/districts';
import { useGameStore } from '@/game/useGameStore';
import GlassCard from '@/components/GlassCard';
import { ArrowLeft } from 'lucide-react';
import { useRef, useState } from 'react';
import { formatCurrency } from '@/lib/format';
import { listingRarityInfo } from '@/data/listingChannels';
import { getListingCatalog } from '@/engine/listings';
import type { RepairChoiceId } from '@/data/maintenanceEvents';
import RuleGlossaryPanel from '@/components/RuleGlossaryPanel';
import type { MortgageFinancingMode, RentalMode, RenovationContractorTier, RentStrategy, TenantLeaseDecisionId, TenantProfileId } from '@/game/types';
import { HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT } from '@/engine/constants';
import {
  QuickPurchasePanel, FirstOwnerChecklist, EligibilitySection,
  PropertyImageHeader, PropertyDetailsCard, AmenitiesCard,
  InvestmentAngleCard, MarketAnalysisCard,
} from './property/PropertyDetailPanels';
import { usePurchaseReadiness } from './property/usePurchaseReadiness';
import { useOwnedPropertyState } from './property/useOwnedPropertyState';

import PropertyOperations from '@/components/PropertyDetail/PropertyOperations';
import PropertySummary from '@/components/PropertyDetail/PropertySummary';
import PurchasePanel from '@/components/PropertyDetail/PurchasePanel';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { player, buyProperty, sellProperty, toggleRental, startRenovation, setTenantStrategy, applyTenantLeaseDecision, resolveMaintenanceIssue, setReservePlan } = useGameStore();
  const [downPaymentPercent, setDownPaymentPercent] = useState(HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT);
  const [financingMode, setFinancingMode] = useState<MortgageFinancingMode>('hdb-concessionary');
  const [renovationContractorTier, setRenovationContractorTier] = useState<RenovationContractorTier>('standard');
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

  const readiness = usePurchaseReadiness(player, property, financingMode, downPaymentPercent, useCpfOrdinary, isOwned, actionError);
  const ownedState = useOwnedPropertyState(player, property ?? {} as ReturnType<typeof getListingCatalog>[number], ownedProperty);

  if (!property || !district) {
    return (
      <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4 flex items-center justify-center">
        <GlassCard>
          <h2 className="section-title text-white">Property Not Found</h2>
          <p className="text-text-secondary mt-2">The property you are looking for does not exist.</p>
          <button onClick={() => navigate('/properties')} className="btn-primary mt-4">Back to Properties</button>
        </GlassCard>
      </div>
    );
  }

  const typeInfo = propertyTypeInfo[property.type];
  const rarityInfo = listingRarityInfo[property.listingRarity];
  const {
    activeHousingLoans, effectiveFinancingMode, minDownPaymentPercent, effectiveDownPaymentPercent,
    validation, dealReadiness, dealNextFix, monthlySurplus, grantSupport, affordability, eligibility,
    eligibilityFlags, practicePlan, btoReadinessPlan, seniorRightsizingPlan,
    cpfEligible, cpfApplied, cashRequired, availableCash, reservedCash,
    eligibilityBlocked, cashShortfall, canAfford, visibleMessages,
  } = readiness!;

  const {
    gain, gainPercent, renovationOptions, tenantPlans, leaseOptions,
    leaseDecisionMadeThisTurn, propertyRepairExposure, propertyUnprotectedRisk,
    floorPlanSrc, quickRentalBlockedByMop,
  } = ownedState;

  const handleBuy = () => {
    if (isOwned) return;
    setActionError(null);
    if (eligibilityBlocked) { setActionError(eligibility.blockedReason); return; }
    if (dealReadiness.warnings.length > 0) { setActionError(dealReadiness.warnings[0]); return; }
    if (cashShortfall > 0) { setActionError(`You need ${formatCurrency(cashShortfall)} more cash after CPF OA.`); return; }
    const result = buyProperty(property.id, validation.downPayment, cpfApplied, effectiveFinancingMode);
    if (result.ok) { setActionError(null); navigate('/portfolio'); return; }
    setActionError(result.message);
  };

  const handleSell = () => {
    if (!isOwned) return;
    const result = sellProperty(ownedIndex);
    if (result.ok) { setActionError(null); navigate('/portfolio'); return; }
    setActionError(result.message);
  };

  const handleToggleRental = () => { if (!isOwned) return; toggleRental(ownedIndex); };

  const handleStartRenovation = (templateId: string) => {
    if (!isOwned) return;
    const result = startRenovation(ownedIndex, templateId, renovationContractorTier);
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
    const result = setReservePlan({
      targetMonths: player.reserve?.targetMonths ?? 3,
      allocatedCash: Math.min(player.cash, current + 5_000),
      autoTopUpPct: player.reserve?.autoTopUpPct ?? 0,
    });
    setActionError(result.ok ? null : result.message);
  };

  const handleReviewPurchase = () => {
    purchasePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const quickPanelProps = {
    propertyName: property.name, readiness: dealReadiness.verdict, summary: practicePlan.summary,
    projectedMonthlySurplus: practicePlan.projectedMonthlySurplusAfterPurchase,
    cashRequired, canAfford, onReview: handleReviewPurchase, onBuy: handleBuy,
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space px-4 pb-8 game-screen">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-secondary hover:text-cyan-glow transition-colors mb-4">
          <ArrowLeft size={18} />
          <span className="font-rajdhani text-sm uppercase">Back</span>
        </button>

        {!isOwned && <div className="md:hidden"><QuickPurchasePanel {...quickPanelProps} compact className="mb-4" /></div>}

        <PropertyImageHeader
          property={property} district={district} typeColor={typeInfo.color}
          isOwned={isOwned} ownedProperty={ownedProperty}
          eligibilityFlags={eligibilityFlags} eligibility={eligibility}
        />

        {!isOwned && <div className="hidden md:block"><QuickPurchasePanel {...quickPanelProps} /></div>}

        {isOwned && ownedProperty && (
          <FirstOwnerChecklist
            isHdb={property.isHdb} ownedProperty={ownedProperty}
            onTenantPlan={handleTenantPlan} onReserveTopUp={handleReserveTopUp} onNavigate={navigate}
          />
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <PropertyDetailsCard property={property} />
            <AmenitiesCard property={property} district={district} />
            <InvestmentAngleCard property={property} rarityAccent={rarityInfo.accent} rarityLabel={rarityInfo.label} />
            <EligibilitySection
              property={property} player={player} eligibilityFlags={eligibilityFlags}
              eligibility={eligibility} eligibilityBlocked={eligibilityBlocked} isOwned={isOwned}
            />
            <RuleGlossaryPanel
              title="Rule Cheatsheet"
              termIds={property.isHdb
                ? ['hfe', 'hdb-loan', 'hdb-resale-levy', 'mop', 'hdb-room-rental', 'cpf-oa', 'msr', 'tdsr', 'cov', 'cpf-refund']
                : property.type.startsWith('Commercial')
                  ? ['commercial-bsd', 'sora', 'reserve-cash', 'tdsr']
                  : ['absd', 'bsd', 'cpf-oa', 'tdsr', 'sora', 'reserve-cash']}
              compact
            />
            <MarketAnalysisCard property={property} district={district} />
            {isOwned && ownedProperty && (
              <PropertyOperations
                ownedProperty={ownedProperty} property={property} player={player}
                reservedCash={reservedCash} availableCash={availableCash}
                propertyRepairExposure={propertyRepairExposure} propertyUnprotectedRisk={propertyUnprotectedRisk}
                floorPlanSrc={floorPlanSrc} renovationOptions={renovationOptions}
                renovationContractorTier={renovationContractorTier}
                tenantPlans={tenantPlans} leaseOptions={leaseOptions}
                leaseDecisionMadeThisTurn={leaseDecisionMadeThisTurn} actionError={actionError}
                onSelectRenovationContractor={setRenovationContractorTier}
                onStartRenovation={handleStartRenovation} onTenantPlan={handleTenantPlan}
                onLeaseDecision={handleLeaseDecision} onRepair={handleRepair} onReserveTopUp={handleReserveTopUp}
              />
            )}
          </div>

          <div>
            {isOwned && ownedProperty ? (
              <PropertySummary
                ownedProperty={ownedProperty} associatedLoan={associatedLoan}
                gain={gain} gainPercent={gainPercent} quickRentalBlockedByMop={quickRentalBlockedByMop}
                actionError={actionError} showSellConfirm={showSellConfirm}
                onShowSellConfirm={setShowSellConfirm} onToggleRental={handleToggleRental}
                onTenantPlan={handleTenantPlan} onSell={handleSell}
              />
            ) : (
              <PurchasePanel
                property={property} player={player}
                effectiveFinancingMode={effectiveFinancingMode}
                effectiveDownPaymentPercent={effectiveDownPaymentPercent}
                minDownPaymentPercent={minDownPaymentPercent}
                downPaymentPercent={downPaymentPercent}
                activeHousingLoans={activeHousingLoans}
                useCpfOrdinary={useCpfOrdinary} cpfEligible={cpfEligible} cpfApplied={cpfApplied}
                cashRequired={cashRequired} monthlySurplus={monthlySurplus}
                availableCash={availableCash} reservedCash={reservedCash}
                grantSupport={grantSupport} affordability={affordability}
                validation={validation} dealReadiness={dealReadiness} dealNextFix={dealNextFix}
                practicePlan={practicePlan} btoReadinessPlan={btoReadinessPlan}
                seniorRightsizingPlan={seniorRightsizingPlan}
                canAfford={canAfford} visibleMessages={visibleMessages}
                purchasePanelRef={purchasePanelRef} onBuy={handleBuy}
                onSetFinancingMode={setFinancingMode} onSetDownPaymentPercent={setDownPaymentPercent}
                onSetUseCpfOrdinary={setUseCpfOrdinary} onSetActionError={setActionError}
                onNavigate={navigate}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
