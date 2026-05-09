import { useState } from 'react';
import { propertyTypeInfo } from '@/data/properties';
import { districts } from '@/data/districts';
import { listingChannelInfo } from '@/data/listingChannels';
import GlassCard from '@/components/GlassCard';
import GuidedFocusPanel from '@/components/GuidedFocusPanel';
import ProgressivePanel from '@/components/ProgressivePanel';
import { Search, Sparkles, SlidersHorizontal } from 'lucide-react';
import PropertyImage from '@/components/PropertyImage';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buildListingSummary, getDynamicListingSignals, getListingCatalog } from '@/engine/listings';
import { formatCompactCurrency } from '@/lib/format';
import { useGameStore } from '@/game/useGameStore';
import { deriveEligibilityFlags, evaluatePropertyEligibility } from '@/engine/eligibility';
import { assessDealReadiness, selectBestNextBuyForPlayer } from '@/engine/decisionCoach';
import {
  buildDealComparisons,
  getDealComparisonShortlist,
  getWorstCaseReadout,
} from '@/engine/dealComparison';
import { HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT } from '@/engine/constants';
import PropertyListingCard from './property/PropertyListingCard';
import { DealComparePanel, HeroFact, MarketFact } from './property/PropertiesPanels';
import PageSceneHero, { HeroAction } from '@/components/visuals/PageSceneHero';

type FilterPreset = 'starter' | 'yield' | 'upgrade' | 'advanced';

const filterPresets: Array<{ id: FilterPreset; label: string; detail: string }> = [
  { id: 'starter', label: 'Starter-safe', detail: 'HDB and EC rungs' },
  { id: 'yield', label: 'High yield', detail: 'Income-first picks' },
  { id: 'upgrade', label: 'Upgrade path', detail: 'Condo and landed moves' },
  { id: 'advanced', label: 'Advanced', detail: 'Use full filters' },
];

export default function Properties() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { player, settings, updateSettings, toggleNextHomeShortlist } = useGameStore();
  const districtParam = Number(searchParams.get('district'));
  const districtFromQuery = districts.find((district) => district.id === districtParam);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [preset, setPreset] = useState<FilterPreset>('starter');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAllListings, setShowAllListings] = useState(false);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);

  const catalog = getListingCatalog();
  const summary = buildListingSummary();
  const dynamicSignals = getDynamicListingSignals(player.turnCount);
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
  const bestNextBuy = selectBestNextBuyForPlayer(player);
  const suggestedComparisonIds = getDealComparisonShortlist(player, bestNextBuy ? [bestNextBuy.property.id] : []);
  const comparison = buildDealComparisons({
    player,
    propertyIds: comparisonIds.length > 0 ? comparisonIds : suggestedComparisonIds,
  });
  const comparisonMode = comparisonIds.length > 0 ? 'selected' : 'suggested';
  const nextHomeShortlistIds = player.nextHomeShortlistIds ?? [];
  const shortlistFull = nextHomeShortlistIds.length >= 3;
  const ownedPropertyIds = new Set(player.properties.map((ownedProperty) => ownedProperty.propertyId));
  const activePreset = districtFromQuery ? 'advanced' : preset;
  const showAdvancedFilterControls = showAdvancedFilters || Boolean(districtFromQuery);
  const showGuidedFocus = settings.guidedMode || player.turnCount <= 6;

  const filtered = catalog.filter(p => {
    const district = districts.find(d => d.id === p.districtId);
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      district?.name.toLowerCase().includes(search.toLowerCase()) ||
      p.strategyTag.toLowerCase().includes(search.toLowerCase()) ||
      p.archetypeLabel.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    const matchesRegion = regionFilter === 'all' || district?.region === regionFilter;
    const matchesChannel = channelFilter === 'all' || p.listingChannel === channelFilter;
    const matchesPreset = activePreset === 'advanced'
      || (activePreset === 'starter' && (p.isHdb || p.type === 'Executive Condo'))
      || (activePreset === 'yield' && (p.rentalYield >= 4.2 || p.strategyTag.toLowerCase().includes('yield')))
      || (activePreset === 'upgrade' && ['Executive Condo', 'Private Condo', 'Landed Terrace', 'Landed Semi-D', 'Landed Bungalow'].includes(p.type));
    const matchesDistrictQuery = !districtFromQuery || p.districtId === districtFromQuery.id;
    return matchesSearch && matchesType && matchesRegion && matchesChannel && matchesPreset && matchesDistrictQuery;
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
  const handleToggleCompare = (propertyId: string) => {
    setComparisonIds((ids) => {
      if (ids.includes(propertyId)) return ids.filter((id) => id !== propertyId);
      return [...ids, propertyId].slice(0, 3);
    });
  };
  const handleRemoveCompare = (propertyId: string) => {
    setComparisonIds((ids) => ids.filter((id) => id !== propertyId));
  };
  const showAllVisibleListings = showAllListings || Boolean(districtFromQuery);
  const visibleListings = showAllVisibleListings ? filtered : filtered.slice(0, 12);

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <PageSceneHero
          variant="buy"
          eyebrow={districtFromQuery ? `Viewing D${districtFromQuery.id} ${districtFromQuery.name}` : 'Buy properties'}
          title="Pick the next home like a board move"
          subtitle="Start with the recommended deal, then open filters only when you want to browse like an expert."
          className="mb-6"
          stats={[
            { label: 'Listings', value: String(summary.totalListings), tone: 'neutral' },
            { label: 'Districts', value: `${summary.coveredDistrictCount}/28`, tone: 'good' },
            { label: 'Visible now', value: String(visibleListings.length), tone: 'neutral' },
          ]}
          actions={(
            <>
              {bestNextBuy && (
                <HeroAction onClick={() => navigate(`/property/${bestNextBuy.property.id}`)}>
                  Review best deal
                </HeroAction>
              )}
              <button
                type="button"
                onClick={() => updateSettings({ compactMode: !settings.compactMode })}
                aria-pressed={settings.compactMode}
                aria-label={settings.compactMode ? 'Show full guide text on listings' : 'Use less text view on listings'}
                className={`rounded-lg border px-4 py-3 text-sm font-rajdhani font-semibold uppercase tracking-wider ${
                  settings.compactMode
                    ? 'border-success/35 bg-success/10 text-success'
                    : 'border-cyan-glow/30 bg-cyan-glow/10 text-cyan-glow'
                }`}
              >
                {settings.compactMode ? 'Show full guide' : 'Less text view'}
              </button>
            </>
          )}
        />

        {bestNextBuy && (
          <GlassCard accentColor="#00E676" className="mb-6 overflow-hidden" padding="none">
            <div className="grid lg:grid-cols-[260px,1fr]">
              <PropertyImage
                src={bestNextBuy.property.image}
                alt={bestNextBuy.property.name}
                className="order-2 h-24 w-full object-cover sm:h-44 lg:order-none lg:h-full"
              />
              <div className="order-1 p-4 sm:p-5 lg:order-none">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-success">
                    <Sparkles size={13} /> Best next buy for you
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-text-secondary">
                    {bestNextBuy.readiness.verdict === 'ready' ? 'Can buy' : bestNextBuy.readiness.verdict === 'stretch' ? 'Tight but possible' : 'Needs work'}
                  </span>
                </div>
                <h2 className="section-title text-white text-2xl">{bestNextBuy.property.name}</h2>
                {!settings.compactMode && (
                  <p className="text-text-secondary text-sm mt-2 max-w-3xl">{bestNextBuy.readiness.headline}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => navigate(`/property/${bestNextBuy.property.id}`)} className="btn-primary px-4 py-3 text-sm">
                    Review Deal
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleNextHomeShortlist(bestNextBuy.property.id)}
                    disabled={ownedPropertyIds.has(bestNextBuy.property.id) || (shortlistFull && !nextHomeShortlistIds.includes(bestNextBuy.property.id))}
                    className={`min-h-11 rounded-lg border px-4 py-3 text-sm font-rajdhani font-semibold uppercase tracking-wider ${
                      nextHomeShortlistIds.includes(bestNextBuy.property.id)
                        ? 'border-success/40 bg-success/10 text-success'
                        : ownedPropertyIds.has(bestNextBuy.property.id) || (shortlistFull && !nextHomeShortlistIds.includes(bestNextBuy.property.id))
                          ? 'cursor-not-allowed border-white/10 bg-black/20 text-text-dim'
                          : 'border-cyan-glow/30 bg-cyan-glow/10 text-cyan-glow hover:bg-cyan-glow/20'
                    }`}
                  >
                    {nextHomeShortlistIds.includes(bestNextBuy.property.id)
                      ? 'Pinned to shortlist'
                      : ownedPropertyIds.has(bestNextBuy.property.id)
                        ? 'Current home'
                        : shortlistFull
                          ? 'Shortlist full'
                          : 'Pin as target'}
                  </button>
                  <button onClick={() => handlePresetChange('starter')} className="btn-secondary px-4 py-3 text-sm">
                    Starter List
                  </button>
                </div>
                <div className="grid sm:grid-cols-3 gap-3 mt-4">
                  <HeroFact label="Price" value={formatCompactCurrency(bestNextBuy.property.price)} />
                  <HeroFact label="Cash Needed" value={formatCompactCurrency(bestNextBuy.readiness.cashRequired)} />
                  <HeroFact label="Yield" value={`${bestNextBuy.property.rentalYield}%`} />
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {showGuidedFocus && bestNextBuy && (
          <div className="mb-6">
            <GuidedFocusPanel
              eyebrow="How to read a listing"
              title="Scan deals in this order"
              summary="The buy page is easier when you read one listing the same way every time: what it costs, whether you can reach it, and what can go wrong."
              bullets={[
                'Read Price first. That tells you the size of the move, not whether it is safe.',
                'Read Cash Needed next. That is the quickest signal for whether the deal is realistic this month.',
                'Read Worst Case last. If the downside feels painful, open the deal page before committing.',
              ]}
              termIds={['cpf-oa', 'msr', 'tdsr', 'absd']}
              actions={(
                <>
                  <button type="button" onClick={() => navigate(`/property/${bestNextBuy.property.id}`)} className="btn-primary px-4 py-3 text-xs">
                    Review best deal
                  </button>
                  <button type="button" onClick={() => navigate('/learn')} className="btn-secondary px-4 py-3 text-xs">
                    Learn blockers
                  </button>
                </>
              )}
              footer="Starter-safe mode narrows the catalogue first so new players learn CPF, duties, and monthly safety before advanced inventory."
            />
          </div>
        )}

        <DealComparePanel
          comparison={comparison}
          mode={comparisonMode}
          onOpenProperty={(propertyId) => navigate(`/property/${propertyId}`)}
          onRemove={handleRemoveCompare}
          onClear={() => setComparisonIds([])}
        />

        <GlassCard accentColor="#FFD740" className="mb-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="label-text mb-1 text-[10px] text-warning">Changing board</p>
              <h2 className="section-title text-white">This Month's Market Signals</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Signals rotate with the month so browsing feels like scouting, not a static catalogue.
              </p>
            </div>
            <span className="rounded-full border border-warning/25 bg-warning/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-warning">
              Turn {player.turnCount}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {dynamicSignals.map((signal) => {
              const signaledProperty = catalog.find((property) => property.id === signal.propertyId);
              if (!signaledProperty) return null;
              return (
                <button
                  key={`${signal.propertyId}-${signal.label}`}
                  type="button"
                  onClick={() => navigate(`/property/${signal.propertyId}`)}
                  className="rounded-xl border border-glass-border bg-white/[0.03] p-4 text-left transition-all hover:border-warning/40 hover:bg-warning/10"
                >
                  <p className={`text-[10px] font-mono uppercase tracking-[0.18em] ${signal.tone === 'urgent' ? 'text-danger' : signal.tone === 'value' ? 'text-success' : 'text-warning'}`}>
                    {signal.label}
                  </p>
                  <p className="mt-2 font-rajdhani font-semibold text-white">{signaledProperty.name}</p>
                  <p className="mt-1 text-xs text-text-dim">D{signaledProperty.districtId} | {signaledProperty.listingChannel} | expires in {signal.expiresInMonths} mo</p>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">{signal.detail}</p>
                </button>
              );
            })}
          </div>
        </GlassCard>

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
                  activePreset === option.id
                    ? 'border-cyan-glow/50 bg-cyan-glow/10'
                    : 'border-glass-border bg-white/[0.03] hover:border-white/20'
                }`}
              >
                <p className={`font-rajdhani font-semibold ${activePreset === option.id ? 'text-cyan-glow' : 'text-white'}`}>{option.label}</p>
                <p className="text-text-secondary text-xs mt-1">{option.detail}</p>
              </button>
            ))}
          </div>
          {activePreset === 'starter' && !settings.compactMode && (
            <div className="rounded-2xl border border-cyan-glow/20 bg-cyan-glow/10 p-3">
              <p className="label-text mb-1 text-[9px] text-cyan-glow">Why these listings?</p>
              <p className="text-xs leading-relaxed text-text-secondary">
                Starter-safe mode narrows the catalogue to HDB and EC rungs first, so new players learn CPF, grants, MSR, MOP, and first-home cash checks before advanced investor stock.
              </p>
            </div>
          )}
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
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-glass-border bg-white/[0.04] px-4 py-2.5 text-xs font-rajdhani uppercase tracking-wider text-text-secondary hover:text-white"
          >
            <SlidersHorizontal size={14} />
            {showAdvancedFilters ? 'Hide filters' : 'More filters'}
          </button>
          {showAdvancedFilterControls && (
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
          <span className="text-text-dim"> | shortlist {nextHomeShortlistIds.length}/3</span>
          {!showAllVisibleListings && filtered.length > visibleListings.length && (
            <span className="text-text-dim"> | showing the first {visibleListings.length} to keep browsing readable</span>
          )}
        </p>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleListings.map((property) => {
            const eligibility = evaluatePropertyEligibility({ ...eligibilityInput, propertyType: property.type });
            const readiness = assessDealReadiness({
              player,
              property,
              downPaymentPercent: property.isHdb ? HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT : 25,
              useCpfOrdinary: true,
              financingMode: property.isHdb ? 'hdb-concessionary' : 'bank',
            });
            const selectedForCompare = comparisonIds.includes(property.id);
            const shortlisted = nextHomeShortlistIds.includes(property.id);
            return (
              <PropertyListingCard
                key={property.id}
                property={property}
                readiness={readiness}
                eligibility={eligibility}
                flags={flags}
                signal={dynamicSignals.find((entry) => entry.propertyId === property.id)}
                worstCase={getWorstCaseReadout(property)}
                selectedForCompare={selectedForCompare}
                compareDisabled={comparisonIds.length >= 3 && !selectedForCompare}
                shortlisted={shortlisted}
                shortlistDisabled={ownedPropertyIds.has(property.id) || (shortlistFull && !shortlisted)}
                shortlistFull={shortlistFull}
                ownedPropertyIds={ownedPropertyIds}
                compactMode={settings.compactMode}
                onOpen={(propertyId) => navigate(`/property/${propertyId}`)}
                onToggleCompare={handleToggleCompare}
                onToggleShortlist={toggleNextHomeShortlist}
              />
            );
          })}
        </div>
        {!showAllVisibleListings && filtered.length > visibleListings.length && (
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
