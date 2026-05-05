import { useGameStore } from '@/game/useGameStore';
import { districts } from '@/data/districts';
import { achievements } from '@/data/achievements';
import GlassCard from '@/components/GlassCard';
import ProgressivePanel from '@/components/ProgressivePanel';
import { Building2, TrendingUp, Award, Target, Home, DollarSign, ShieldAlert, FileClock } from 'lucide-react';
import PropertyImage from '@/components/PropertyImage';
import RunArcPanel from '@/components/RunArcPanel';
import { useNavigate } from 'react-router-dom';
import { selectNetWorth, selectMonthlyOwnershipCosts, selectMonthlyRentalIncome } from '@/engine/selectors';
import { formatCompactCurrency, formatCurrency, formatPercent } from '@/lib/format';
import { describeInvestorRoute, describePortfolioHoldingOperations } from '@/engine/portfolio';
import { getListingCatalog } from '@/engine/listings';
import { getLandlordOpsSummary } from '@/engine/propertyOperations';

export default function Portfolio() {
  const { player, toggleRental } = useGameStore();
  const navigate = useNavigate();
  const listingCatalog = getListingCatalog();

  const netWorth = selectNetWorth(player);
  const totalProfit = player.properties.reduce((sum, p) => sum + (p.currentValue - p.purchasePrice), 0) + player.totalPropertySalesProfit;
  const rentalIncome = selectMonthlyRentalIncome(player);
  const ownershipCosts = selectMonthlyOwnershipCosts(player);
  const investorRoute = describeInvestorRoute(player);
  const landlordOps = getLandlordOpsSummary(player);
  const activeRenovations = player.properties.filter((property) => property.activeRenovation).length;
  const showOperationsArc = player.runRouteId === 'heartland-landlord' || player.runRouteId === 'commercial-operator';
  const portfolioRisk = landlordOps.openIssueCount > 0
    ? `${landlordOps.openIssueCount} repair issue(s)`
    : landlordOps.expiringLeaseCount > 0
      ? `${landlordOps.expiringLeaseCount} lease decision(s)`
      : landlordOps.unprotectedRisk > 0
        ? `${formatCurrency(landlordOps.unprotectedRisk)} reserve gap`
        : 'No urgent ops risk';
  const portfolioAction = landlordOps.openIssueCount > 0 || landlordOps.expiringLeaseCount > 0
    ? 'Review property operations before the next month.'
    : player.properties.length === 0
      ? 'Buy your first property to unlock landlord operations.'
      : 'Portfolio is stable. Consider upgrades, reserves, or the next acquisition.';

  const unlockedAchievements = achievements.filter(a => player.achievements.includes(a.id));

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4 game-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="page-title text-white">Own Portfolio</h1>
          <p className="text-text-secondary mt-1 font-rajdhani">
            Attention first, then deeper landlord operations, achievements, and long-term holdings.
          </p>
        </div>

        <GlassCard accentColor={landlordOps.openIssueCount > 0 ? '#FF1744' : landlordOps.expiringLeaseCount > 0 ? '#FFD740' : '#00E676'} className="mb-6">
          <div className="grid gap-4 lg:grid-cols-[1fr,220px]">
            <div>
              <p className="label-text text-text-dim text-[10px] mb-1">Portfolio Health</p>
              <h2 className="section-title text-white">
                {player.properties.length === 0
                  ? 'No owned property yet'
                  : landlordOps.openIssueCount > 0
                    ? 'Repairs need attention'
                    : landlordOps.expiringLeaseCount > 0
                      ? 'Lease decision coming up'
                      : 'Holdings are stable'}
              </h2>
              <p className="text-text-secondary text-sm mt-2 max-w-3xl">{portfolioAction}</p>
            </div>
            <div className="rounded-2xl border border-glass-border bg-black/20 p-4">
              <p className="label-text text-text-dim text-[10px]">Main Risk</p>
              <p className={`font-mono text-lg mt-1 ${portfolioRisk === 'No urgent ops risk' ? 'text-success' : 'text-warning'}`}>{portfolioRisk}</p>
              <button
                onClick={() => player.properties[0] ? navigate(`/property/${player.properties[0].propertyId}`) : navigate('/properties')}
                className="btn-secondary w-full text-xs py-2 mt-4"
              >
                {player.properties.length === 0 ? 'Find First Buy' : 'Manage Holding'}
              </button>
            </div>
          </div>
        </GlassCard>

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
          <p className="label-text text-text-dim text-[10px] mb-2">Portfolio Style</p>
          <h2 className="section-title text-white mb-2">{investorRoute.label}</h2>
          <p className="text-text-secondary text-sm">{investorRoute.summary}</p>
        </GlassCard>

        {showOperationsArc && (
          <div className="mb-6">
            <RunArcPanel player={player} compact onOpenRoute={(route) => navigate(route)} />
          </div>
        )}

        {player.properties.length > 0 && (
          <GlassCard accentColor="#00F0FF" className="mb-6 overflow-hidden">
            <div className="grid lg:grid-cols-[1fr,260px] gap-5">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="label-text text-text-dim text-[10px] mb-1">Operations Health</p>
                    <h2 className="section-title text-white">Landlord Ops Command</h2>
                    <p className="text-text-secondary text-sm mt-1">
                      Lease renewals, repairs, and reserve gaps are now the active landlord loop.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-cyan-glow text-xl">{landlordOps.occupancyRate}%</p>
                    <p className="text-text-dim text-[10px]">occupancy</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 xl:grid-cols-6 gap-3">
                  <OpsMetric
                    label="Tenant Happiness"
                    value={landlordOps.averageTenantSatisfaction === null ? 'No tenants' : `${landlordOps.averageTenantSatisfaction}/100`}
                    tone={landlordOps.averageTenantSatisfaction !== null && landlordOps.averageTenantSatisfaction < 55 ? 'bad' : 'good'}
                  />
                  <OpsMetric
                    label="Open Repairs"
                    value={`${landlordOps.openIssueCount}${landlordOps.urgentIssueCount > 0 ? ` / ${landlordOps.urgentIssueCount} urgent` : ''}`}
                    tone={landlordOps.openIssueCount > 0 ? 'bad' : 'good'}
                  />
                  <OpsMetric
                    label="Leases Due"
                    value={String(landlordOps.expiringLeaseCount)}
                    tone={landlordOps.expiringLeaseCount > 0 ? 'warn' : 'good'}
                  />
                  <OpsMetric label="Active Upgrades" value={String(activeRenovations)} tone={activeRenovations > 0 ? 'warn' : 'neutral'} />
                  <OpsMetric label="Reserve Gap" value={formatCurrency(landlordOps.unprotectedRisk)} tone={landlordOps.unprotectedRisk > 0 ? 'bad' : 'good'} />
                  <OpsMetric label="Monthly Carry" value={formatCurrency(ownershipCosts)} tone="warn" />
                </div>
              </div>
              <div className="rounded-2xl border border-cyan-glow/20 bg-cyan-glow/5 p-3">
                <img src="/landlord-ops-command.svg" alt="Landlord operations command dashboard" className="w-full rounded-xl border border-divider bg-void-navy/70" />
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {landlordOps.milestones.map((milestone) => (
                    <div key={milestone.id} className={`rounded-lg border p-2 ${milestone.completed ? 'border-success/30 bg-success/10' : milestone.tone === 'warn' ? 'border-warning/30 bg-warning/10' : 'border-glass-border bg-black/20'}`}>
                      <p className={`font-rajdhani text-[11px] font-semibold uppercase tracking-[0.08em] ${milestone.completed ? 'text-success' : milestone.tone === 'warn' ? 'text-warning' : 'text-text-secondary'}`}>
                        {milestone.label}
                      </p>
                      <p className="text-text-dim text-[10px] mt-1 leading-snug">{milestone.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
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
              const opsSummary = describePortfolioHoldingOperations(owned);
              const monthlyLease = owned.tenant?.contractedRent ?? (owned.isRented ? owned.monthlyRental : 0);
              const leaseMonthsRemaining = owned.tenant ? owned.tenant.leaseEndTurn - player.turnCount : null;
              const repairExposure = (owned.openMaintenanceIssues ?? []).reduce((sum, issue) => sum + issue.estimatedCost, 0);

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
                            {owned.tenant ? 'LEASE' : 'RENTED'}
                          </span>
                        )}
                      </div>
                      <p className="text-text-secondary text-xs">D{district.id} {district.name} | Purchased: {owned.purchaseDate}</p>
                      <p className="text-text-dim text-[10px] mt-0.5">
                        {property.listingChannel} | Carry: {formatCurrency(carryingCost)}/mo | Status: {opsSummary.statusLabel}
                      </p>
                      <p className="text-text-dim text-[10px] mt-0.5">
                        Condition: {owned.conditionScore ?? 70}/100 | {opsSummary.tenantLabel}
                      </p>
                      {opsSummary.attentionTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {opsSummary.attentionTags.map((tag) => (
                            <span key={tag} className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[9px] font-mono text-warning">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {!owned.isRented && (owned.vacancyMonths ?? 0) > 0 && (
                        <p className="text-warning text-[10px] mt-0.5">Vacant for {owned.vacancyMonths} month(s)</p>
                      )}
                      {leaseMonthsRemaining !== null && leaseMonthsRemaining <= 2 && (
                        <p className="text-warning text-[10px] mt-1 flex items-center gap-1">
                          <FileClock size={11} /> Lease decision due soon: {Math.max(0, leaseMonthsRemaining)} month(s) left.
                        </p>
                      )}
                      {repairExposure > 0 && (
                        <p className="text-danger text-[10px] mt-1 flex items-center gap-1">
                          <ShieldAlert size={11} /> Repair exposure: {formatCurrency(repairExposure)}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-white text-sm">{formatCompactCurrency(owned.currentValue)}</p>
                      <p className={`font-mono text-xs ${gain >= 0 ? 'text-success' : 'text-danger'}`}>
                        {gain >= 0 ? '+' : ''}{formatPercent(gainPercent, 1)}
                      </p>
                      <p className={`font-mono text-[10px] mt-1 ${monthlyLease > 0 ? 'text-cyan-glow' : 'text-text-dim'}`}>
                        {monthlyLease > 0 ? `${formatCurrency(monthlyLease)}/mo` : 'No rent'}
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

        <ProgressivePanel
          title="Achievements"
          eyebrow="Long-term goals"
          summary={`${unlockedAchievements.length}/${achievements.length} unlocked. Kept here so portfolio management stays attention-first.`}
          accentColor="#7C4DFF"
        >
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
        </ProgressivePanel>
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
