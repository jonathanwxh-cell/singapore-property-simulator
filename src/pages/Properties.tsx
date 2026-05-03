import { useState } from 'react';
import { properties, propertyTypeInfo } from '@/data/properties';
import { districts } from '@/data/districts';
import GlassCard from '@/components/GlassCard';
import { Search, MapPin, Bed, Bath, Maximize } from 'lucide-react';
import PropertyImage from '@/components/PropertyImage';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/game/useGameStore';
import { deriveEligibilityFlags, evaluatePropertyEligibility } from '@/engine/eligibility';
import EligibilityBadge from '@/components/EligibilityBadge';

export default function Properties() {
  const navigate = useNavigate();
  const { player } = useGameStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  const propertyTypes = Object.keys(propertyTypeInfo);
  const eligibilityInput = {
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
  };
  const flags = deriveEligibilityFlags(eligibilityInput);

  const filtered = properties.filter(p => {
    const district = districts.find(d => d.id === p.districtId);
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      district?.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    const matchesRegion = regionFilter === 'all' || district?.region === regionFilter;
    return matchesSearch && matchesType && matchesRegion;
  });

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="page-title text-white mb-6">Property Browser</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
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
        </div>

        {/* Results count */}
        <p className="text-text-secondary text-sm mb-4">{filtered.length} properties found</p>

        {/* Property Grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((property) => {
            const district = districts.find(d => d.id === property.districtId);
            const typeInfo = propertyTypeInfo[property.type];
            const eligibility = evaluatePropertyEligibility({ ...eligibilityInput, propertyType: property.type });
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
                  <div className="absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-rajdhani font-semibold uppercase"
                    style={{ backgroundColor: typeInfo.color + '30', color: typeInfo.color, border: `1px solid ${typeInfo.color}50` }}>
                    {property.type}
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
                  <span className="font-mono text-cyan-glow font-bold">S${(property.price / 1000000).toFixed(2)}M</span>
                  <span className="text-success text-xs font-mono">{property.rentalYield}% yield</span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
