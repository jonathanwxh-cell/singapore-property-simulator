import { useGameStore } from '@/game/useGameStore';
import { properties } from '@/data/properties';
import GlassCard from '@/components/GlassCard';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Building2, ArrowRight, Newspaper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { selectNetWorth, selectMonthlyNetCashflow, selectMonthlyTakeHome, selectMonthlyRentalIncome, selectMonthlyExpenses } from '@/engine/selectors';
import { TAKE_HOME_RATIO } from '@/engine/constants';
import { deriveEligibilityFlags, EC_MAX_MONTHLY_INCOME } from '@/engine/eligibility';
import EligibilityBadge from '@/components/EligibilityBadge';

export default function Dashboard() {
  const { player, nextTurn, market, isGameActive } = useGameStore();
  const navigate = useNavigate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const netWorth = selectNetWorth(player);
  const monthlyTakeHome = selectMonthlyTakeHome(player, TAKE_HOME_RATIO);
  const monthlyRental = selectMonthlyRentalIncome(player);
  const monthlyExpenses = selectMonthlyExpenses(player);
  const monthlyNetCashflow = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  const marketChange = formatSignedPercent(market.monthlyPriceChangePct ?? 0);
  const eligibilityFlags = deriveEligibilityFlags({
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
  });
  const latestCareerReview = player.careerReviewHistory[player.careerReviewHistory.length - 1] ?? null;
  const nextJobSwitchIn = Math.max(player.nextJobSwitchTurn - player.turnCount, 0);

  useEffect(() => {
    if (!isGameActive) navigate('/gameover');
  }, [isGameActive, navigate]);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } } };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl mx-auto">
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="page-title text-white">Welcome, {player.name}</h1>
          <p className="text-text-secondary mt-1 font-rajdhani">{monthNames[player.month - 1]} {player.year} | Turn {player.turnCount} | Age {player.age}</p>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Wallet} label="Cash" value={`S$${(player.cash / 1000).toFixed(1)}K`} color="#00F0FF" />
          <StatCard icon={TrendingUp} label="Net Worth" value={`S$${(netWorth / 1000000).toFixed(2)}M`} color="#00E676" />
          <StatCard icon={Building2} label="Properties" value={String(player.properties.length)} color="#7C4DFF" />
          <StatCard icon={Newspaper} label="Market Index" value={`${market.priceIndex.toFixed(1)}`} color="#FF9100" change={marketChange} />
        </motion.div>

        <motion.div variants={itemVariants} className="mb-6">
          <GlassCard accentColor={market.lastEvent === 'crash' ? '#FF1744' : market.lastEvent === 'boom' ? '#00E676' : '#00F0FF'}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="section-title text-white mb-1">Market Pulse</h3>
                <p className="text-white font-medium">{market.lastHeadline ?? 'The market is waiting for a catalyst.'}</p>
                <p className="text-text-secondary text-sm mt-2 max-w-3xl">{market.lastSummary ?? 'Advance a turn to generate the next headline.'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-mono text-lg ${marketChange.startsWith('-') ? 'text-danger' : marketChange.startsWith('+') ? 'text-success' : 'text-text-secondary'}`}>
                  {marketChange}
                </p>
                <p className="text-text-dim text-xs">price index this month</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants} className="grid xl:grid-cols-[1.3fr,0.9fr] gap-4 mb-6">
          <GlassCard accentColor="#FFD740">
            <div className="grid gap-4 md:grid-cols-[220px,1fr]">
              <img
                src="/career-review-key-art.png"
                alt="Career Review"
                className="h-44 w-full rounded-xl object-cover opacity-90"
              />
              <div>
                <h3 className="section-title text-white mb-2">Career Review</h3>
                {latestCareerReview ? (
                  <>
                    <p className="text-white font-medium">{formatCareerOutcome(latestCareerReview.outcome)}</p>
                    <p className="text-text-secondary text-sm mt-1">
                      Your latest annual review has already rolled into salary and buying power. Use the next few turns to decide whether to press or protect that momentum.
                    </p>
                    <div className="grid sm:grid-cols-3 gap-3 mt-4">
                      <CareerMetric label="Salary Delta" value={formatSignedCurrency(latestCareerReview.salaryDelta)} tone={latestCareerReview.salaryDelta >= 0 ? 'good' : 'blocked'} />
                      <CareerMetric label="Bonus" value={latestCareerReview.bonus > 0 ? `S$${latestCareerReview.bonus.toLocaleString()}` : 'None'} tone={latestCareerReview.bonus > 0 ? 'good' : 'warn'} />
                      <CareerMetric label="Review Count" value={String(player.careerProgressionProfile.reviewCount)} tone="warn" />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-white font-medium">First annual review pending</p>
                    <p className="text-text-secondary text-sm mt-1">
                      Your first formal review arrives on turn 12. After that, salary growth, setbacks, and job-switch choices become part of the housing climb.
                    </p>
                  </>
                )}
                <p className="text-text-dim text-xs mt-4">
                  Next job-switch window in <span className="font-mono text-white">{nextJobSwitchIn}</span> turns.
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard accentColor="#FF9100">
            <h3 className="section-title text-white mb-2">Eligibility Summary</h3>
            <div className="flex flex-wrap gap-2">
              {eligibilityFlags.firstTimer && <EligibilityBadge label="First-Timer" tone="good" />}
              {eligibilityFlags.homeowner && <EligibilityBadge label="Homeowner" tone="warn" />}
              {eligibilityFlags.upgrader && <EligibilityBadge label="Upgrader" tone="warn" />}
              {eligibilityFlags.ecEligible && <EligibilityBadge label="EC Eligible" tone="good" />}
              {!eligibilityFlags.ecEligible && player.salary > EC_MAX_MONTHLY_INCOME && (
                <EligibilityBadge label="EC Ceiling Exceeded" tone="blocked" />
              )}
              {player.ownedPrivateHome && <EligibilityBadge label="Private-Home Owner" tone="warn" />}
            </div>
            <div className="space-y-2 mt-4 text-sm">
              <p className="text-text-secondary">
                Monthly salary: <span className="font-mono text-white">S${player.salary.toLocaleString()}</span>
              </p>
              <p className="text-text-secondary">
                EC ceiling: <span className="font-mono text-white">S${EC_MAX_MONTHLY_INCOME.toLocaleString()}</span>
              </p>
              <p className="text-text-secondary">
                {eligibilityFlags.firstTimer
                  ? 'You are still on your first-home rung, so HDB and early support listings should feel the cleanest to pursue.'
                  : eligibilityFlags.homeowner
                    ? 'You have crossed into the upgrader stage. Private condos and larger moves should start feeling more intentional now.'
                    : 'You have first-home history but no current residential holding, which keeps the run flexible for a reset or bigger next move.'}
              </p>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants}>
            <GlassCard>
              <h3 className="section-title text-white mb-4">Monthly Cashflow</h3>
              <div className="space-y-3">
                <CashflowRow label="Salary (after CPF)" value={monthlyTakeHome} type="income" />
                <CashflowRow label="Rental Income" value={monthlyRental} type="income" />
                <div className="border-t border-divider" />
                <CashflowRow label="Loan Payments" value={monthlyExpenses} type="expense" />
                <div className="border-t border-divider" />
                <CashflowRow label="Net Cashflow" value={monthlyNetCashflow} type={monthlyNetCashflow >= 0 ? 'income' : 'expense'} isTotal />
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard>
              <h3 className="section-title text-white mb-4">Portfolio</h3>
              {player.properties.length === 0 ? (
                <div className="text-center py-6"><Building2 size={32} className="text-text-dim mx-auto mb-2" /><p className="text-text-secondary text-sm">No properties yet. Visit the Properties page to start investing!</p></div>
              ) : (
                <div className="space-y-2">
                  {player.properties.slice(0, 5).map((p, i) => {
                    const propInfo = properties.find(prop => prop.id === p.propertyId);
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-divider last:border-0 cursor-pointer hover:bg-white/5 rounded px-2 -mx-2 transition-colors"
                        onClick={() => propInfo && navigate(`/property/${propInfo.id}`)}>
                        <div><p className="text-white text-sm font-medium hover:text-cyan-glow transition-colors">{propInfo ? propInfo.name : `Property #${i + 1}`}</p><p className="text-text-dim text-xs">Purchased: {p.purchaseDate}</p></div>
                        <div className="text-right"><p className="text-cyan-glow font-mono text-sm">S${(p.currentValue / 1000).toFixed(0)}K</p><p className={`text-[10px] ${p.isRented ? 'text-cyan-glow' : 'text-text-dim'}`}>{p.isRented ? 'Rented' : 'Vacant'}</p></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4">
            <GlassCard accentColor="#00F0FF">
              <h3 className="section-title text-white mb-4">Actions</h3>
              <div className="space-y-2">
                <button onClick={() => navigate('/properties')} className="w-full btn-secondary text-sm py-3">Browse Properties</button>
                <button onClick={() => navigate('/bank')} className="w-full btn-secondary text-sm py-3">Manage Loans</button>
                <button onClick={() => navigate('/market')} className="w-full btn-secondary text-sm py-3">Market Overview</button>
              </div>
            </GlassCard>
            <GlassCard accentColor="#00E676">
              <h3 className="section-title text-white mb-2">Next Turn</h3>
              <p className="text-text-secondary text-xs mb-4">Advance one month. Collect rent, pay loans, and trigger market changes.</p>
              <button onClick={nextTurn} className="btn-primary w-full flex items-center justify-center gap-2">
                Advance to {monthNames[player.month % 12]} {player.month === 12 ? player.year + 1 : player.year}<ArrowRight size={16} />
              </button>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, change }: { icon: React.ElementType; label: string; value: string; color: string; change?: string }) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
      <div className="flex items-center gap-2 mb-2"><Icon size={18} style={{ color }} /><span className="label-text text-text-dim text-[10px]">{label}</span></div>
      <div className="flex items-end gap-2">
        <span className="font-mono text-xl font-bold text-white">{value}</span>
        {change && <span className={`text-[10px] font-mono mb-1 ${change.startsWith('+') ? 'text-success' : 'text-danger'}`}>{change}</span>}
      </div>
    </GlassCard>
  );
}

function CashflowRow({ label, value, type, isTotal }: { label: string; value: number; type: 'income' | 'expense'; isTotal?: boolean }) {
  const color = isTotal ? (value >= 0 ? '#00E676' : '#FF1744') : type === 'income' ? '#00E676' : '#FF1744';
  return (
    <div className="flex items-center justify-between">
      <span className={`${isTotal ? 'text-white font-semibold' : 'text-text-secondary'} text-sm`}>{label}</span>
      <span className="font-mono text-sm" style={{ color }}>{type === 'expense' && !isTotal ? '-' : ''}{isTotal && value >= 0 ? '+' : ''}S${Math.abs(value).toLocaleString()}</span>
    </div>
  );
}

function formatSignedPercent(value: number): string {
  if (Math.abs(value) < 0.05) return '0.0%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function formatCareerOutcome(outcome: 'promotion' | 'bonus' | 'steady' | 'setback' | null): string {
  if (outcome === 'promotion') return 'Promotion Year';
  if (outcome === 'bonus') return 'Strong Bonus Year';
  if (outcome === 'steady') return 'Steady Progress Year';
  if (outcome === 'setback') return 'Career Setback';
  return 'Career Review';
}

function formatSignedCurrency(value: number): string {
  return `${value >= 0 ? '+' : '-'}S$${Math.abs(value).toLocaleString()}`;
}

function CareerMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'good' | 'warn' | 'blocked';
}) {
  const toneClasses = {
    good: 'text-success',
    warn: 'text-warning',
    blocked: 'text-danger',
  } satisfies Record<typeof tone, string>;

  return (
    <div className="rounded-lg bg-white/5 p-3">
      <p className="label-text text-text-dim text-[10px]">{label}</p>
      <p className={`font-mono text-sm ${toneClasses[tone]}`}>{value}</p>
    </div>
  );
}
