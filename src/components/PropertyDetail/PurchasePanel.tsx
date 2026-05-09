import type React from 'react';
import GlassCard from '@/components/GlassCard';
import GlossaryTerm from '@/components/GlossaryTerm';
import { formatCompactCurrency, formatCurrency, formatPercent } from '@/lib/format';
import { HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT } from '@/engine/constants';
import { getLtvCap } from '@/engine/ltv';
import type { MortgageFinancingMode, Player } from '@/game/types';
import type { ListingProperty } from '@/engine/listings';
import type { PurchaseValidation } from '@/engine/purchase';
import type { DealReadiness } from '@/engine/decisionCoach';
import type { AffordabilityReport } from '@/engine/selectors';
import type { PracticePurchasePlan, BtoReadinessPlan, SeniorRightsizingPlan } from '@/engine/practicePurchase';

function formatTaxReliefMessage(validation: PurchaseValidation) {
  if (!validation.pendingTaxRelief) return null;

  if (validation.pendingTaxRelief.type === 'absd-single-senior-refund') {
    return `Pay ABSD now. This simplified 55+ rightsizing run can reclaim ${formatCurrency(validation.pendingTaxRelief.expectedRefundAmount)} if the bigger home is sold within 6 months.`;
  }

  return `Pay ABSD now. This married second-home run can reclaim ${formatCurrency(validation.pendingTaxRelief.expectedRefundAmount)} if the first home is sold within 6 months.`;
}

function PracticeMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'good' | 'bad' | 'neutral';
}) {
  return (
    <div className="rounded-lg border border-glass-border bg-black/20 p-2">
      <p className="label-text text-[8px] text-text-dim">{label}</p>
      <p className={`mt-1 font-mono text-[11px] ${
        tone === 'good'
          ? 'text-success'
          : tone === 'bad'
            ? 'text-danger'
            : 'text-white'
      }`}>
        {value}
      </p>
    </div>
  );
}

function PracticePurchasePanelBlock({ plan }: { plan: PracticePurchasePlan }) {
  return (
    <div className={`rounded-lg border px-3 py-3 ${
      plan.riskLevel === 'safe'
        ? 'border-success/25 bg-success/10'
        : plan.riskLevel === 'stretch'
          ? 'border-warning/25 bg-warning/10'
          : 'border-danger/25 bg-danger/10'
    }`}>
      <p className="text-white text-sm font-semibold mb-1">{plan.title}</p>
      <p className="text-xs leading-relaxed text-text-secondary">{plan.summary}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <PracticeMetric label="Cash after buy" value={formatCurrency(plan.projectedCashAfterUpfront)} tone={plan.projectedCashAfterUpfront >= 0 ? 'good' : 'bad'} />
        <PracticeMetric label="Avail. after reserve" value={formatCurrency(plan.projectedAvailableCashAfterReserve)} tone={plan.projectedAvailableCashAfterReserve >= 0 ? 'good' : 'bad'} />
        <PracticeMetric label="Monthly after debt" value={formatCurrency(plan.projectedMonthlySurplusAfterPurchase)} tone={plan.projectedMonthlySurplusAfterPurchase >= 0 ? 'good' : 'bad'} />
        <PracticeMetric label="CPF used" value={formatCurrency(plan.cpfApplied)} tone="neutral" />
      </div>
      <div className="mt-3 space-y-1">
        {plan.nextSteps.map((step) => (
          <p key={step} className="text-[11px] leading-relaxed text-text-dim">{step}</p>
        ))}
      </div>
      {plan.warnings.length > 0 && (
        <div className="mt-3 space-y-1">
          {plan.warnings.map((warning) => (
            <p key={warning} className="text-[11px] leading-relaxed text-warning">{warning}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function BtoReadinessPanelBlock({ plan }: { plan: BtoReadinessPlan }) {
  return (
    <div className="rounded-lg border border-cyan-glow/20 bg-cyan-glow/10 px-3 py-3">
      <p className="text-white text-sm font-semibold mb-1">BTO / HFE timeline</p>
      <p className="text-xs leading-relaxed text-text-secondary">{plan.headline}</p>
      <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.14em] text-cyan-glow">
        Est. keys in {plan.estimatedMonthsToKeys} month(s)
      </p>
      <div className="mt-3 space-y-2">
        {plan.stages.map((stage) => (
          <div key={stage.label} className="rounded-lg border border-white/10 bg-black/20 p-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-white">{stage.label}</p>
              <span className={`text-[9px] font-mono uppercase ${
                stage.status === 'blocked'
                  ? 'text-danger'
                  : stage.status === 'ready'
                    ? 'text-success'
                    : stage.status === 'next'
                      ? 'text-cyan-glow'
                      : 'text-text-dim'
              }`}>
                {stage.status}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{stage.detail}</p>
          </div>
        ))}
      </div>
      {plan.warnings.map((warning) => (
        <p key={warning} className="mt-2 text-[11px] leading-relaxed text-warning">{warning}</p>
      ))}
      {plan.notes.map((note) => (
        <p key={note} className="mt-2 text-[11px] leading-relaxed text-text-dim">{note}</p>
      ))}
    </div>
  );
}

function SeniorRightsizingPanelBlock({
  plan,
  onNavigate,
}: {
  plan: SeniorRightsizingPlan;
  onNavigate: (route: string) => void;
}) {
  return (
    <div className="rounded-lg border border-warning/25 bg-warning/10 px-3 py-3">
      <p className="text-white text-sm font-semibold mb-1">55+ rightsizing read</p>
      <p className="text-xs leading-relaxed text-text-secondary">{plan.headline}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <PracticeMetric label="FRS ref." value={formatCurrency(plan.cpfRetirementReference)} tone="neutral" />
        <PracticeMetric label="Est. RA" value={formatCurrency(plan.estimatedRetirementAccount)} tone={plan.cpfGapToReference === 0 ? 'good' : 'neutral'} />
        <PracticeMetric label="CPF gap" value={formatCurrency(plan.cpfGapToReference)} tone={plan.cpfGapToReference === 0 ? 'good' : 'bad'} />
        <PracticeMetric label="CPF above RA" value={formatCurrency(plan.withdrawableCpfEstimate)} tone="neutral" />
      </div>
      <div className="mt-3 space-y-2">
        {plan.options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onNavigate(option.route)}
            className="w-full rounded-lg border border-white/10 bg-black/20 p-2 text-left transition-colors hover:border-warning/40 hover:bg-warning/10"
          >
            <p className="text-xs font-semibold text-white">{option.label}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{option.detail}</p>
          </button>
        ))}
      </div>
      {plan.warnings.map((warning) => (
        <p key={warning} className="mt-2 text-[11px] leading-relaxed text-warning">{warning}</p>
      ))}
    </div>
  );
}

export default function PurchasePanel({
  property,
  player,
  effectiveFinancingMode,
  effectiveDownPaymentPercent,
  minDownPaymentPercent,
  downPaymentPercent,
  activeHousingLoans,
  useCpfOrdinary,
  cpfEligible,
  cpfApplied,
  cashRequired,
  monthlySurplus,
  availableCash,
  reservedCash,
  grantSupport,
  affordability,
  validation,
  dealReadiness,
  dealNextFix,
  practicePlan,
  btoReadinessPlan,
  seniorRightsizingPlan,
  canAfford,
  visibleMessages,
  purchasePanelRef,
  onBuy,
  onSetFinancingMode,
  onSetDownPaymentPercent,
  onSetUseCpfOrdinary,
  onSetActionError,
  onNavigate,
}: {
  property: ListingProperty;
  player: Player;
  effectiveFinancingMode: MortgageFinancingMode;
  effectiveDownPaymentPercent: number;
  minDownPaymentPercent: number;
  downPaymentPercent: number;
  activeHousingLoans: number;
  useCpfOrdinary: boolean;
  cpfEligible: boolean;
  cpfApplied: number;
  cashRequired: number;
  monthlySurplus: number;
  availableCash: number;
  reservedCash: number;
  grantSupport: number;
  affordability: AffordabilityReport;
  validation: PurchaseValidation;
  dealReadiness: DealReadiness;
  dealNextFix: string;
  practicePlan: PracticePurchasePlan;
  btoReadinessPlan: BtoReadinessPlan | null;
  seniorRightsizingPlan: SeniorRightsizingPlan | null;
  canAfford: boolean;
  visibleMessages: string[];
  purchasePanelRef: React.RefObject<HTMLDivElement | null>;
  onBuy: () => void;
  onSetFinancingMode: (mode: MortgageFinancingMode) => void;
  onSetDownPaymentPercent: (pct: number) => void;
  onSetUseCpfOrdinary: (use: boolean) => void;
  onSetActionError: (error: string | null) => void;
  onNavigate: (route: string) => void;
}) {
  const reserveDipWarning = reservedCash > 0 && cashRequired > availableCash && cashRequired <= player.cash;
  const isCommercial = property.type.startsWith('Commercial');

  return (
    <div ref={purchasePanelRef} className="scroll-mt-24">
      <GlassCard accentColor="#00E676" className="lg:sticky lg:top-4 lg:max-h-[34rem] lg:overflow-y-auto">
        <h3 className="section-title text-white mb-4">{isCommercial ? 'Commercial Purchase' : 'Purchase'}</h3>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Price</span>
            <span className="font-mono text-white text-lg">{formatCompactCurrency(property.price)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">PSF</span>
            <span className="font-mono text-white">{formatCurrency(property.psf)}</span>
          </div>

          {property.isHdb && (
            <div className="rounded-xl border border-glass-border bg-white/[0.03] p-3">
              <p className="label-text mb-2 text-[10px] text-text-dim">Financing</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    onSetFinancingMode('hdb-concessionary');
                    onSetDownPaymentPercent(HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT);
                    onSetActionError(null);
                  }}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    effectiveFinancingMode === 'hdb-concessionary'
                      ? 'border-success/40 bg-success/10 text-white'
                      : 'border-glass-border bg-black/20 text-text-secondary hover:border-success/30'
                  }`}
                >
                  <span className="block font-rajdhani text-sm font-semibold">HDB loan</span>
                  <span className="block text-[11px]">25% down / 75% LTV, 2.6% fixed, 25y</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSetFinancingMode('bank');
                    onSetDownPaymentPercent(Math.max(downPaymentPercent, Math.round((1 - getLtvCap(activeHousingLoans)) * 100)));
                    onSetActionError(null);
                  }}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    effectiveFinancingMode === 'bank'
                      ? 'border-cyan-glow/40 bg-cyan-glow/10 text-white'
                      : 'border-glass-border bg-black/20 text-text-secondary hover:border-cyan-glow/30'
                  }`}
                >
                  <span className="block font-rajdhani text-sm font-semibold">Bank loan</span>
                  <span className="block text-[11px]">Market rate, HDB flats serviced at 25y</span>
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-text-dim">
                Simplified game model: HDB concessionary financing makes the starter path playable, while MSR/TDSR still check monthly safety.
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-text-dim">
                Also learn the <GlossaryTerm termId="hps-fire-insurance">HPS / fire insurance</GlossaryTerm> checkpoint before treating the flat as fully planned.
              </p>
            </div>
          )}

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
                onSetDownPaymentPercent(Number(e.target.value));
                onSetActionError(null);
              }}
              className="game-slider w-full accent-cyan-glow"
            />
            <div className="flex justify-between text-[10px] font-mono text-text-dim mt-1">
              <span>{minDownPaymentPercent}%</span>
              <span>100%</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onSetDownPaymentPercent(minDownPaymentPercent);
                  onSetActionError(null);
                }}
                className="rounded-lg border border-glass-border bg-black/20 px-3 py-2 text-[11px] font-rajdhani font-semibold uppercase tracking-[0.12em] text-text-secondary transition-colors hover:border-cyan-glow/40 hover:text-cyan-glow"
              >
                Min Cash
              </button>
              <button
                type="button"
                onClick={() => {
                  onSetDownPaymentPercent(100);
                  onSetActionError(null);
                }}
                className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-[11px] font-rajdhani font-semibold uppercase tracking-[0.12em] text-success transition-colors hover:border-success/60"
              >
                All Cash
              </button>
            </div>
          </div>

          <div className="border-t border-divider pt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-text-secondary text-sm">Down Payment</span>
              <span className="font-mono text-cyan-glow">{formatCurrency(validation.downPayment)}</span>
            </div>
            {validation.mortgageAmount > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-sm">Loan Amount</span>
                  <span className="font-mono text-warning">{formatCurrency(validation.mortgageAmount)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-text-secondary text-sm">Loan Type</span>
                  <span className="font-mono text-[11px] text-text-secondary">
                    {validation.financingMode === 'hdb-concessionary' ? 'HDB 2.6% fixed' : `${formatPercent(validation.loanInterestRate, 1)} bank`}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-text-secondary text-sm">Loan Term</span>
                  <span className="font-mono text-[11px] text-text-secondary">{validation.loanTermYears} years</span>
                </div>
              </>
            )}
            {validation.mortgageAmount <= 0 && (
              <p className="mt-1 text-[11px] text-text-dim">All-cash deal: no mortgage, so TDSR/MSR loan checks do not apply.</p>
            )}
          </div>

          {cpfEligible && player.cpfOrdinary > 0 && (
            <div className="border-t border-divider pt-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCpfOrdinary}
                  onChange={(e) => onSetUseCpfOrdinary(e.target.checked)}
                  disabled={validation.maxCpfOrdinaryUsable <= 0}
                  className="mt-1 accent-cyan-glow"
                />
                <div>
                  <p className="text-white text-sm font-semibold">Use CPF OA toward eligible upfront costs</p>
                  <p className="text-text-secondary text-xs mt-1">
                    Available OA: S${player.cpfOrdinary.toLocaleString()} | Max usable now: {formatCurrency(validation.maxCpfOrdinaryUsable)} | Applied now: S${cpfApplied.toLocaleString()}
                  </p>
                  <p className={`text-xs mt-1 ${
                    validation.cpfUsageMode === 'full'
                      ? 'text-text-dim'
                      : validation.cpfUsageMode === 'prorated'
                        ? 'text-warning'
                        : 'text-danger'
                  }`}>
                    {validation.cpfUsageMode === 'full'
                      ? 'Lease covers CPF rules for full OA use in this simplified upfront step.'
                      : validation.cpfUsageMessage}
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
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-text-secondary text-sm"><GlossaryTerm termId="absd">ABSD</GlossaryTerm> {formatPercent(validation.absdRate * 100)} ({player.properties.length > 0 ? '2nd+' : 'Additional'})</span>
                  <span className="font-mono text-danger">{formatCurrency(validation.absd)}</span>
                </div>
                {formatTaxReliefMessage(validation) && (
                  <p className="mb-2 rounded-lg border border-cyan-glow/20 bg-cyan-glow/10 px-3 py-2 text-[11px] leading-relaxed text-text-secondary">
                    {formatTaxReliefMessage(validation)}
                  </p>
                )}
              </>
            )}
            {validation.hdbResaleLevy > 0 && (
              <div className="flex items-center justify-between mb-1">
                <span className="text-text-secondary text-sm"><GlossaryTerm termId="hdb-resale-levy">HDB Resale Levy</GlossaryTerm></span>
                <span className="font-mono text-warning">{formatCurrency(validation.hdbResaleLevy)}</span>
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
              <span className="text-text-secondary text-sm">Wallet Cash</span>
              <span className="font-mono text-white">{formatCurrency(player.cash)}</span>
            </div>
            {reservedCash > 0 && (
              <>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-text-secondary text-sm"><GlossaryTerm termId="reserve-cash">Reserved Cash</GlossaryTerm></span>
                  <span className="font-mono text-warning">{formatCurrency(reservedCash)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-text-secondary text-sm">Spendable Now</span>
                  <span className="font-mono text-cyan-glow">{formatCurrency(availableCash)}</span>
                </div>
              </>
            )}
            {reserveDipWarning && (
              <p className="mt-2 rounded-lg border border-warning/25 bg-warning/10 p-3 text-[11px] leading-relaxed text-text-secondary">
                This buy works only by dipping into your reserved cash. The reserve is still yours, but you would be giving up part of your emergency buffer to close the deal.
              </p>
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
              <div className="mt-3 rounded-lg border border-cyan-glow/20 bg-cyan-glow/10 p-3">
                <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-cyan-glow">Next best fix</p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">{dealNextFix}</p>
              </div>
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
                    ? isCommercial
                      ? 'You already have enough to cover the upfront cash requirement.'
                      : 'You already have enough to cover the cash requirement after CPF OA.'
                    : `At your current pace, this cash requirement is about ${affordability.monthsAtCurrentPace} months away.`}
              </p>
              <p className="text-text-dim text-[11px] mt-2">
                Best accelerators: Side Gig, Property Hustle, and Claim / Plan Schemes.
              </p>
            </div>
            <PracticePurchasePanelBlock plan={practicePlan} />
            {btoReadinessPlan && <BtoReadinessPanelBlock plan={btoReadinessPlan} />}
            {seniorRightsizingPlan && (
              <SeniorRightsizingPanelBlock
                plan={seniorRightsizingPlan}
                onNavigate={onNavigate}
              />
            )}
          </div>
        </div>

        <div
          data-purchase-action="primary"
          className="mt-4 rounded-card border border-divider bg-glass-fill/95 p-4 backdrop-blur-xl lg:sticky lg:bottom-0 lg:-mx-4 lg:-mb-4 lg:rounded-b-card lg:border-x-0 lg:border-b-0"
        >
          <button
            onClick={onBuy}
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
    </div>
  );
}
