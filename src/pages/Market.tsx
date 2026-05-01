import { useGameStore } from '@/game/useGameStore';
import { districts, heatmapColors } from '@/data/districts';
import { eras } from '@/data/eras';
import GlassCard from '@/components/GlassCard';
import PropertyImage from '@/components/PropertyImage';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatPercent, formatRate } from '@/lib/format';

export default function Market() {
  const { market } = useGameStore();

  const marketCondition = market.lastEvent === 'boom' ? 'Bull Run' : market.lastEvent === 'crash' ? 'Correction' : 'Stable';

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4 game-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="page-title text-white mb-6">Market Overview</h1>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <GlassCard>
            <p className="label-text text-text-dim text-[10px]">Price Index</p>
            <p className="font-mono text-2xl text-white mt-1">{market.priceIndex.toFixed(1)}</p>
            <p className="text-success text-xs font-mono mt-1">
              {market.lastEvent === 'boom' ? <TrendingUp size={12} className="inline mr-1" /> : market.lastEvent === 'crash' ? <TrendingDown size={12} className="inline mr-1" /> : <Minus size={12} className="inline mr-1" />}
              {marketCondition}
            </p>
          </GlassCard>
          <GlassCard>
            <p className="label-text text-text-dim text-[10px]">Rental Index</p>
            <p className="font-mono text-2xl text-white mt-1">{market.rentalIndex.toFixed(1)}</p>
            <p className="text-text-secondary text-xs mt-1">vs last month</p>
          </GlassCard>
          <GlassCard>
            <p className="label-text text-text-dim text-[10px]">Interest Rate</p>
            <p className="font-mono text-2xl text-warning mt-1">{formatPercent(market.interestRate, 2)}</p>
            <p className="text-text-secondary text-xs mt-1">p.a.</p>
          </GlassCard>
          <GlassCard>
            <p className="label-text text-text-dim text-[10px]">Volatility</p>
            <p className="font-mono text-2xl text-purple-glow mt-1">{formatPercent(market.volatility * 100, 1)}</p>
            <p className="text-text-secondary text-xs mt-1">Index</p>
          </GlassCard>
        </div>

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
