import { Home, DollarSign } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import GlossaryTerm from '@/components/GlossaryTerm';
import { formatCompactCurrency, formatCurrency, formatPercent } from '@/lib/format';
import { formatOwnershipStatus } from '@/pages/property/propertyDetailFormatters';
import type { OwnedProperty, Loan, RentalMode, TenantProfileId, RentStrategy } from '@/game/types';

export default function PropertySummary({
  ownedProperty,
  associatedLoan,
  gain,
  gainPercent,
  quickRentalBlockedByMop,
  actionError,
  showSellConfirm,
  onShowSellConfirm,
  onToggleRental,
  onTenantPlan,
  onSell,
}: {
  ownedProperty: OwnedProperty;
  associatedLoan: Loan | null | undefined;
  gain: number;
  gainPercent: number;
  quickRentalBlockedByMop: boolean;
  actionError: string | null;
  showSellConfirm: boolean;
  onShowSellConfirm: (show: boolean) => void;
  onToggleRental: () => void;
  onTenantPlan: (mode: RentalMode, profileId: TenantProfileId, strategy: RentStrategy) => void;
  onSell: () => void;
}) {
  const leaseStatus = ownedProperty.tenant
    ? ownedProperty.tenant.rentalMode === 'room-rental'
      ? 'Room rental live'
      : 'Whole-unit lease live'
    : quickRentalBlockedByMop
      ? 'Owner-occupied during MOP'
      : ownedProperty.isRented
        ? 'Rental active'
        : 'No tenant yet';
  const liveRent = ownedProperty.tenant?.contractedRent ?? (ownedProperty.isRented ? ownedProperty.monthlyRental : 0);

  return (
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
            <span className="text-text-secondary text-sm">Lease Status</span>
            <span className={`font-mono text-xs ${liveRent > 0 ? 'text-cyan-glow' : 'text-text-dim'}`}>
              {leaseStatus}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-text-secondary text-sm">Live Rent</span>
            <span className={`font-mono text-xs ${liveRent > 0 ? 'text-success' : 'text-text-dim'}`}>
              {liveRent > 0 ? formatCurrency(liveRent) : 'S$0'}
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
            onClick={() => onTenantPlan('room-rental', 'local-family', 'market')}
            className="w-full rounded-lg border border-success/40 bg-success/20 py-3 text-sm font-semibold uppercase tracking-wider text-success transition-all hover:bg-success/30"
          >
            Start MOP-Safe Room Rental
          </button>
        )}
        <button
          onClick={onToggleRental}
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
            onClick={() => onShowSellConfirm(true)}
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
              <button onClick={() => onShowSellConfirm(false)} className="flex-1 btn-secondary text-xs py-2">Cancel</button>
              <button onClick={onSell} className="flex-1 btn-danger text-xs py-2">Confirm Sell</button>
            </div>
          </div>
        )}
      </div>
      {actionError && (
        <p className="text-danger text-xs text-center mt-3">{actionError}</p>
      )}
    </GlassCard>
  );
}
