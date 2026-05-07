import GlassCard from '@/components/GlassCard';
import EligibilityBadge from '@/components/EligibilityBadge';
import PropertyImage from '@/components/PropertyImage';
import { formatCurrency, formatPercent } from '@/lib/format';
import { CheckCircle, MapPin, Bed, Bath, Maximize, Calendar, Train, ShoppingBag } from 'lucide-react';
import type { OwnedProperty, Player, RentalMode, RentStrategy, TenantProfileId } from '@/game/types';
import type { ListingProperty } from '@/engine/listings';
import type { EligibilityFlags, PropertyEligibilityStatus } from '@/engine/eligibility';
import type { District } from '@/data/districts';
import { DetailItem } from './PropertyDetailComponents';

export function PracticeMetric({ label, value, tone }: { label: string; value: string; tone: 'good' | 'bad' | 'neutral' }) {
  return (
    <div className="rounded-lg border border-glass-border bg-black/20 p-2">
      <p className="label-text text-[8px] text-text-dim">{label}</p>
      <p className={`mt-1 font-mono text-[11px] ${tone === 'good' ? 'text-success' : tone === 'bad' ? 'text-danger' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}

export function QuickPurchasePanel({
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

export function FirstOwnerChecklist({
  isHdb,
  ownedProperty,
  onTenantPlan,
  onReserveTopUp,
  onNavigate,
}: {
  isHdb: boolean;
  ownedProperty: OwnedProperty;
  onTenantPlan: (mode: RentalMode, profileId: TenantProfileId, strategy: RentStrategy) => void;
  onReserveTopUp: () => void;
  onNavigate: (path: string) => void;
}) {
  return (
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
          {isHdb && (ownedProperty.mopRemainingMonths ?? 0) > 0 && !ownedProperty.tenant && (
            <button
              type="button"
              onClick={() => onTenantPlan('room-rental', 'local-family', 'market')}
              className="btn-primary py-3 text-sm"
            >
              Start MOP-Safe Room Rental
            </button>
          )}
          <button type="button" onClick={onReserveTopUp} className="btn-secondary py-3 text-sm">
            Protect S$5K Reserve
          </button>
          <button type="button" onClick={() => onNavigate('/dashboard')} className="btn-secondary py-3 text-sm">
            Back to Monthly Plan
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

export function EligibilitySection({
  property,
  player,
  eligibilityFlags,
  eligibility,
  eligibilityBlocked,
  isOwned,
}: {
  property: ListingProperty;
  player: Player;
  eligibilityFlags: EligibilityFlags;
  eligibility: PropertyEligibilityStatus;
  eligibilityBlocked: boolean;
  isOwned: boolean;
}) {
  return (
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
  );
}

export function PropertyImageHeader({
  property,
  district,
  typeColor,
  isOwned,
  ownedProperty,
  eligibilityFlags,
  eligibility,
}: {
  property: ListingProperty;
  district: District;
  typeColor: string;
  isOwned: boolean;
  ownedProperty: OwnedProperty | null;
  eligibilityFlags: EligibilityFlags;
  eligibility: PropertyEligibilityStatus;
}) {
  return (
    <div className="relative mb-4 h-52 overflow-hidden rounded-xl md:mb-6 md:h-80">
      <PropertyImage src={property.image} alt={property.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="px-2 py-1 rounded text-[10px] font-rajdhani font-semibold uppercase"
            style={{ backgroundColor: typeColor + '40', color: typeColor }}>
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
  );
}

export function PropertyDetailsCard({ property }: { property: ListingProperty }) {
  return (
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
  );
}

export function AmenitiesCard({ property, district }: { property: ListingProperty; district: District }) {
  return (
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
  );
}

export function InvestmentAngleCard({
  property,
  rarityAccent,
  rarityLabel,
}: {
  property: ListingProperty;
  rarityAccent: string;
  rarityLabel: string;
}) {
  return (
    <GlassCard accentColor={rarityAccent}>
      <h3 className="section-title text-white mb-4">Investment Angle</h3>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="label-text text-text-dim text-[10px] mb-1">Listing Channel</p>
          <p className="font-mono text-cyan-glow">{property.listingChannel}</p>
        </div>
        <div>
          <p className="label-text text-text-dim text-[10px] mb-1">Market Tier</p>
          <p className="font-mono text-white">{rarityLabel}</p>
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
  );
}

export function MarketAnalysisCard({ property, district }: { property: ListingProperty; district: District }) {
  return (
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
  );
}
