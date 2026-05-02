import { useParams, useNavigate } from 'react-router-dom';
import { properties, propertyTypeInfo } from '@/data/properties';
import { districts } from '@/data/districts';
import { useGameStore } from '@/game/useGameStore';
import GlassCard from '@/components/GlassCard';
import { ArrowLeft, MapPin, Bed, Bath, Maximize, Calendar, Train, ShoppingBag, Home, DollarSign, CheckCircle } from 'lucide-react';
import PropertyImage from '@/components/PropertyImage';
import { useState } from 'react';
import { formatCompactCurrency, formatCurrency, formatPercent } from '@/lib/format';
import { getDownPaymentAmount, validatePurchase } from '@/engine/purchase';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { player, market, buyProperty, sellProperty, toggleRental } = useGameStore();
  const [downPaymentPercent, setDownPaymentPercent] = useState(25);
  const [showSellConfirm, setShowSellConfirm] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [useCpfOrdinary, setUseCpfOrdinary] = useState(true);

  const property = properties.find(p => p.id === id);
  const district = property ? districts.find(d => d.id === property.districtId) : null;

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
  const downPayment = getDownPaymentAmount(property.price, downPaymentPercent);
  const cpfOrdinaryUsed = useCpfOrdinary ? Math.min(player.cpfOrdinary, downPayment) : 0;
  const validation = validatePurchase(player, property, downPayment, cpfOrdinaryUsed, market.interestRate);
  const extraReasons = validation.reasons.filter((reason) => reason.code !== 'insufficient_cash');
  const visibleMessages = Array.from(
    new Set([
      ...(validation.shortfall > 0 ? [`You need ${formatCurrency(validation.shortfall)} more`] : []),
      ...extraReasons.map((reason) => reason.message),
      ...(purchaseError ? [purchaseError] : []),
    ])
  );

  const handleBuy = () => {
    setPurchaseError(null);
    if (!validation.canBuy) {
      setPurchaseError(validation.reasons[0]?.message ?? 'This property cannot be purchased right now.');
      return;
    }

    const result = buyProperty(property.id, validation.downPayment, validation.cpfOrdinaryUsed);
    if (result.ok) {
      navigate('/portfolio');
      return;
    }

    if (import.meta.env.DEV) {
      console.error('Purchase rejected after enabled validation path.', {
        propertyId: property.id,
        downPayment: validation.downPayment,
        result,
      });
    }
    setPurchaseError(result.message);
  };

  const handleSell = () => {
    if (!isOwned) return;
    const result = sellProperty(ownedIndex);
    if (result.ok) {
      navigate('/portfolio');
    }
  };

  const handleToggleRental = () => {
    if (!isOwned) return;
    toggleRental(ownedIndex);
  };

  const gain = ownedProperty ? ownedProperty.currentValue - ownedProperty.purchasePrice : 0;
  const gainPercent = ownedProperty ? (gain / ownedProperty.purchasePrice) * 100 : 0;

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4 game-screen">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-secondary hover:text-cyan-glow transition-colors mb-4">
          <ArrowLeft size={18} />
          <span className="font-rajdhani text-sm uppercase">Back</span>
        </button>

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
            </div>
            <h1 className="page-title text-white text-2xl md:text-4xl">{property.name}</h1>
            <p className="text-text-secondary text-sm flex items-center gap-1 mt-1">
              <MapPin size={14} /> {district.name}
            </p>
          </div>
        </div>

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
          </div>

          <div>
            {isOwned && ownedProperty ? (
              <GlassCard accentColor="#00E676" className="sticky top-4">
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
                        {ownedProperty.isRented ? `Rented (${formatCurrency(ownedProperty.monthlyRental)}/mo)` : 'Vacant'}
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
                        Sell for {formatCurrency(ownedProperty.currentValue)}?
                        {associatedLoan && !associatedLoan.isPaid && (
                          <span className="block text-text-dim mt-1">Loan will be paid off automatically.</span>
                        )}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setShowSellConfirm(false)} className="flex-1 btn-secondary text-xs py-2">Cancel</button>
                        <button onClick={handleSell} className="flex-1 btn-danger text-xs py-2">Confirm Sell</button>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            ) : (
              <GlassCard accentColor="#00E676" className="sticky top-4">
                <h3 className="section-title text-white mb-4">Purchase</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Price</span>
                    <span className="font-mono text-white text-lg">{formatCompactCurrency(property.price)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">PSF</span>
                    <span className="font-mono text-white">{formatCurrency(property.psf)}</span>
                  </div>

                  <div className="slider-block">
                    <label className="label-text text-text-dim text-xs block mb-2">
                      Down Payment: {formatPercent(downPaymentPercent)}
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      value={downPaymentPercent}
                      onChange={(e) => {
                        setDownPaymentPercent(Number(e.target.value));
                        setPurchaseError(null);
                      }}
                      className="game-slider w-full accent-cyan-glow"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-text-dim mt-1">
                      <span>5%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="border-t border-divider pt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-text-secondary text-sm">Down Payment</span>
                      <span className="font-mono text-cyan-glow">{formatCurrency(validation.downPayment)}</span>
                    </div>
                    <label className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="text-text-secondary">Use CPF OA</span>
                      <input
                        type="checkbox"
                        checked={useCpfOrdinary}
                        onChange={(e) => {
                          setUseCpfOrdinary(e.target.checked);
                          setPurchaseError(null);
                        }}
                        className="h-4 w-4 accent-cyan-glow"
                      />
                    </label>
                    {useCpfOrdinary && (
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-text-secondary text-sm">CPF OA Applied</span>
                        <span className="font-mono text-success">-{formatCurrency(cpfOrdinaryUsed)}</span>
                      </div>
                    )}
                    {validation.mortgageAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary text-sm">Loan Amount</span>
                        <span className="font-mono text-warning">{formatCurrency(validation.mortgageAmount)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-divider pt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-text-secondary text-sm">BSD (Stamp Duty)</span>
                      <span className="font-mono text-text-dim">{formatCurrency(validation.bsd)}</span>
                    </div>
                    {validation.absd > 0 && (
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-text-secondary text-sm">ABSD ({player.properties.length > 0 ? '2nd+' : 'Additional'})</span>
                        <span className="font-mono text-danger">{formatCurrency(validation.absd)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-semibold">Total Upfront</span>
                      <span className="font-mono text-warning">{formatCurrency(validation.totalUpfront)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-white text-sm font-semibold">Cash Required</span>
                      <span className="font-mono text-cyan-glow">{formatCurrency(validation.cashRequired)}</span>
                    </div>
                  </div>

                  <div className="border-t border-divider pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-semibold">Your Cash</span>
                      <span className="font-mono text-white">{formatCurrency(player.cash)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-text-secondary text-sm">CPF OA Balance</span>
                      <span className="font-mono text-text-dim">{formatCurrency(player.cpfOrdinary)}</span>
                    </div>
                  </div>
                </div>

                <button onClick={handleBuy} disabled={!validation.canBuy} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
                  {validation.canBuy ? 'Buy Property' : validation.shortfall > 0 ? 'Insufficient Cash' : 'Cannot Buy Yet'}
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
