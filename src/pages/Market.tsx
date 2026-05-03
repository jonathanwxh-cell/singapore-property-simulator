import { useGameStore } from '@/game/useGameStore';
import { districts, heatmapColors } from '@/data/districts';
import { eras } from '@/data/eras';
import GlassCard from '@/components/GlassCard';
import PropertyImage from '@/components/PropertyImage';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCompactCurrency, formatCurrency, formatPercent, formatRate } from '@/lib/format';
import { buildDistrictOpportunityCards, buildListingSummary, getMarketMovers } from '@/engine/listings';

export default function Market() {
  const { market } = useGameStore();
  const summary = buildListingSummary();
  const movers = getMarketMovers();
  const opportunityCards = buildDistrictOpportunityCards()
    .filter((card) => card.listingCount > 0)
    .sort((a, b) => b.listingCount - a.listingCount || b.averageYield - a.averageYield)
    .slice(0, 8);

  const marketCondition = market.lastEvent === 'boom' ? 'Bull Run' : market.lastEvent === 'crash' ? 'Correction' : 'Stable';
  const newsFeed = market.newsFeed ?? [];

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4 game-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="page-title text-white mb-6">Market Overview</h1>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <GlassCard>
            <p className="label-text text-text-dim text-[10px]">Price Index</p>
            <p className="font-mono text-2xl text-white mt-1">{market.priceIndex.toFixed(1)}</p>
            <p className={`text-xs font-mono mt-1 ${market.lastEvent === 'crash' ? 'text-danger' : market.lastEvent === 'boom' ? 'text-success' : 'text-text-secondary'}`}>
              {market.lastEvent === 'boom' ? <TrendingUp size={12} className="inline mr-1" /> : market.lastEvent === 'crash' ? <TrendingDown size={12} className="inline mr-1" /> : <Minus size={12} className="inline mr-1" />}
              {marketCondition} {formatSignedPercent(market.monthlyPriceChangePct ?? 0)}
            </p>
          </GlassCard>
          <GlassCard>
            <p className="label-text text-text-dim text-[10px]">Rental Index</p>
            <p className="font-mono text-2xl text-white mt-1">{market.rentalIndex.toFixed(1)}</p>
            <p className="text-text-secondary text-xs mt-1">{formatSignedPercent(market.monthlyRentalChangePct ?? 0)} vs last month</p>
          </GlassCard>
          <GlassCard>
            <p className="label-text text-text-dim text-[10px]">Interest Rate</p>
            <p className="font-mono text-2xl text-warning mt-1">{formatPercent(market.interestRate, 2)}</p>
            <p className="text-text-secondary text-xs mt-1">{formatSignedPercent(market.monthlyInterestRateChangePct ?? 0)} pts this month</p>
          </GlassCard>
          <GlassCard>
            <p className="label-text text-text-dim text-[10px]">Volatility</p>
            <p className="font-mono text-2xl text-purple-glow mt-1">{formatPercent(market.volatility * 100, 1)}</p>
            <p className="text-text-secondary text-xs mt-1">Index</p>
          </GlassCard>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {movers.map((mover) => (
            <GlassCard key={mover.title} accentColor="#00F0FF">
              <p className="label-text text-text-dim text-[10px]">{mover.title}</p>
              <p className="font-rajdhani text-white text-lg mt-1">{mover.districtName}</p>
              <p className="text-text-secondary text-xs mt-1">{mover.detail}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="mb-6" accentColor="#00F0FF">
          <h3 className="section-title text-white mb-2">Latest Headline</h3>
          <p className="text-white font-medium">{market.lastHeadline ?? 'No headline yet.'}</p>
          <p className="text-text-secondary text-sm mt-2">{market.lastSummary ?? 'Advance a turn to generate a fresh market update.'}</p>
        </GlassCard>

        <GlassCard className="mb-6">
          <h3 className="section-title text-white mb-4">Market News Feed</h3>
          <div className="space-y-3">
            {newsFeed.length === 0 ? (
              <p className="text-text-secondary text-sm">Advance turns to build a living market tape with rates, policy, demand, and infrastructure stories.</p>
            ) : (
              newsFeed.map((item) => (
                <div key={item.id} className="rounded-lg border border-glass-border bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded font-rajdhani uppercase bg-cyan-glow/10 text-cyan-glow">
                        {item.category}
                      </span>
                      <span className="text-text-dim text-[10px]">Turn {item.turn}</span>
                    </div>
                    <span className={`text-xs font-mono ${item.priceChangePct > 0 ? 'text-success' : item.priceChangePct < 0 ? 'text-danger' : 'text-text-secondary'}`}>
                      {formatSignedPercent(item.priceChangePct)}
                    </span>
                  </div>
                  <p className="text-white font-medium">{item.headline}</p>
                  <p className="text-text-secondary text-sm mt-1">{item.detail}</p>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard className="mb-6">
          <h3 className="section-title text-white mb-4">District Price Heatmap</h3>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {districts.map((d) => {
              const color = heatmapColors[d.heatmapTier];
              const avgPrice = Math.round((d.avgPSFRange[0] + d.avgPSFRange[1]) / 2);
              return (
                <div key={d.id} className="rounded-lg p-2 text-center cursor-pointer hover:scale-105 transition-transform" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}50` }} title={`D${d.id} ${d.name}: ${formatCurrency(avgPrice)} PSF`}>
                  <p className="font-mono text-[10px]" style={{ color }}>D{d.id}</p>
                  <p className="font-mono text-[10px] text-white">{formatCurrency(avgPrice)}</p>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-[10px]">
            {Object.entries(heatmapColors).map(([tier, color]) => (
              <div key={tier} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                <span className="text-text-secondary">{tier}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="section-title text-white">District Opportunities</h3>
              <p className="text-text-secondary text-xs mt-1">
                {summary.totalListings} active listings across {summary.coveredDistrictCount} districts
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-cyan-glow text-sm">{summary.byChannel['New Launch']} new launches</p>
              <p className="font-mono text-warning text-xs">
                {summary.byChannel['Auction'] + summary.byChannel['Distressed'] + summary.byChannel['Off-Market'] + summary.byChannel['Signature']} special listings
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {opportunityCards.map((card) => (
              <div key={card.districtId} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-rajdhani text-white text-sm">D{card.districtId} {card.districtName}</p>
                    <p className="text-text-dim text-[10px] mt-0.5">{card.region} | {card.opportunity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-cyan-glow text-sm">{card.listingCount} listings</p>
                    <p className="font-mono text-success text-[10px]">{card.averageYield}% avg yield</p>
                  </div>
                </div>
                <p className="text-text-secondary text-xs mt-3">
                  Average ticket: {formatCompactCurrency(card.averagePrice)}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>

        <h3 className="section-title text-white mb-4">Historical Eras</h3>
        <div className="space-y-3">
          {eras.map((era) => (
            <GlassCard key={era.id} className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-void-navy">
                <PropertyImage src={era.image} alt={era.name} className="w-full h-full object-cover opacity-60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-rajdhani font-semibold text-white truncate">{era.name}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-rajdhani uppercase ${
                    era.marketCondition === 'boom' ? 'bg-success/20 text-success' :
                    era.marketCondition === 'recession' ? 'bg-danger/20 text-danger' :
                    era.marketCondition === 'recovery' ? 'bg-neon-blue/20 text-neon-blue' :
                    'bg-warning/20 text-warning'
                  }`}>
                    {era.marketCondition}
                  </span>
                </div>
                <p className="text-text-secondary text-xs mt-0.5 line-clamp-2">{era.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-xs text-cyan-glow">{formatRate(era.interestRate, 1)}</p>
                <p className="text-text-dim text-[10px]">Interest</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatSignedPercent(value: number): string {
  if (Math.abs(value) < 0.05) return '0.0%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}
