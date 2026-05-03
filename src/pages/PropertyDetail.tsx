import { useParams, useNavigate } from 'react-router-dom';
import { properties, propertyTypeInfo } from '@/data/properties';
import { districts } from '@/data/districts';
import { useGameStore } from '@/game/useGameStore';
import GlassCard from '@/components/GlassCard';
import { ArrowLeft, MapPin, Bed, Bath, Maximize, Calendar, Train, ShoppingBag, Home, DollarSign, CheckCircle } from 'lucide-react';
import PropertyImage from '@/components/PropertyImage';
import { useState } from 'react';
import { calculateBSD, calculateABSD } from '@/engine/stampDuty';
import { getLtvCap } from '@/engine/ltv';
import EligibilityBadge from '@/components/EligibilityBadge';
import { deriveEligibilityFlags, evaluatePropertyEligibility } from '@/engine/eligibility';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { player, buyProperty, sellProperty, toggleRental } = useGameStore();
  const [downPaymentPercent, setDownPaymentPercent] = useState(25);
  const [showSellConfirm, setShowSellConfirm] = useState(false);
  const [useCpfOrdinary, setUseCpfOrdinary] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const property = properties.find(p => p.id === id);
  const district = property ? districts.find(d => d.id === property.districtId) : null;

  // Check if player already owns this property
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
  const activeHousingLoans = player.loans.filter(l => l.type === 'mortgage' && !l.isPaid).length;
  const minDownPaymentPercent = Math.round((1 - getLtvCap(activeHousingLoans)) * 100);
  const effectiveDownPaymentPercent = Math.max(downPaymentPercent, minDownPaymentPercent);
  const downPayment = Math.round(property.price * (effectiveDownPaymentPercent / 100));
  const loanAmount = property.price - downPayment;
  const bsd = calculateBSD(property.price);
  const absd = calculateABSD(property.price, player.properties.length);
  const totalUpfront = downPayment + bsd + absd;
  const cpfEligible = !property.type.startsWith('Commercial');
  const cpfApplied = cpfEligible && useCpfOrdinary ? Math.min(player.cpfOrdinary, totalUpfront) : 0;
  const cashRequired = Math.max(0, totalUpfront - cpfApplied);
  const eligibilityFlags = deriveEligibilityFlags({
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
  });
  const eligibility = evaluatePropertyEligibility({
    propertyType: property.type,
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
  });
  const eligibilityBlocked = Boolean(eligibility.blockedReason);
  const canAfford = player.cash >= cashRequired && !isOwned && !eligibilityBlocked;

  const handleBuy = () => {
    if (isOwned) return;
    if (eligibilityBlocked) {
      setActionError(eligibility.blockedReason);
      return;
    }
    const result = buyProperty(property.id, downPayment, cpfApplied);
    if (result.ok) {
      setActionError(null);
      navigate('/properties');
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

  const gain = ownedProperty ? ownedProperty.currentValue - ownedProperty.purchasePrice : 0;
  const gainPercent = ownedProperty ? (gain / ownedProperty.purchasePrice) * 100 : 0;

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-secondary hover:text-cyan-glow transition-colors mb-4">
          <ArrowLeft size={18} />
          <span className="font-rajdhani text-sm uppercase">Back</span>
        </button>

        {/* Hero Image */}
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
                  Rented Out
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Details */}
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

            {/* Market Analysis */}
            <GlassCard accentColor="#FF9100">
              <h3 className="section-title text-white mb-4">Market Analysis</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="label-text text-text-dim text-[10px]">Avg PSF (District)</p>
                  <p className="font-mono text-white text-lg">S${district.avgPSFRange[0]}-{district.avgPSFRange[1]}</p>
                </div>
                <div className="text-center">
                  <p className="label-text text-text-dim text-[10px]">Rental Yield</p>
                  <p className="font-mono text-success text-lg">{property.rentalYield}%</p>
                </div>
                <div className="text-center">
                  <p className="label-text text-text-dim text-[10px]">Est. Monthly Rent</p>
                  <p className="font-mono text-cyan-glow text-lg">S${Math.round(property.price * property.rentalYield / 100 / 12).toLocaleString()}</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right: Action Panel */}
          <div>
            {isOwned && ownedProperty ? (
              /* OWNED: Management Panel */
              <GlassCard accentColor="#00E676" className="sticky top-4">
                <h3 className="section-title text-white mb-4">Manage Property</h3>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Current Value</span>
                    <span className="font-mono text-white text-lg">S${(ownedProperty.currentValue / 1000000).toFixed(2)}M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Purchase Price</span>
                    <span className="font-mono text-text-dim">S${(ownedProperty.purchasePrice / 1000000).toFixed(2)}M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Gain/Loss</span>
                    <span className={`font-mono ${gain >= 0 ? 'text-success' : 'text-danger'}`}>
                      {gain >= 0 ? '+' : ''}S${(gain / 1000).toFixed(1)}K ({gain >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Est. Monthly Rent</span>
                    <span className="font-mono text-cyan-glow">S${ownedProperty.monthlyRental.toLocaleString()}</span>
                  </div>
                  {associatedLoan && !associatedLoan.isPaid && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Loan Balance</span>
                      <span className="font-mono text-warning">S${associatedLoan.remainingBalance.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="border-t border-divider pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary text-sm">Status</span>
                      <span className={`font-mono text-xs ${ownedProperty.isRented ? 'text-cyan-glow' : 'text-text-dim'}`}>
                        {ownedProperty.isRented ? `Rented (S$${ownedProperty.monthlyRental.toLocaleString()}/mo)` : 'Vacant'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleToggleRental}
                    className={`w-full py-3 rounded-lg font-rajdhani font-semibold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                      ownedProperty.isRented
                        ? 'bg-warning/20 text-warning border border-warning/40 hover:bg-warning/30'
                        : 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/40 hover:bg-cyan-glow/30'
                    }`}
                  >
                    <Home size={16} />
                    {ownedProperty.isRented ? 'Stop Renting' : 'Rent Out'}
                  </button>

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
                        Sell for S${ownedProperty.currentValue.toLocaleString()}?
                        {associatedLoan && !associatedLoan.isPaid && (
                          <span className="block text-text-dim mt-1">Loan will be paid off automatically.</span>
                        )}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowSellConfirm(false)}
                          className="flex-1 btn-secondary text-xs py-2"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSell}
                          className="flex-1 btn-danger text-xs py-2"
                        >
                          Confirm Sell
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            ) : (
              /* NOT OWNED: Purchase Panel */
              <GlassCard accentColor="#00E676" className="sticky top-4">
                <h3 className="section-title text-white mb-4">Purchase</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Price</span>
                    <span className="font-mono text-white text-lg">S${(property.price / 1000000).toFixed(2)}M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">PSF</span>
                    <span className="font-mono text-white">S${property.psf.toLocaleString()}</span>
                  </div>

                  {/* Down Payment Slider */}
                  <div>
                    <label className="label-text text-text-dim text-xs block mb-2">
                      Down Payment: {effectiveDownPaymentPercent}%
                    </label>
                    <input
                      type="range"
                      min={minDownPaymentPercent}
                      max={100}
                      value={effectiveDownPaymentPercent}
                      onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                      className="w-full accent-cyan-glow"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-text-dim mt-1">
                      <span>{minDownPaymentPercent}%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="border-t border-divider pt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-text-secondary text-sm">Down Payment</span>
                      <span className="font-mono text-cyan-glow">S${downPayment.toLocaleString()}</span>
                    </div>
                    {loanAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary text-sm">Loan Amount</span>
                        <span className="font-mono text-warning">S${loanAmount.toLocaleString()}</span>
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
                      <span className="text-text-secondary text-sm">BSD (Stamp Duty)</span>
                      <span className="font-mono text-text-dim">S${bsd.toLocaleString()}</span>
                    </div>
                    {absd > 0 && (
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-text-secondary text-sm">ABSD ({player.properties.length > 0 ? '2nd+' : 'Additional'})</span>
                        <span className="font-mono text-danger">S${absd.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-semibold">Total Upfront</span>
                      <span className="font-mono text-warning">S${totalUpfront.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-t border-divider pt-3">
                    {cpfApplied > 0 && (
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-text-secondary text-sm">CPF OA Applied</span>
                        <span className="font-mono text-success">-S${cpfApplied.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-semibold">Cash Required</span>
                      <span className="font-mono text-white">S${cashRequired.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-text-secondary text-sm">Your Cash</span>
                      <span className="font-mono text-white">S${player.cash.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBuy}
                  disabled={!canAfford}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {eligibilityBlocked ? 'Not Eligible Yet' : canAfford ? 'Buy Property' : 'Insufficient Funds'}
                </button>

                {!canAfford && !eligibilityBlocked && (
                  <p className="text-danger text-xs text-center mt-2">
                    You need S${Math.max(0, cashRequired - player.cash).toLocaleString()} more cash
                  </p>
                )}
                {eligibilityBlocked && eligibility.blockedReason && (
                  <p className="text-danger text-xs text-center mt-2">{eligibility.blockedReason}</p>
                )}

                {actionError && (
                  <p className="text-danger text-xs text-center mt-2">{actionError}</p>
                )}
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-white/5">
      <Icon size={18} className="text-cyan-glow mx-auto mb-1" />
      <p className="label-text text-text-dim text-[10px] mb-0.5">{label}</p>
      <p className="font-mono text-white text-sm">{value}</p>
    </div>
  );
}
