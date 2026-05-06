import { useEffect, useRef, useState } from 'react';
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
import { getMonthlyIntentOptions, type MonthlyIntentOption } from '@/engine/monthlyIntents';
import { deriveEligibilityFlags, EC_MAX_MONTHLY_INCOME } from '@/engine/eligibility';
import { getFirstHomeMissions } from '@/engine/firstHomeMissions';
import { getLastTurnRecap, type TurnRecap } from '@/engine/turnRecap';
import { getFirstRunQuest, type FirstRunQuest } from '@/engine/runQuest';
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
  CheckCircle2,
  Circle,
  FastForward,
  Flame,
  House,
  Newspaper,
  PieChart,
  ShoppingBag,
  Trophy,
  TrendingUp,
  Wallet,
} from 'lucide-react';

export default function Dashboard() {
  const {
    player,
    market,
    settings,
    isGameActive,
    currentScenario,
    setPrimaryLifeAction,
    setSecondaryLifeAction,
    advanceMonths,
    updateSettings,
  } = useGameStore();
  const navigate = useNavigate();
  const [showAdvancedPanels, setShowAdvancedPanels] = useState(false);
  const [highlightMonthlyIntent, setHighlightMonthlyIntent] = useState(false);
  const monthlyIntentRef = useRef<HTMLDivElement>(null);
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
  const monthlyIntents = getMonthlyIntentOptions(player);
  const firstHomeMissions = getFirstHomeMissions(player);
  const lastTurnRecap = getLastTurnRecap({ player, market, currentScenario });
  const firstRunQuest = getFirstRunQuest(player, currentScenario);
  const beginnerDashboardFocus = player.turnCount <= 6 && player.properties.length === 0 && !settings.compactMode;
  const hideAdvancedPanels = beginnerDashboardFocus && !showAdvancedPanels;
  const hasPropertyAttention = openIssues.length > 0 || activeRenovations.length > 0 || Boolean(weakTenant);
  const mopHolding = player.properties
    .map((holding) => ({
      holding,
      listing: properties.find((property) => property.id === holding.propertyId),
    }))
    .find(({ listing, holding }) => Boolean(listing?.isHdb && (holding.mopRemainingMonths ?? 0) > 0));

  useEffect(() => {
    if (!isGameActive) navigate('/gameover');
  }, [isGameActive, navigate]);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } } };
  const handleSelectIntent = (intent: MonthlyIntentOption) => {
    setPrimaryLifeAction(intent.primaryActionId);
    setSecondaryLifeAction(intent.secondaryActionId);
    advanceMonths(1);
    navigate('/dashboard');
  };
  const handleOpenIntent = (intent: MonthlyIntentOption) => {
    setPrimaryLifeAction(intent.primaryActionId);
    setSecondaryLifeAction(intent.secondaryActionId);
    navigate(intent.route);
  };
  const handleQuestStep = (step: FirstRunQuest['steps'][number]) => {
    if (step.id === 'choose-monthly-intent') {
      monthlyIntentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightMonthlyIntent(true);
      window.setTimeout(() => setHighlightMonthlyIntent(false), 1800);
      return;
    }
    navigate(step.route);
  };

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

        <motion.div variants={itemVariants} className="mb-6">
          <FirstRunQuestPanel quest={firstRunQuest} onNavigate={navigate} onContinueStep={handleQuestStep} />
        </motion.div>

        {lastTurnRecap && (
          <motion.div variants={itemVariants} className="mb-6">
            <LastMonthRecapPanel recap={lastTurnRecap} />
          </motion.div>
        )}

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
          <ActionTile icon={BookOpen} title="Learn" detail="Rules, blockers, first-run help" onClick={() => navigate('/learn')} />
        </motion.div>

        <motion.div ref={monthlyIntentRef} variants={itemVariants} className="mb-6 scroll-mt-24">
          <MonthlyIntentPanel
            intents={monthlyIntents}
            compactMode={settings.compactMode}
            highlighted={highlightMonthlyIntent}
            onSelect={handleSelectIntent}
            onOpen={handleOpenIntent}
            onToggleCompact={() => updateSettings({ compactMode: !settings.compactMode })}
          />
        </motion.div>

        {mopHolding && (
          <motion.div variants={itemVariants} className="mb-6">
            <MopCountdownPanel
              propertyName={mopHolding.listing?.name ?? 'HDB flat'}
              monthsRemaining={mopHolding.holding.mopRemainingMonths ?? 0}
              onOpenProperty={() => navigate(`/property/${mopHolding.holding.propertyId}`)}
              onPlanLife={() => navigate('/life')}
              onBlitz={() => advanceMonths(3)}
            />
          </motion.div>
        )}

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

        {hideAdvancedPanels ? (
          <motion.div variants={itemVariants} className="mb-6">
            <BeginnerAdvancedGate
              onShow={() => setShowAdvancedPanels(true)}
              onLearn={() => navigate('/learn')}
            />
          </motion.div>
        ) : (
          <>
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
          </>
        )}
      </motion.div>
    </div>
  );
}

function FirstRunQuestPanel({
  quest,
  onNavigate,
  onContinueStep,
}: {
  quest: FirstRunQuest;
  onNavigate: (route: string) => void;
  onContinueStep: (step: FirstRunQuest['steps'][number]) => void;
}) {
  return (
    <GlassCard accentColor="#00E676">
      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr,auto] lg:items-center">
        <div>
          <p className="label-text mb-1 text-[10px] text-success">Beginner quest</p>
          <h3 className="section-title text-white">{quest.title}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">{quest.beginnerHint}</p>
        </div>
        <div className="min-w-[12rem]">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.16em] text-text-dim">
            <span>Progress</span>
            <span className="text-success">{quest.progressPct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-success" style={{ width: `${quest.progressPct}%` }} />
          </div>
        </div>
      </div>

      {quest.rewardBeat && (
        <div className={`mb-4 rounded-2xl border p-3 ${
          quest.rewardBeat.tone === 'good'
            ? 'border-success/30 bg-success/10'
            : quest.rewardBeat.tone === 'warn'
              ? 'border-warning/30 bg-warning/10'
              : 'border-cyan-glow/25 bg-cyan-glow/10'
        }`}>
          <div className="flex items-start gap-3">
            <Trophy size={18} className={quest.rewardBeat.tone === 'warn' ? 'text-warning' : 'text-success'} />
            <div>
              <p className="font-rajdhani text-sm font-semibold uppercase tracking-[0.12em] text-white">{quest.rewardBeat.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">{quest.rewardBeat.detail}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-4">
        {quest.steps.map((step) => {
          const isActive = quest.activeStep?.id === step.id;
          const Icon = step.completed ? CheckCircle2 : Circle;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onNavigate(step.route)}
              className={`rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 ${
                step.completed
                  ? 'border-success/30 bg-success/10'
                  : isActive
                    ? 'border-cyan-glow/40 bg-cyan-glow/10'
                    : 'border-glass-border bg-white/[0.03]'
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <Icon size={16} className={step.completed ? 'text-success' : isActive ? 'text-cyan-glow' : 'text-text-dim'} />
                <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em] text-text-dim">
                  {step.rewardLabel}
                </span>
              </div>
              <p className="font-rajdhani text-sm font-semibold uppercase tracking-[0.1em] text-white">{step.label}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{step.detail}</p>
            </button>
          );
        })}
      </div>

      {quest.activeStep && (
        <button type="button" onClick={() => onContinueStep(quest.activeStep!)} className="btn-primary mt-4 w-full py-3 text-sm">
          Continue: {quest.activeStep.label}
        </button>
      )}
    </GlassCard>
  );
}

function LastMonthRecapPanel({ recap }: { recap: TurnRecap }) {
  const accentColor = recap.tone === 'good' ? '#00E676' : recap.tone === 'warn' ? '#FFD740' : '#00F0FF';

  return (
    <GlassCard accentColor={accentColor}>
      <div aria-live="polite" className="grid gap-4 lg:grid-cols-[0.95fr,1.4fr]">
        <div>
          <p className="label-text mb-1 text-[10px] text-cyan-glow">What changed</p>
          <h3 className="section-title text-white">{recap.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{recap.summary}</p>
          <p className="mt-3 rounded-xl border border-cyan-glow/20 bg-cyan-glow/10 p-3 text-xs leading-relaxed text-cyan-glow">
            {recap.nextHint}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {recap.facts.map((fact) => (
            <div key={fact.label} className="rounded-xl border border-glass-border bg-white/[0.03] p-3">
              <p className="label-text text-[9px] text-text-dim">{fact.label}</p>
              <p className={`mt-1 font-mono text-lg ${
                fact.tone === 'good'
                  ? 'text-success'
                  : fact.tone === 'warn'
                    ? 'text-warning'
                    : 'text-white'
              }`}>
                {fact.value}
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-text-dim">{fact.detail}</p>
            </div>
          ))}
        </div>
      </div>
      {recap.notes.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-divider pt-4">
          {recap.notes.map((note) => (
            <span key={note} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-text-secondary">
              {note}
            </span>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

function BeginnerAdvancedGate({
  onShow,
  onLearn,
}: {
  onShow: () => void;
  onLearn: () => void;
}) {
  return (
    <GlassCard accentColor="#7C4DFF">
      <div className="grid gap-4 md:grid-cols-[1fr,auto] md:items-center">
        <div>
          <p className="label-text mb-1 text-[10px] text-text-dim">Beginner focus mode</p>
          <h3 className="section-title text-white">Advanced sim panels are tucked away for the first few turns</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
            Start with the command objective, monthly intent, and Buy/Life tabs. Career review, eligibility, cashflow detail, route analytics, glossary, and mini portfolio are still one tap away.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:min-w-[20rem] md:grid-cols-1">
          <button type="button" onClick={onShow} className="btn-secondary min-h-11 px-4 py-3 text-sm">
            Open advanced sim panels
          </button>
          <button type="button" onClick={onLearn} className="rounded-lg border border-cyan-glow/30 bg-cyan-glow/10 px-4 py-3 font-rajdhani text-sm font-semibold uppercase tracking-wider text-cyan-glow transition-colors hover:bg-cyan-glow/20">
            Learn the rules first
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

function MonthlyIntentPanel({
  intents,
  compactMode,
  highlighted,
  onSelect,
  onOpen,
  onToggleCompact,
}: {
  intents: MonthlyIntentOption[];
  compactMode: boolean;
  highlighted: boolean;
  onSelect: (intent: MonthlyIntentOption) => void;
  onOpen: (intent: MonthlyIntentOption) => void;
  onToggleCompact: () => void;
}) {
  return (
    <GlassCard accentColor="#00F0FF" className={highlighted ? 'ring-2 ring-cyan-glow/70 shadow-[0_0_36px_rgba(0,240,255,0.22)]' : undefined}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-text mb-1 text-[10px] text-cyan-glow">Choose your month</p>
          <h3 className="section-title text-white">Monthly Intent</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Pick a plan, then either advance immediately or open the relevant page first. Time moves only when you choose "Use plan + advance".
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onToggleCompact}
            className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] ${
              compactMode
                ? 'border-success/35 bg-success/10 text-success'
                : 'border-cyan-glow/25 bg-cyan-glow/10 text-cyan-glow'
            }`}
          >
            {compactMode ? 'Compact on' : 'Compact off'}
          </button>
          <span className="rounded-full border border-cyan-glow/25 bg-cyan-glow/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-cyan-glow">
            1 click plan
          </span>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {intents.map((intent) => (
          <div
            key={intent.id}
            className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
              intent.recommended
                ? 'border-success/40 bg-success/10'
                : intent.tone === 'warn'
                  ? 'border-warning/30 bg-warning/10'
                  : 'border-glass-border bg-white/[0.03] hover:border-cyan-glow/40'
            }`}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className={`text-[10px] font-mono uppercase tracking-[0.18em] ${intent.recommended ? 'text-success' : 'text-text-dim'}`}>
                {intent.recommended ? 'Recommended' : intent.tone}
              </span>
              <span className="text-[10px] text-text-dim">No surprise advance</span>
            </div>
            <p className="font-rajdhani text-lg font-semibold text-white">{intent.label}</p>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-glow">Choose how to use this month</p>
            {!compactMode && (
              <>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">{intent.detail}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white/5 p-2">
                    <p className="label-text text-[9px] text-success">Upside</p>
                    <p className="mt-1 text-[11px] text-text-secondary">{intent.upside}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2">
                    <p className="label-text text-[9px] text-warning">Tradeoff</p>
                    <p className="mt-1 text-[11px] text-text-secondary">{intent.risk}</p>
                  </div>
                </div>
              </>
            )}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onSelect(intent)}
                className={intent.recommended ? 'btn-primary min-h-11 px-3 py-2 text-xs' : 'btn-secondary min-h-11 px-3 py-2 text-xs'}
              >
                Use plan + advance
              </button>
              <button
                type="button"
                onClick={() => onOpen(intent)}
                className="min-h-11 rounded-lg border border-cyan-glow/30 bg-cyan-glow/10 px-3 py-2 font-rajdhani text-xs font-semibold uppercase tracking-wider text-cyan-glow transition-colors hover:bg-cyan-glow/20"
              >
                Open first
              </button>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
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

function MopCountdownPanel({
  propertyName,
  monthsRemaining,
  onOpenProperty,
  onPlanLife,
  onBlitz,
}: {
  propertyName: string;
  monthsRemaining: number;
  onOpenProperty: () => void;
  onPlanLife: () => void;
  onBlitz: () => void;
}) {
  const elapsedMonths = Math.max(0, 60 - monthsRemaining);
  const progressPct = Math.min(100, Math.round((elapsedMonths / 60) * 100));

  return (
    <GlassCard accentColor="#FFD740">
      <div className="grid gap-4 lg:grid-cols-[1fr,auto] lg:items-center">
        <div>
          <p className="label-text mb-1 text-[10px] text-warning">MOP Countdown</p>
          <h3 className="section-title text-white">{propertyName}: {monthsRemaining} months left</h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            The HDB path should not feel like dead time. Use room rental, life-income moves, or blitz quiet months until the next decision point appears.
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-warning" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[32rem]">
          <button type="button" onClick={onOpenProperty} className="btn-primary py-3 text-sm">
            Start Room Rental
          </button>
          <button type="button" onClick={onPlanLife} className="btn-secondary py-3 text-sm">
            Plan Side Income
          </button>
          <button type="button" onClick={onBlitz} className="btn-secondary py-3 text-sm">
            <span className="inline-flex items-center justify-center gap-2">
              <FastForward size={15} />
              Blitz 3 Months
            </span>
          </button>
        </div>
      </div>
    </GlassCard>
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
