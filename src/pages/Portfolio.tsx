import { useGameStore } from '@/game/useGameStore';
import { districts } from '@/data/districts';
import { achievements } from '@/data/achievements';
import GlassCard from '@/components/GlassCard';
import { Building2, TrendingUp, Award, Target, Home, DollarSign } from 'lucide-react';
import PropertyImage from '@/components/PropertyImage';
import { useNavigate } from 'react-router-dom';
import { selectNetWorth, selectMonthlyOwnershipCosts, selectMonthlyRentalIncome } from '@/engine/selectors';
import { formatCompactCurrency, formatCurrency, formatPercent } from '@/lib/format';
import { describeInvestorRoute } from '@/engine/portfolio';
import { getListingCatalog } from '@/engine/listings';

export default function Portfolio() {
  const { player, toggleRental } = useGameStore();
  const navigate = useNavigate();
  const listingCatalog = getListingCatalog();

  const netWorth = selectNetWorth(player);
  const totalProfit = player.properties.reduce((sum, p) => sum + (p.currentValue - p.purchasePrice), 0) + player.totalPropertySalesProfit;
  const rentalIncome = selectMonthlyRentalIncome(player);
  const ownershipCosts = selectMonthlyOwnershipCosts(player);
  const investorRoute = describeInvestorRoute(player);
  const occupiedCount = player.properties.filter((property) => property.isRented).length;
  const occupancyRate = player.properties.length === 0 ? 0 : Math.round((occupiedCount / player.properties.length) * 100);
  const tenantScores = player.properties.map((property) => property.tenant?.satisfaction).filter((score): score is number => typeof score === 'number');
  const avgTenantSatisfaction = tenantScores.length === 0 ? null : Math.round(tenantScores.reduce((sum, score) => sum + score, 0) / tenantScores.length);
  const openIssues = player.properties.reduce((sum, property) => sum + (property.openMaintenanceIssues?.length ?? 0), 0);
  const activeRenovations = player.properties.filter((property) => property.activeRenovation).length;

  const unlockedAchievements = achievements.filter(a => player.achievements.includes(a.id));

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4 game-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="page-title text-white mb-6">Portfolio</h1>

        <div className="grid md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          <GlassCard accentColor="#00E676">
            <Building2 size={20} className="text-cyan-glow mb-2" />
            <p className="label-text text-text-dim text-[10px]">Total Net Worth</p>
            <p className="font-mono text-xl text-white">{formatCompactCurrency(netWorth)}</p>
          </GlassCard>
          <GlassCard accentColor="#00F0FF">
            <TrendingUp size={20} className="text-success mb-2" />
            <p className="label-text text-text-dim text-[10px]">Unrealized Gain</p>
            <p className="font-mono text-xl" style={{ color: totalProfit >= 0 ? '#00E676' : '#FF1744' }}>
              {totalProfit >= 0 ? '+' : ''}{formatCompactCurrency(totalProfit)}
            </p>
          </GlassCard>
          <GlassCard accentColor="#7C4DFF">
            <Target size={20} className="text-purple-glow mb-2" />
            <p className="label-text text-text-dim text-[10px]">Monthly Rental</p>
            <p className="font-mono text-xl text-cyan-glow">{formatCurrency(rentalIncome)}</p>
          </GlassCard>
          <GlassCard accentColor="#FF9100">
            <DollarSign size={20} className="text-warning mb-2" />
            <p className="label-text text-text-dim text-[10px]">Monthly Carry</p>
            <p className="font-mono text-xl text-warning">{formatCurrency(ownershipCosts)}</p>
          </GlassCard>
          <GlassCard accentColor="#FFD740">
            <Award size={20} className="text-warning mb-2" />
            <p className="label-text text-text-dim text-[10px]">Achievements</p>
            <p className="font-mono text-xl text-white">{unlockedAchievements.length}/{achievements.length}</p>
          </GlassCard>
        </div>

        <GlassCard accentColor={investorRoute.accentColor} className="mb-6">
          <p className="label-text text-text-dim text-[10px] mb-2">Current Route</p>
          <h2 className="section-title text-white mb-2">{investorRoute.label}</h2>
          <p className="text-text-secondary text-sm">{investorRoute.summary}</p>
        </GlassCard>

        {player.properties.length > 0 && (
          <GlassCard accentColor="#00F0FF" className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="label-text text-text-dim text-[10px] mb-1">Operations Health</p>
                <h2 className="section-title text-white">Landlord Control Room</h2>
              </div>
              <div className="text-right">
                <p className="font-mono text-cyan-glow text-xl">{occupancyRate}%</p>
                <p className="text-text-dim text-[10px]">occupancy</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <OpsMetric label="Tenant Satisfaction" value={avgTenantSatisfaction === null ? 'No tenants' : `${avgTenantSatisfaction}/100`} tone={avgTenantSatisfaction !== null && avgTenantSatisfaction < 55 ? 'bad' : 'good'} />
              <OpsMetric label="Open Repairs" value={String(openIssues)} tone={openIssues > 0 ? 'bad' : 'good'} />
              <OpsMetric label="Active Upgrades" value={String(activeRenovations)} tone={activeRenovations > 0 ? 'warn' : 'neutral'} />
              <OpsMetric label="Reserve" value={formatCurrency(player.reserve?.allocatedCash ?? 0)} tone={(player.reserve?.allocatedCash ?? 0) > 0 ? 'good' : 'warn'} />
              <OpsMetric label="Monthly Carry" value={formatCurrency(ownershipCosts)} tone="warn" />
            </div>
          </GlassCard>
        )}

        <h2 className="section-title text-white mb-4">Property Holdings</h2>
        {player.properties.length === 0 ? (
          <GlassCard className="text-center py-8">
            <Building2 size={40} className="text-text-dim mx-auto mb-3" />
            <p className="text-text-secondary">No properties in your portfolio yet.</p>
            <p className="text-text-dim text-sm mt-1">Browse the property market to start building your empire.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3 mb-8">
            {player.properties.map((owned, i) => {
              const property = listingCatalog.find(p => p.id === owned.propertyId);
              const district = property ? districts.find(d => d.id === property.districtId) : null;
              if (!property || !district) return null;

              const gain = owned.currentValue - owned.purchasePrice;
              const gainPercent = (gain / owned.purchasePrice) * 100;
              const carryingCost = (owned.maintenanceCost ?? 0) + (owned.propertyTax ?? 0);
              const occupancyLabel = owned.occupancyStatus ?? (owned.isRented ? 'tenanted' : 'vacant');

              return (
                <GlassCard key={i} className="group">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 cursor-pointer" onClick={() => navigate(`/property/${property.id}`)}>
                      <PropertyImage src={property.image} alt={property.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/property/${property.id}`)}>
                      <div className="flex items-center gap-2">
                        <h4 className="font-rajdhani font-semibold text-white truncate group-hover:text-cyan-glow transition-colors">{property.name}</h4>
                        {owned.isRented && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-rajdhani font-semibold bg-cyan-glow/20 text-cyan-glow shrink-0">
                            RENTED
                          </span>
                        )}
                      </div>
                      <p className="text-text-secondary text-xs">D{district.id} {district.name} | Purchased: {owned.purchaseDate}</p>
                      <p className="text-text-dim text-[10px] mt-0.5">
                        {property.listingChannel} | Carry: {formatCurrency(carryingCost)}/mo | Status: {occupancyLabel}
                      </p>
                      {(owned.conditionScore !== undefined || owned.tenant || (owned.openMaintenanceIssues?.length ?? 0) > 0 || owned.activeRenovation) && (
                        <p className="text-text-dim text-[10px] mt-0.5">
                          Condition: {owned.conditionScore ?? 70}/100
                          {owned.tenant ? ` | Tenant: ${owned.tenant.satisfaction}/100` : ''}
                          {(owned.openMaintenanceIssues?.length ?? 0) > 0 ? ` | Repairs: ${owned.openMaintenanceIssues?.length}` : ''}
                          {owned.activeRenovation ? ` | Upgrade: ${owned.activeRenovation.remainingMonths} mo left` : ''}
                        </p>
                      )}
                      {!owned.isRented && (owned.vacancyMonths ?? 0) > 0 && (
                        <p className="text-warning text-[10px] mt-0.5">Vacant for {owned.vacancyMonths} month(s)</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-white text-sm">{formatCompactCurrency(owned.currentValue)}</p>
                      <p className={`font-mono text-xs ${gain >= 0 ? 'text-success' : 'text-danger'}`}>
                        {gain >= 0 ? '+' : ''}{formatPercent(gainPercent, 1)}
                      </p>
                      <div className="flex gap-1 mt-1 justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleRental(i); }}
                          title={owned.isRented ? 'Stop renting' : 'Rent out'}
                          className={`p-1 rounded ${owned.isRented ? 'bg-warning/20 text-warning hover:bg-warning/30' : 'bg-cyan-glow/20 text-cyan-glow hover:bg-cyan-glow/30'} transition-colors`}
                        >
                          <Home size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/property/${property.id}`); }}
                          title="Manage / Sell"
                          className="p-1 rounded bg-danger/20 text-danger hover:bg-danger/30 transition-colors"
                        >
                          <DollarSign size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        <h2 className="section-title text-white mb-4">Achievements</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map((a) => {
            const unlocked = player.achievements.includes(a.id);
            return (
              <GlassCard key={a.id} className={unlocked ? 'border-purple-glow/30' : 'opacity-50'} accentColor={unlocked ? '#7C4DFF' : undefined}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${unlocked ? 'bg-purple-glow/20' : 'bg-white/5'}`}>
                    <Award size={16} className={unlocked ? 'text-purple-glow' : 'text-text-dim'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-rajdhani font-semibold text-sm truncate ${unlocked ? 'text-white' : 'text-text-dim'}`}>
                      {a.name}
                    </h4>
                    <p className="text-text-dim text-[10px] truncate">{a.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-[10px]" style={{ color: unlocked ? '#FFD700' : '#4A5568' }}>
                      {a.points}pts
                    </p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OpsMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}) {
  const toneClass = {
    good: 'text-success',
    warn: 'text-warning',
    bad: 'text-danger',
    neutral: 'text-white',
  } satisfies Record<typeof tone, string>;

  return (
    <div className="rounded-xl border border-glass-border bg-white/[0.03] p-3">
      <p className="label-text text-text-dim text-[10px]">{label}</p>
      <p className={`font-mono text-sm mt-1 ${toneClass[tone]}`}>{value}</p>
    </div>
  );
}
