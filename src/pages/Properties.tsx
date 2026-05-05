import { useState } from 'react';
import { propertyTypeInfo } from '@/data/properties';
import { districts } from '@/data/districts';
import { listingChannelInfo } from '@/data/listingChannels';
import GlassCard from '@/components/GlassCard';
import ProgressivePanel from '@/components/ProgressivePanel';
import { Search, MapPin, Bed, Bath, Maximize, Sparkles, SlidersHorizontal } from 'lucide-react';
import PropertyImage from '@/components/PropertyImage';
import { useNavigate } from 'react-router-dom';
import { buildListingSummary, getListingCatalog } from '@/engine/listings';
import { formatCompactCurrency } from '@/lib/format';
import { useGameStore } from '@/game/useGameStore';
import { deriveEligibilityFlags, evaluatePropertyEligibility } from '@/engine/eligibility';
import EligibilityBadge from '@/components/EligibilityBadge';
import { assessDealReadiness } from '@/engine/decisionCoach';

type FilterPreset = 'starter' | 'yield' | 'upgrade' | 'advanced';

const filterPresets: Array<{ id: FilterPreset; label: string; detail: string }> = [
  { id: 'starter', label: 'Starter-safe', detail: 'HDB and EC rungs' },
  { id: 'yield', label: 'High yield', detail: 'Income-first picks' },
  { id: 'upgrade', label: 'Upgrade path', detail: 'Condo and landed moves' },
  { id: 'advanced', label: 'Advanced', detail: 'Use full filters' },
];

export default function Properties() {
  const navigate = useNavigate();
  const { player } = useGameStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [preset, setPreset] = useState<FilterPreset>('starter');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAllListings, setShowAllListings] = useState(false);

  const catalog = getListingCatalog();
  const summary = buildListingSummary();
  const propertyTypes = Object.keys(propertyTypeInfo);
  const channelOptions = Object.keys(listingChannelInfo);
  const eligibilityInput = {
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
    buyerProfile: player.buyerProfile,
  };
  const flags = deriveEligibilityFlags(eligibilityInput);
  const bestNextBuy = catalog
    .map((property) => ({
      property,
      readiness: assessDealReadiness({
        player,
        property,
        downPaymentPercent: 25,
        useCpfOrdinary: true,
      }),
    }))
    .sort((a, b) => {
      const verdictScore = { ready: 0, stretch: 1, blocked: 2 };
      return verdictScore[a.readiness.verdict] - verdictScore[b.readiness.verdict]
        || a.readiness.cashRequired - b.readiness.cashRequired
        || a.property.price - b.property.price;
    })[0];

  const filtered = catalog.filter(p => {
    const district = districts.find(d => d.id === p.districtId);
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      district?.name.toLowerCase().includes(search.toLowerCase()) ||
      p.strategyTag.toLowerCase().includes(search.toLowerCase()) ||
      p.archetypeLabel.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    const matchesRegion = regionFilter === 'all' || district?.region === regionFilter;
    const matchesChannel = channelFilter === 'all' || p.listingChannel === channelFilter;
    const matchesPreset = preset === 'advanced'
      || (preset === 'starter' && (p.isHdb || p.type === 'Executive Condo'))
      || (preset === 'yield' && (p.rentalYield >= 4.2 || p.strategyTag.toLowerCase().includes('yield')))
      || (preset === 'upgrade' && ['Executive Condo', 'Private Condo', 'Landed Terrace', 'Landed Semi-D', 'Landed Bungalow'].includes(p.type));
    return matchesSearch && matchesType && matchesRegion && matchesChannel && matchesPreset;
  });

  const handlePresetChange = (nextPreset: FilterPreset) => {
    setPreset(nextPreset);
    setShowAllListings(false);
    if (nextPreset !== 'advanced') {
      setTypeFilter('all');
      setRegionFilter('all');
      setChannelFilter('all');
      setShowAdvancedFilters(false);
    } else {
      setShowAdvancedFilters(true);
    }
  };
  const visibleListings = showAllListings ? filtered : filtered.slice(0, 12);

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="page-title text-white">Buy Properties</h1>
          <p className="text-text-secondary mt-1 font-rajdhani">
            Start with the recommended deal, then open filters only when you want to browse like an expert.
          </p>
        </div>

        {bestNextBuy && (
          <GlassCard accentColor="#00E676" className="mb-6 overflow-hidden" padding="none">
            <div className="grid lg:grid-cols-[260px,1fr]">
              <PropertyImage
                src={bestNextBuy.property.image}
                alt={bestNextBuy.property.name}
                className="h-56 w-full object-cover lg:h-full"
              />
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-success">
                    <Sparkles size={13} /> Best next buy for you
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-text-secondary">
                    {bestNextBuy.readiness.verdict === 'ready' ? 'Can buy' : bestNextBuy.readiness.verdict === 'stretch' ? 'Tight but possible' : 'Needs work'}
                  </span>
                </div>
                <h2 className="section-title text-white text-2xl">{bestNextBuy.property.name}</h2>
                <p className="text-text-secondary text-sm mt-2 max-w-3xl">{bestNextBuy.readiness.headline}</p>
                <div className="grid sm:grid-cols-3 gap-3 mt-4">
                  <HeroFact label="Price" value={formatCompactCurrency(bestNextBuy.property.price)} />
                  <HeroFact label="Cash Needed" value={formatCompactCurrency(bestNextBuy.readiness.cashRequired)} />
                  <HeroFact label="Yield" value={`${bestNextBuy.property.rentalYield}%`} />
                </div>
                <div className="flex flex-wrap gap-2 mt-5">
                  <button onClick={() => navigate(`/property/${bestNextBuy.property.id}`)} className="btn-primary px-4 py-3 text-sm">
                    Review Deal
                  </button>
                  <button onClick={() => handlePresetChange('starter')} className="btn-secondary px-4 py-3 text-sm">
                    Starter List
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        <ProgressivePanel
          title="Market Breadth"
          eyebrow="Advanced context"
          summary={`${summary.totalListings} fictional listings across ${summary.coveredDistrictCount}/${districts.length} districts.`}
          accentColor="#00F0FF"
          className="mb-6"
        >
          <div className="grid md:grid-cols-4 gap-4">
            <MarketFact label="Live Listings" value={String(summary.totalListings)} detail="Across all strategies" />
            <MarketFact label="District Coverage" value={`${summary.coveredDistrictCount}/${districts.length}`} detail="Full island market map" />
            <MarketFact label="New Launches" value={String(summary.byChannel['New Launch'])} detail="Fresh supply in play" />
            <MarketFact
              label="Special Inventory"
              value={String(summary.byChannel['Auction'] + summary.byChannel['Distressed'] + summary.byChannel['Off-Market'] + summary.byChannel['Signature'])}
              detail="Auction, quiet, and trophy stock"
            />
          </div>
        </ProgressivePanel>

        {/* Filters */}
        <div className="mb-6 space-y-3">
          <div className="grid gap-2 md:grid-cols-4">
            {filterPresets.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handlePresetChange(option.id)}
                className={`rounded-2xl border p-3 text-left transition-colors ${
                  preset === option.id
                    ? 'border-cyan-glow/50 bg-cyan-glow/10'
                    : 'border-glass-border bg-white/[0.03] hover:border-white/20'
                }`}
              >
                <p className={`font-rajdhani font-semibold ${preset === option.id ? 'text-cyan-glow' : 'text-white'}`}>{option.label}</p>
                <p className="text-text-secondary text-xs mt-1">{option.detail}</p>
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              placeholder="Search properties or districts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-void-navy border border-glass-border rounded-input pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-text-dim/50 focus:border-cyan-glow focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-white/[0.04] px-4 py-2 text-xs font-rajdhani uppercase tracking-wider text-text-secondary hover:text-white"
          >
            <SlidersHorizontal size={14} />
            {showAdvancedFilters ? 'Hide filters' : 'More filters'}
          </button>
          {showAdvancedFilters && (
            <div className="flex flex-wrap gap-3 rounded-2xl border border-glass-border bg-black/20 p-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-void-navy border border-glass-border rounded-input px-4 py-2.5 text-sm text-white focus:border-cyan-glow focus:outline-none"
              >
                <option value="all">All Types</option>
                {propertyTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="bg-void-navy border border-glass-border rounded-input px-4 py-2.5 text-sm text-white focus:border-cyan-glow focus:outline-none"
              >
                <option value="all">All Regions</option>
                <option value="CCR">Core Central (CCR)</option>
                <option value="RCR">Rest of Central (RCR)</option>
                <option value="OCR">Outside Central (OCR)</option>
              </select>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="bg-void-navy border border-glass-border rounded-input px-4 py-2.5 text-sm text-white focus:border-cyan-glow focus:outline-none"
              >
                <option value="all">All Channels</option>
                {channelOptions.map((channel) => (
                  <option key={channel} value={channel}>{channel}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Results count */}
        <p className="text-text-secondary text-sm mb-4">
          {filtered.length} properties found
          <span className="text-text-dim"> | {new Set(filtered.map((property) => property.districtId)).size} districts in view</span>
          {!showAllListings && filtered.length > visibleListings.length && (
            <span className="text-text-dim"> | showing the first {visibleListings.length} to keep browsing readable</span>
          )}
        </p>

        {/* Property Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleListings.map((property) => {
            const district = districts.find(d => d.id === property.districtId);
            const typeInfo = propertyTypeInfo[property.type];
            const eligibility = evaluatePropertyEligibility({ ...eligibilityInput, propertyType: property.type });
            const readiness = assessDealReadiness({
              player,
              property,
              downPaymentPercent: 25,
              useCpfOrdinary: true,
            });
            return (
              <GlassCard
                key={property.id}
                hoverable
                onClick={() => navigate(`/property/${property.id}`)}
                className="cursor-pointer"
              >
                <div className="relative h-40 mb-3 rounded-lg overflow-hidden bg-void-navy">
                  <PropertyImage
                    src={property.image}
                    alt={property.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                    <span className="px-2 py-1 rounded text-[10px] font-rajdhani font-semibold uppercase"
                      style={{ backgroundColor: typeInfo.color + '30', color: typeInfo.color, border: `1px solid ${typeInfo.color}50` }}>
                      {property.type}
                    </span>
                    <span className="px-2 py-1 rounded text-[10px] font-rajdhani font-semibold bg-black/60 text-white border border-white/10">
                      {property.listingChannel}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 text-[10px] font-mono text-white bg-black/50 px-2 py-0.5 rounded">
                    PSF: S${property.psf.toLocaleString()}
                  </div>
                </div>

                <h3 className="font-rajdhani font-semibold text-white text-base mb-1 truncate">{property.name}</h3>
                <div className="flex items-center gap-1 text-text-secondary text-xs mb-2">
                  <MapPin size={12} />
                  <span>D{district?.id} {district?.name} ({district?.region})</span>
                </div>
                <p className="text-text-dim text-[11px] mb-2 line-clamp-2">
                  {property.strategyTag} | {property.districtTheme}
                </p>

                <div className="flex items-center gap-4 text-text-dim text-xs mb-3">
                  <span className="flex items-center gap-1"><Bed size={12} /> {property.bedrooms || '-'}</span>
                  <span className="flex items-center gap-1"><Bath size={12} /> {property.bathrooms || '-'}</span>
                  <span className="flex items-center gap-1"><Maximize size={12} /> {property.size}sqm</span>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                  {flags.firstTimer && eligibility.firstTimerFriendly && (
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
                <div className={`mt-3 rounded-lg border px-3 py-2 ${
                  readiness.verdict === 'ready'
                    ? 'border-success/30 bg-success/10'
                    : readiness.verdict === 'stretch'
                      ? 'border-warning/30 bg-warning/10'
                      : 'border-danger/30 bg-danger/10'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-[10px] font-mono uppercase tracking-[0.16em] ${
                      readiness.verdict === 'ready'
                        ? 'text-success'
                        : readiness.verdict === 'stretch'
                          ? 'text-warning'
                          : 'text-danger'
                    }`}>
                      {readiness.verdict === 'ready' ? 'Can buy' : readiness.verdict === 'stretch' ? 'Tight' : 'Blocked'}
                    </span>
                    <span className="font-mono text-[10px] text-white">{formatCompactCurrency(readiness.cashRequired)} cash</span>
                  </div>
                  <p className="text-text-secondary text-[11px] mt-1 line-clamp-1">
                    {readiness.verdict === 'ready'
                      ? 'Ready with current CPF and cash.'
                      : readiness.verdict === 'stretch'
                        ? 'Buyable, but monthly buffer is thin.'
                        : readiness.primaryBlocker?.message ?? 'Improve readiness before buying.'}
                  </p>
                </div>
              </GlassCard>
            );
          })}
        </div>
        {filtered.length > visibleListings.length && (
          <div className="mt-6 flex justify-center">
            <button onClick={() => setShowAllListings(true)} className="btn-secondary px-5 py-3 text-sm">
              Show All {filtered.length} Listings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-glass-border bg-black/20 p-3">
      <p className="label-text text-text-dim text-[10px]">{label}</p>
      <p className="font-mono text-white mt-1">{value}</p>
    </div>
  );
}

function MarketFact({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-glass-border bg-white/[0.03] p-3">
      <p className="label-text text-text-dim text-[10px]">{label}</p>
      <p className="font-mono text-2xl text-white mt-1">{value}</p>
      <p className="text-text-secondary text-xs mt-1">{detail}</p>
    </div>
  );
}
