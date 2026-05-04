import { useGameStore } from '@/game/useGameStore';
import { properties } from '@/data/properties';
import SceneImage from '@/components/SceneImage';
import { lifeActions, lifeActionsById } from '@/data/lifeActions';
import GlassCard from '@/components/GlassCard';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Building2, ArrowRight, Newspaper, BatteryCharging, Flame, House, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { selectAvailableCash, selectNetWorth, selectMonthlyNetCashflow, selectMonthlyTakeHome, selectMonthlyRentalIncome, selectMonthlyExpenses, selectMonthlyHouseholdLoad, selectReservedCash } from '@/engine/selectors';
import { TAKE_HOME_RATIO } from '@/engine/constants';
import { deriveEligibilityFlags, EC_MAX_MONTHLY_INCOME } from '@/engine/eligibility';
import EligibilityBadge from '@/components/EligibilityBadge';
import { getNextBestMoves, type CoachUrgency } from '@/engine/decisionCoach';
import { getFirstHomeMissions, type FirstHomeMission } from '@/engine/firstHomeMissions';
import RuleGlossaryPanel from '@/components/RuleGlossaryPanel';
import RunArcPanel from '@/components/RunArcPanel';
import type { BuyerProfile } from '@/game/types';

export default function Dashboard() {
  const { player, nextTurn, market, isGameActive, currentScenario } = useGameStore();
  const navigate = useNavigate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const netWorth = selectNetWorth(player);
  const availableCash = selectAvailableCash(player);
  const reservedCash = selectReservedCash(player);
  const monthlyTakeHome = selectMonthlyTakeHome(player, TAKE_HOME_RATIO);
  const monthlyRental = selectMonthlyRentalIncome(player);
  const monthlyDebt = selectMonthlyExpenses(player);
  const monthlyHouseholdLoad = selectMonthlyHouseholdLoad(player);
  const monthlyNetCashflow = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  const selectedPrimaryAction = lifeActions.find((action) => action.id === (player.life.selectedPrimaryActionId ?? 'focus-at-work'))
    ?? lifeActionsById['focus-at-work'];
  const selectedSecondaryAction = player.life.selectedSecondaryActionId
    ? lifeActionsById[player.life.selectedSecondaryActionId]
    : null;
  const marketChange = formatSignedPercent(market.monthlyPriceChangePct ?? 0);
  const eligibilityFlags = deriveEligibilityFlags({
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
    buyerProfile: player.buyerProfile,
  });
  const latestCareerReview = player.careerReviewHistory[player.careerReviewHistory.length - 1] ?? null;
  const nextJobSwitchIn = Math.max(player.nextJobSwitchTurn - player.turnCount, 0);
  const openIssues = player.properties.flatMap((property) => property.openMaintenanceIssues ?? []);
  const activeRenovations = player.properties.filter((property) => property.activeRenovation);
  const weakTenant = player.properties.find((property) => property.tenant && property.tenant.satisfaction < 55);
  const latestOperation = player.operationHistory?.[0] ?? null;
  const nextBestMoves = getNextBestMoves({ player, currentScenario });
  const firstHomeMissions = getFirstHomeMissions(player);

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
          <StatCard
            icon={Wallet}
            label="Available Cash"
            value={`S$${(availableCash / 1000).toFixed(1)}K`}
            color="#00F0FF"
            detail={reservedCash > 0 ? `Reserve S$${(reservedCash / 1000).toFixed(1)}K` : 'No reserve set'}
          />
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

        <motion.div variants={itemVariants} className="mb-6">
          <RunArcPanel player={player} onOpenRoute={(route) => navigate(route)} />
        </motion.div>

        <motion.div variants={itemVariants} className="mb-6">
          <GlassCard accentColor="#00E676">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="label-text text-text-dim text-[10px] mb-1">Decision Coach</p>
                <h3 className="section-title text-white">Next Best Move</h3>
                <p className="text-text-secondary text-sm mt-1">A plain-English queue for what to handle before the next month rolls.</p>
              </div>
              <Compass size={24} className="text-success shrink-0" />
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
              {nextBestMoves.map((move) => (
                <DecisionMoveCard key={move.id} move={move} onOpen={() => navigate(move.route)} />
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-6">
          <GlassCard accentColor="#2979FF">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="label-text text-text-dim text-[10px] mb-1">First-Home Mission Rail</p>
                <h3 className="section-title text-white">Make The Next Step Obvious</h3>
                <p className="text-text-secondary text-sm mt-1">A Singapore-specific starter path so new players know how to earn, prepare, buy, and operate without reading the whole ruleset first.</p>
              </div>
              <button onClick={() => navigate('/properties')} className="btn-secondary text-xs px-3 py-2 shrink-0">Starter Homes</button>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
              {firstHomeMissions.map((mission) => (
                <FirstHomeMissionCard key={mission.id} mission={mission} onOpen={() => navigate(mission.route)} />
              ))}
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
                Buyer profile: <span className="font-mono text-white">{formatBuyerProfile(player.buyerProfile)}</span>
              </p>
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

        <motion.div variants={itemVariants} className="mb-6">
          <RuleGlossaryPanel termIds={['absd', 'cpf-oa', 'mop', 'hdb-room-rental', 'msr', 'tdsr', 'reserve-cash']} />
        </motion.div>

        {player.properties.length > 0 && (
          <motion.div variants={itemVariants} className="mb-6">
            <GlassCard accentColor={openIssues.length > 0 ? '#FF1744' : activeRenovations.length > 0 ? '#FFD740' : '#00E676'}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="label-text text-text-dim text-[10px] mb-1">This Month Needs Attention</p>
                  <h3 className="section-title text-white">Property Operations</h3>
                </div>
                <button onClick={() => navigate('/portfolio')} className="btn-secondary text-xs px-3 py-2">Open Portfolio</button>
              </div>
              <div className="grid md:grid-cols-4 gap-3">
                <AttentionCard
                  label="Repairs"
                  value={openIssues.length > 0 ? `${openIssues.length} open` : 'Clear'}
                  detail={openIssues[0] ? `${openIssues[0].category} issue: S$${openIssues[0].estimatedCost.toLocaleString()}` : 'No urgent maintenance on the board.'}
                  tone={openIssues.length > 0 ? 'bad' : 'good'}
                />
                <AttentionCard
                  label="Upgrades"
                  value={activeRenovations.length > 0 ? `${activeRenovations.length} active` : 'Ready'}
                  detail={activeRenovations[0]?.activeRenovation ? `${activeRenovations[0].activeRenovation.label}: ${activeRenovations[0].activeRenovation.remainingMonths} mo left` : 'Pick an upgrade on an owned property detail page.'}
                  tone={activeRenovations.length > 0 ? 'warn' : 'neutral'}
                />
                <AttentionCard
                  label="Tenants"
                  value={weakTenant?.tenant ? `${weakTenant.tenant.satisfaction}/100` : 'Stable'}
                  detail={weakTenant?.tenant ? 'Tenant happiness is slipping. Consider repairs or a defensive rent strategy.' : 'No low-satisfaction leases flagged.'}
                  tone={weakTenant?.tenant ? 'bad' : 'good'}
                />
                <AttentionCard
                  label="Reserve"
                  value={`S$${(player.reserve?.allocatedCash ?? 0).toLocaleString()}`}
                  detail={latestOperation ? latestOperation.title : 'Set aside runway before maintenance bites.'}
                  tone={(player.reserve?.allocatedCash ?? 0) > 0 ? 'good' : 'warn'}
                />
              </div>
            </GlassCard>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div variants={itemVariants}>
            <GlassCard>
              <h3 className="section-title text-white mb-4">Monthly Cashflow</h3>
              <div className="space-y-3">
                <CashflowRow label="Salary (after CPF)" value={monthlyTakeHome} type="income" />
                <CashflowRow label="Rental Income" value={monthlyRental} type="income" />
                <div className="border-t border-divider" />
                <CashflowRow label="Loan Payments" value={monthlyDebt} type="expense" />
                <CashflowRow label="Household Load" value={monthlyHouseholdLoad} type="expense" />
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
            <GlassCard accentColor={selectedPrimaryAction.accent} className="overflow-hidden" padding="none">
              <SceneImage
                src={selectedPrimaryAction.image}
                alt={selectedPrimaryAction.imageAlt}
                className="h-36 w-full object-cover"
              />
              <div className="p-4">
              <h3 className="section-title text-white mb-3">Life Planning</h3>
              <p className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: selectedPrimaryAction.accent }}>
                {selectedPrimaryAction.visualLabel}
              </p>
              <p className="text-text-secondary text-xs mt-2 mb-4 leading-relaxed">
                {selectedPrimaryAction.heroHint}
              </p>
              <div className="space-y-2 mb-4">
                <LifeRow icon={BatteryCharging} label="Energy" value={`${player.life.energy}/100`} />
                <LifeRow icon={Flame} label="Stress" value={`${player.life.stress}/100`} />
                <LifeRow icon={House} label="Household" value={`S$${player.life.householdLoad.toLocaleString()}/mo`} />
              </div>
              <p className="text-text-secondary text-xs mb-2">
                Primary action: <span className="text-white">{selectedPrimaryAction.label}</span>
              </p>
              <p className="text-text-secondary text-xs mb-4">
                Secondary action: <span className="text-white">{selectedSecondaryAction?.label ?? 'None'}</span>
              </p>
              <button onClick={() => navigate('/life')} className="w-full btn-secondary text-sm py-3">Plan Life Actions</button>
              </div>
            </GlassCard>
            <GlassCard accentColor="#00F0FF">
              <h3 className="section-title text-white mb-4">Actions</h3>
              <div className="space-y-2">
                <button onClick={() => navigate('/properties')} className="w-full btn-secondary text-sm py-3">Browse Properties</button>
                <button onClick={() => navigate('/life')} className="w-full btn-secondary text-sm py-3">Manage Life</button>
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

function DecisionMoveCard({
  move,
  onOpen,
}: {
  move: ReturnType<typeof getNextBestMoves>[number];
  onOpen: () => void;
}) {
  const tone = coachToneClasses(move.urgency);

  return (
    <button
      onClick={onOpen}
      className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${tone.card}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`text-[10px] font-mono uppercase tracking-[0.18em] ${tone.label}`}>{move.urgency}</span>
        <ArrowRight size={14} className={tone.label} />
      </div>
      <p className="font-rajdhani font-semibold text-white mt-2">{move.title}</p>
      <p className="text-text-secondary text-xs mt-2 leading-relaxed">{move.detail}</p>
      <p className={`text-xs font-semibold mt-3 ${tone.label}`}>{move.actionLabel}</p>
    </button>
  );
}

function FirstHomeMissionCard({
  mission,
  onOpen,
}: {
  mission: FirstHomeMission;
  onOpen: () => void;
}) {
  const tone = missionToneClasses(mission);

  return (
    <button
      onClick={onOpen}
      className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${tone.card}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`text-[10px] font-mono uppercase tracking-[0.18em] ${tone.label}`}>
          {mission.completed ? 'done' : mission.tone}
        </span>
        <ArrowRight size={14} className={tone.label} />
      </div>
      <p className="font-rajdhani font-semibold text-white mt-2">{mission.label}</p>
      <p className="text-text-secondary text-xs mt-2 leading-relaxed">{mission.detail}</p>
    </button>
  );
}

function missionToneClasses(mission: FirstHomeMission) {
  if (mission.completed) {
    return {
      card: 'border-success/35 bg-success/10 hover:border-success/60',
      label: 'text-success',
    };
  }

  const classes = {
    good: {
      card: 'border-success/35 bg-success/10 hover:border-success/60',
      label: 'text-success',
    },
    warn: {
      card: 'border-warning/40 bg-warning/10 hover:border-warning/70',
      label: 'text-warning',
    },
    neutral: {
      card: 'border-glass-border bg-white/[0.03] hover:border-cyan-glow/50',
      label: 'text-cyan-glow',
    },
  } satisfies Record<FirstHomeMission['tone'], { card: string; label: string }>;

  return classes[mission.tone];
}

function coachToneClasses(urgency: CoachUrgency) {
  const classes = {
    critical: {
      card: 'border-danger/40 bg-danger/10 hover:border-danger/70',
      label: 'text-danger',
    },
    warn: {
      card: 'border-warning/40 bg-warning/10 hover:border-warning/70',
      label: 'text-warning',
    },
    good: {
      card: 'border-success/40 bg-success/10 hover:border-success/70',
      label: 'text-success',
    },
    neutral: {
      card: 'border-glass-border bg-white/[0.03] hover:border-cyan-glow/50',
      label: 'text-cyan-glow',
    },
  } satisfies Record<CoachUrgency, { card: string; label: string }>;

  return classes[urgency];
}

function AttentionCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
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
      <p className="text-text-secondary text-xs mt-2 leading-relaxed">{detail}</p>
    </div>
  );
}

function LifeRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-cyan-glow" />
        <span className="text-text-secondary text-sm">{label}</span>
      </div>
      <span className="font-mono text-sm text-white">{value}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, change, detail }: { icon: React.ElementType; label: string; value: string; color: string; change?: string; detail?: string }) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
      <div className="flex items-center gap-2 mb-2"><Icon size={18} style={{ color }} /><span className="label-text text-text-dim text-[10px]">{label}</span></div>
      <div className="flex items-end gap-2">
        <span className="font-mono text-xl font-bold text-white">{value}</span>
        {change && <span className={`text-[10px] font-mono mb-1 ${change.startsWith('+') ? 'text-success' : 'text-danger'}`}>{change}</span>}
      </div>
      {detail && <p className="text-text-dim text-[10px] mt-1">{detail}</p>}
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

function formatBuyerProfile(profile?: BuyerProfile): string {
  if (!profile) return 'Singapore Citizen | Couple / family | Age 30';

  const residency = profile.residencyStatus === 'sc'
    ? 'Singapore Citizen'
    : profile.residencyStatus === 'spr'
      ? 'Singapore PR'
      : 'Foreigner';
  const household = profile.householdProfile === 'couple-family'
    ? 'Couple / family'
    : profile.householdProfile === 'single-35-plus'
      ? 'Single 35+'
      : profile.householdProfile === 'single-under-35'
        ? 'Single under 35'
        : 'Foreign investor';

  return `${residency} | ${household} | Age ${profile.age}`;
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
