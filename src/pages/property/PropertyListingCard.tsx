import { Bath, Bed, MapPin, Maximize, Scale, Target } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import EligibilityBadge from '@/components/EligibilityBadge';
import PropertyImage from '@/components/PropertyImage';
import { propertyTypeInfo } from '@/data/properties';
import { districts } from '@/data/districts';
import { formatCompactCurrency } from '@/lib/format';
import type { ListingProperty, DynamicListingSignal } from '@/engine/listings';
import type { DealReadiness } from '@/engine/decisionCoach';
import type { EligibilityFlags, PropertyEligibilityStatus } from '@/engine/eligibility';

type Verdict = DealReadiness['verdict'];

interface PropertyListingCardProps {
  property: ListingProperty;
  readiness: DealReadiness;
  eligibility: PropertyEligibilityStatus;
  flags: EligibilityFlags;
  signal: DynamicListingSignal | undefined;
  worstCase: string;
  selectedForCompare: boolean;
  compareDisabled: boolean;
  shortlisted: boolean;
  shortlistDisabled: boolean;
  shortlistFull: boolean;
  ownedPropertyIds: Set<string>;
  compactMode: boolean;
  onOpen: (propertyId: string) => void;
  onToggleCompare: (propertyId: string) => void;
  onToggleShortlist: (propertyId: string) => void;
}

export default function PropertyListingCard({
  property,
  readiness,
  eligibility,
  flags,
  signal,
  worstCase,
  selectedForCompare,
  compareDisabled,
  shortlisted,
  shortlistDisabled,
  shortlistFull,
  ownedPropertyIds,
  compactMode,
  onOpen,
  onToggleCompare,
  onToggleShortlist,
}: PropertyListingCardProps) {
  const district = districts.find((d) => d.id === property.districtId);
  const typeInfo = propertyTypeInfo[property.type];
  const isCommercial = property.type.startsWith('Commercial');

  return (
    <GlassCard hoverable onClick={() => onOpen(property.id)} className="cursor-pointer">
      <div className="relative h-40 mb-3 rounded-lg overflow-hidden bg-void-navy">
        <PropertyImage
          src={property.image}
          alt={property.name}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          <span
            className="px-2 py-1 rounded text-[10px] font-rajdhani font-semibold uppercase"
            style={{ backgroundColor: typeInfo.color + '30', color: typeInfo.color, border: `1px solid ${typeInfo.color}50` }}
          >
            {property.type}
          </span>
          <span className="px-2 py-1 rounded text-[10px] font-rajdhani font-semibold bg-black/60 text-white border border-white/10">
            {property.listingChannel}
          </span>
          {signal && (
            <span className="px-2 py-1 rounded text-[10px] font-rajdhani font-semibold bg-warning/20 text-warning border border-warning/30">
              {signal.label}
            </span>
          )}
        </div>
        <div className="absolute bottom-2 left-2 text-[10px] font-mono text-white bg-black/50 px-2 py-0.5 rounded">
          PSF: S${property.psf.toLocaleString()}
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (!shortlistDisabled || shortlisted) onToggleShortlist(property.id);
          }}
          disabled={shortlistDisabled && !shortlisted}
          className={`absolute top-2 left-2 inline-flex min-h-9 items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-rajdhani font-semibold uppercase tracking-wider transition-colors ${getShortlistButtonClasses(shortlisted, shortlistDisabled)}`}
        >
          <Target size={12} />
          {getShortlistLabel({ shortlisted, owned: ownedPropertyIds.has(property.id), shortlistFull })}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (!compareDisabled) onToggleCompare(property.id);
          }}
          disabled={compareDisabled}
          className={`absolute bottom-2 right-2 inline-flex min-h-9 items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-rajdhani font-semibold uppercase tracking-wider transition-colors ${getCompareButtonClasses(selectedForCompare, compareDisabled)}`}
        >
          <Scale size={12} />
          {selectedForCompare ? 'Compared' : 'Compare'}
        </button>
      </div>

      <h3 className="font-rajdhani font-semibold text-white text-base mb-1 truncate">{property.name}</h3>
      <div className="flex items-center gap-1 text-text-secondary text-xs mb-2">
        <MapPin size={12} />
        <span>D{district?.id} {district?.name} ({district?.region})</span>
      </div>
      {!compactMode && (
        <p className="text-text-dim text-[11px] mb-2 line-clamp-2">
          {property.strategyTag} | {property.districtTheme}
        </p>
      )}

      <div className="flex items-center gap-4 text-text-dim text-xs mb-3">
        <span className="flex items-center gap-1"><Bed size={12} /> {property.bedrooms || '-'}</span>
        <span className="flex items-center gap-1"><Bath size={12} /> {property.bathrooms || '-'}</span>
        <span className="flex items-center gap-1"><Maximize size={12} /> {property.size}sqm</span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {!isCommercial && flags.firstTimer && eligibility.firstTimerFriendly && (
          <EligibilityBadge label="First-Timer Friendly" tone="good" />
        )}
        {property.type === 'Executive Condo' && eligibility.ecEligible && (
          <EligibilityBadge label="EC Eligible" tone="good" />
        )}
        {eligibility.salaryCeilingExceeded && (
          <EligibilityBadge label="Salary Ceiling Exceeded" tone="blocked" />
        )}
        {eligibility.upgraderTier && (
          <EligibilityBadge label="Upgrader Tier" tone="warn" />
        )}
        {property.type === 'Executive Condo' && eligibility.blockedReason && !eligibility.salaryCeilingExceeded && (
          <EligibilityBadge label="Private-Owner Blocked" tone="blocked" />
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-cyan-glow font-bold">{formatCompactCurrency(property.price)}</span>
        <span className="text-success text-xs font-mono">{property.rentalYield}% yield</span>
      </div>
      <div className={`mt-3 rounded-lg border px-3 py-2 ${getVerdictPanelClass(readiness.verdict)}`}>
        <div className="flex items-center justify-between gap-3">
          <span className={`text-[10px] font-mono uppercase tracking-[0.16em] ${getVerdictTextClass(readiness.verdict)}`}>
            {getVerdictLabel(readiness.verdict)}
          </span>
          <span className="font-mono text-[10px] text-white">{formatCompactCurrency(readiness.cashRequired)} cash</span>
        </div>
        {!compactMode && (
          <p className="text-text-secondary text-[11px] mt-1 line-clamp-1">
            {readiness.verdict === 'ready'
              ? isCommercial ? 'Ready with current cash and financing.' : 'Ready with current CPF and cash.'
              : readiness.verdict === 'stretch'
                ? 'Buyable, but monthly buffer is thin.'
                : readiness.primaryBlocker?.message ?? 'Improve readiness before buying.'}
          </p>
        )}
      </div>
      {!compactMode && (
        <div className="mt-2 rounded-lg border border-warning/20 bg-warning/10 px-3 py-2">
          <p className="label-text text-[9px] text-warning">Worst case</p>
          <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{worstCase}</p>
        </div>
      )}
    </GlassCard>
  );
}

function getVerdictPanelClass(verdict: Verdict): string {
  if (verdict === 'ready') return 'border-success/30 bg-success/10';
  if (verdict === 'stretch') return 'border-warning/30 bg-warning/10';
  return 'border-danger/30 bg-danger/10';
}

function getVerdictTextClass(verdict: Verdict): string {
  if (verdict === 'ready') return 'text-success';
  if (verdict === 'stretch') return 'text-warning';
  return 'text-danger';
}

function getVerdictLabel(verdict: Verdict): string {
  if (verdict === 'ready') return 'Can buy';
  if (verdict === 'stretch') return 'Tight';
  return 'Blocked';
}

function getShortlistLabel({ shortlisted, owned, shortlistFull }: { shortlisted: boolean; owned: boolean; shortlistFull: boolean }): string {
  if (shortlisted) return 'Pinned';
  if (owned) return 'Owned';
  if (shortlistFull) return 'Full';
  return 'Pin';
}

function getShortlistButtonClasses(shortlisted: boolean, shortlistDisabled: boolean): string {
  if (shortlisted) return 'border-success/50 bg-success/25 text-success';
  if (shortlistDisabled) return 'cursor-not-allowed border-white/10 bg-black/50 text-text-dim';
  return 'border-cyan-glow/40 bg-black/60 text-cyan-glow hover:bg-cyan-glow/20';
}

function getCompareButtonClasses(selected: boolean, disabled: boolean): string {
  if (selected) return 'border-success/50 bg-success/25 text-success';
  if (disabled) return 'cursor-not-allowed border-white/10 bg-black/50 text-text-dim';
  return 'border-cyan-glow/40 bg-black/60 text-cyan-glow hover:bg-cyan-glow/20';
}
