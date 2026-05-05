import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CommandCenterHero from '@/components/CommandCenterHero';
import GlassCard from '@/components/GlassCard';
import ProgressivePanel from '@/components/ProgressivePanel';
import RuleGlossaryPanel from '@/components/RuleGlossaryPanel';
import RunArcPanel from '@/components/RunArcPanel';
import SceneImage from '@/components/SceneImage';
import { properties } from '@/data/properties';
import { lifeActions, lifeActionsById } from '@/data/lifeActions';
import { TAKE_HOME_RATIO } from '@/engine/constants';
import { getCommandCenterState } from '@/engine/commandCenter';
import { getNextBestMoves } from '@/engine/decisionCoach';
import { deriveEligibilityFlags, EC_MAX_MONTHLY_INCOME } from '@/engine/eligibility';
import { getFirstHomeMissions } from '@/engine/firstHomeMissions';
import {
  selectAvailableCash,
  selectMonthlyExpenses,
  selectMonthlyHouseholdLoad,
  selectMonthlyNetCashflow,
  selectMonthlyRentalIncome,
  selectMonthlyTakeHome,
  selectNetWorth,
  selectReservedCash,
} from '@/engine/selectors';
import { useGameStore } from '@/game/useGameStore';
import EligibilityBadge from '@/components/EligibilityBadge';
import {
  AttentionCard,
  CareerMetric,
  CashflowRow,
  DecisionMoveCard,
  FirstHomeMissionCard,
  LifeRow,
  StatCard,
} from './dashboard/DashboardComponents';
import {
  formatBuyerProfile,
  formatCareerOutcome,
  formatSignedCurrency,
  formatSignedPercent,
} from './dashboard/dashboardFormatters';
import {
  Banknote,
  BatteryCharging,
  BookOpen,
  Building2,
  Flame,
  House,
  Newspaper,
  PieChart,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react';

export default function Dashboard() {
  const { player, market, isGameActive, currentScenario } = useGameStore();
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
  const commandState = getCommandCenterState(player, currentScenario);
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
  const hasPropertyAttention = openIssues.length > 0 || activeRenovations.length > 0 || Boolean(weakTenant);

  useEffect(() => {
    if (!isGameActive) navigate('/gameover');
  }, [isGameActive, navigate]);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } } };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="mx-auto max-w-6xl">
        <motion.div variants={itemVariants} className="mb-5 pt-1">
          <h1 className="page-title text-white">Home Command Center</h1>
          <p className="mt-1 font-rajdhani text-text-secondary">
            {monthNames[player.month - 1]} {player.year} | Turn {player.turnCount} | Age {player.age} | Welcome, {player.name}
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <CommandCenterHero state={commandState} onNavigate={navigate} />
        </motion.div>

        <motion.div variants={itemVariants} className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
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

        <motion.div variants={itemVariants} className="mb-6 grid gap-3 md:grid-cols-4">
          <ActionTile icon={Banknote} title="Earn" detail="Life actions, side gigs, schemes" onClick={() => navigate('/life')} />
          <ActionTile icon={ShoppingBag} title="Buy" detail="Best next listing and filters" onClick={() => navigate('/properties')} />
          <ActionTile icon={PieChart} title="Own" detail="Tenants, repairs, upgrades" onClick={() => navigate('/portfolio')} />
          <ActionTile icon={BookOpen} title="Learn" detail="Market, bank, rules, saves" onClick={() => navigate('/market')} />
        </motion.div>

        {player.properties.length > 0 && hasPropertyAttention && (
          <motion.div variants={itemVariants} className="mb-6">
            <PropertyOperationsPanel
              openIssues={openIssues}
              activeRenovations={activeRenovations}
              weakTenant={weakTenant}
              latestOperationTitle={latestOperation?.title}
              reserveCash={player.reserve?.allocatedCash ?? 0}
              onOpenPortfolio={() => navigate('/portfolio')}
            />
          </motion.div>
        )}

        <div className="mb-6 grid gap-4 xl:grid-cols-[1.3fr,0.9fr]">
          <motion.div variants={itemVariants}>
            <CareerReviewPanel
              latestCareerReview={latestCareerReview}
              nextJobSwitchIn={nextJobSwitchIn}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <EligibilitySummaryPanel
              eligibilityFlags={eligibilityFlags}
              player={player}
            />
          </motion.div>
        </div>

        <div className="space-y-4">
          <motion.div variants={itemVariants}>
            <ProgressivePanel
              title="Decision Coach"
              eyebrow="Optional depth"
              summary="The full next-best-move queue is still here when you want a more tactical read."
              accentColor="#00E676"
              defaultOpen={commandState.panelDefaults.coach === 'open'}
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {nextBestMoves.map((move) => (
                  <DecisionMoveCard key={move.id} move={move} onOpen={() => navigate(move.route)} />
                ))}
              </div>
            </ProgressivePanel>
          </motion.div>

          <motion.div variants={itemVariants}>
            <ProgressivePanel
              title="First-Home Mission Rail"
              eyebrow="Guided path"
              summary="Starter missions are grouped here so beginners get help without four more cards shouting at them immediately."
              accentColor="#2979FF"
              defaultOpen={commandState.panelDefaults.firstHome === 'open'}
            >
              <div className="mb-4 flex justify-end">
                <button onClick={() => navigate('/properties')} className="btn-secondary px-3 py-2 text-xs">Starter Homes</button>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {firstHomeMissions.map((mission) => (
                  <FirstHomeMissionCard key={mission.id} mission={mission} onOpen={() => navigate(mission.route)} />
                ))}
              </div>
            </ProgressivePanel>
          </motion.div>

          <motion.div variants={itemVariants}>
            <ProgressivePanel
              title="Market Pulse"
              eyebrow="World state"
              summary={market.lastHeadline ?? 'The market is waiting for a catalyst.'}
              accentColor={market.lastEvent === 'crash' ? '#FF1744' : market.lastEvent === 'boom' ? '#00E676' : '#00F0FF'}
              defaultOpen={commandState.panelDefaults.market === 'open'}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{market.lastHeadline ?? 'The market is waiting for a catalyst.'}</p>
                  <p className="mt-2 max-w-3xl text-sm text-text-secondary">{market.lastSummary ?? 'Advance a turn to generate the next headline.'}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`font-mono text-lg ${marketChange.startsWith('-') ? 'text-danger' : marketChange.startsWith('+') ? 'text-success' : 'text-text-secondary'}`}>
                    {marketChange}
                  </p>
                  <p className="text-xs text-text-dim">price index this month</p>
                </div>
              </div>
            </ProgressivePanel>
          </motion.div>

          <motion.div variants={itemVariants}>
            <ProgressivePanel
              title="Life Arc"
              eyebrow="Route progress"
              summary="Your long-term route is available here, but the command center now turns it into one current objective first."
              accentColor="#FFD740"
              defaultOpen={commandState.panelDefaults.route === 'open'}
            >
              <RunArcPanel player={player} onOpenRoute={(route) => navigate(route)} />
            </ProgressivePanel>
          </motion.div>

          <motion.div variants={itemVariants}>
            <ProgressivePanel
              title="Monthly Cashflow"
              eyebrow="Finance detail"
              summary={`${monthlyNetCashflow >= 0 ? 'Surplus' : 'Burn'}: S$${Math.abs(monthlyNetCashflow).toLocaleString()}/mo after life, loans, and property costs.`}
              defaultOpen={commandState.panelDefaults.cashflow === 'open'}
            >
              <div className="space-y-3">
                <CashflowRow label="Salary (after CPF)" value={monthlyTakeHome} type="income" />
                <CashflowRow label="Rental Income" value={monthlyRental} type="income" />
                <div className="border-t border-divider" />
                <CashflowRow label="Loan Payments" value={monthlyDebt} type="expense" />
                <CashflowRow label="Household Load" value={monthlyHouseholdLoad} type="expense" />
                <div className="border-t border-divider" />
                <CashflowRow label="Net Cashflow" value={monthlyNetCashflow} type={monthlyNetCashflow >= 0 ? 'income' : 'expense'} isTotal />
              </div>
            </ProgressivePanel>
          </motion.div>

          <motion.div variants={itemVariants}>
            <ProgressivePanel
              title="Rules Glossary"
              eyebrow="Learn"
              summary="CPF, ABSD, MOP, MSR, TDSR, reserves, and room rental explained only when you need the rulebook."
              defaultOpen={commandState.panelDefaults.rules === 'open'}
            >
              <RuleGlossaryPanel termIds={['absd', 'cpf-oa', 'mop', 'hdb-room-rental', 'msr', 'tdsr', 'reserve-cash']} />
            </ProgressivePanel>
          </motion.div>

          <motion.div variants={itemVariants} className="grid gap-4 lg:grid-cols-2">
            <ProgressivePanel
              title="Mini Portfolio"
              eyebrow="Own"
              summary={player.properties.length === 0 ? 'No properties yet. The Own tab wakes up after your first purchase.' : `${player.properties.length} holding(s) in the run.`}
              defaultOpen={commandState.panelDefaults.portfolio === 'open'}
            >
              {player.properties.length === 0 ? (
                <div className="py-6 text-center">
                  <Building2 size={32} className="mx-auto mb-2 text-text-dim" />
                  <p className="text-sm text-text-secondary">No properties yet. Visit Buy to start investing.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {player.properties.slice(0, 5).map((holding, index) => {
                    const propInfo = properties.find((property) => property.id === holding.propertyId);
                    return (
                      <button
                        key={`${holding.propertyId}-${index}`}
                        type="button"
                        className="flex w-full items-center justify-between rounded px-2 py-2 text-left transition-colors hover:bg-white/5"
                        onClick={() => propInfo && navigate(`/property/${propInfo.id}`)}
                      >
                        <span>
                          <span className="block text-sm font-medium text-white">{propInfo ? propInfo.name : `Property #${index + 1}`}</span>
                          <span className="block text-xs text-text-dim">Purchased: {holding.purchaseDate}</span>
                        </span>
                        <span className="text-right">
                          <span className="block font-mono text-sm text-cyan-glow">S${(holding.currentValue / 1000).toFixed(0)}K</span>
                          <span className={`block text-[10px] ${holding.isRented ? 'text-cyan-glow' : 'text-text-dim'}`}>{holding.isRented ? 'Rented' : 'Vacant'}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </ProgressivePanel>

            <ProgressivePanel
              title="Life Planning Detail"
              eyebrow="Life"
              summary={`${selectedPrimaryAction.label} selected. Energy ${player.life.energy}/100, stress ${player.life.stress}/100.`}
              accentColor={selectedPrimaryAction.accent}
              defaultOpen={commandState.panelDefaults.life === 'open'}
            >
              <div className="overflow-hidden rounded-xl border border-divider">
                <SceneImage
                  src={selectedPrimaryAction.image}
                  alt={selectedPrimaryAction.imageAlt}
                  className="h-36 w-full object-cover"
                />
                <div className="space-y-3 bg-black/20 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: selectedPrimaryAction.accent }}>
                    {selectedPrimaryAction.visualLabel}
                  </p>
                  <p className="text-xs leading-relaxed text-text-secondary">{selectedPrimaryAction.heroHint}</p>
                  <LifeRow icon={BatteryCharging} label="Energy" value={`${player.life.energy}/100`} />
                  <LifeRow icon={Flame} label="Stress" value={`${player.life.stress}/100`} />
                  <LifeRow icon={House} label="Household" value={`S$${player.life.householdLoad.toLocaleString()}/mo`} />
                  <p className="text-xs text-text-secondary">Secondary action: <span className="text-white">{selectedSecondaryAction?.label ?? 'None'}</span></p>
                  <button onClick={() => navigate('/life')} className="btn-secondary w-full py-3 text-sm">Plan Life Actions</button>
                </div>
              </div>
            </ProgressivePanel>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function ActionTile({
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-glass-border bg-white/[0.04] p-4 text-left transition-all hover:border-cyan-glow/40 hover:bg-cyan-glow/10"
    >
      <Icon size={20} className="mb-3 text-cyan-glow" />
      <p className="font-rajdhani text-lg font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-text-secondary">{detail}</p>
    </button>
  );
}

function PropertyOperationsPanel({
  openIssues,
  activeRenovations,
  weakTenant,
  latestOperationTitle,
  reserveCash,
  onOpenPortfolio,
}: {
  openIssues: Array<{ category: string; estimatedCost: number }>;
  activeRenovations: Array<{ activeRenovation?: { label: string; remainingMonths: number } }>;
  weakTenant?: { tenant?: { satisfaction: number } };
  latestOperationTitle?: string;
  reserveCash: number;
  onOpenPortfolio: () => void;
}) {
  return (
    <GlassCard accentColor={openIssues.length > 0 ? '#FF1744' : activeRenovations.length > 0 ? '#FFD740' : '#00E676'}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="label-text mb-1 text-[10px] text-text-dim">This Month Needs Attention</p>
          <h3 className="section-title text-white">Property Operations</h3>
        </div>
        <button onClick={onOpenPortfolio} className="btn-secondary px-3 py-2 text-xs">Open Portfolio</button>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
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
          value={`S$${reserveCash.toLocaleString()}`}
          detail={latestOperationTitle ?? 'Set aside runway before maintenance bites.'}
          tone={reserveCash > 0 ? 'good' : 'warn'}
        />
      </div>
    </GlassCard>
  );
}

function CareerReviewPanel({
  latestCareerReview,
  nextJobSwitchIn,
}: {
  latestCareerReview: ReturnType<typeof useGameStore.getState>['player']['careerReviewHistory'][number] | null;
  nextJobSwitchIn: number;
}) {
  return (
    <GlassCard accentColor="#FFD740">
      <div className="grid gap-4 md:grid-cols-[220px,1fr]">
        <img
          src="/career-review-key-art.png"
          alt="Career Review"
          className="h-44 w-full rounded-xl object-cover opacity-90"
        />
        <div>
          <h3 className="section-title mb-2 text-white">Career Review</h3>
          {latestCareerReview ? (
            <>
              <p className="font-medium text-white">{formatCareerOutcome(latestCareerReview.outcome)}</p>
              <p className="mt-1 text-sm text-text-secondary">
                Your latest annual review has already rolled into salary and buying power.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <CareerMetric label="Salary Delta" value={formatSignedCurrency(latestCareerReview.salaryDelta)} tone={latestCareerReview.salaryDelta >= 0 ? 'good' : 'blocked'} />
                <CareerMetric label="Bonus" value={latestCareerReview.bonus > 0 ? `S$${latestCareerReview.bonus.toLocaleString()}` : 'None'} tone={latestCareerReview.bonus > 0 ? 'good' : 'warn'} />
                <CareerMetric label="Review Turn" value={String(latestCareerReview.turn)} tone="warn" />
              </div>
            </>
          ) : (
            <>
              <p className="font-medium text-white">First annual review pending</p>
              <p className="mt-1 text-sm text-text-secondary">
                Your first formal review arrives on turn 12. Salary growth and job-switch choices then become part of the housing climb.
              </p>
            </>
          )}
          <p className="mt-4 text-xs text-text-dim">
            Next job-switch window in <span className="font-mono text-white">{nextJobSwitchIn}</span> turns.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

function EligibilitySummaryPanel({
  eligibilityFlags,
  player,
}: {
  eligibilityFlags: ReturnType<typeof deriveEligibilityFlags>;
  player: ReturnType<typeof useGameStore.getState>['player'];
}) {
  return (
    <GlassCard accentColor="#FF9100">
      <h3 className="section-title mb-2 text-white">Eligibility Summary</h3>
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
      <div className="mt-4 space-y-2 text-sm">
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
  );
}
