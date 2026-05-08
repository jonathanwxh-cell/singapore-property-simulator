import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CommandCenterHero from '@/components/CommandCenterHero';
import ProgressivePanel from '@/components/ProgressivePanel';
import RuleGlossaryPanel from '@/components/RuleGlossaryPanel';
import RunArcPanel from '@/components/RunArcPanel';
import SceneImage from '@/components/SceneImage';
import LifeCampaignPanel from '@/components/LifeCampaignPanel';
import { properties } from '@/data/properties';
import { lifeActions, lifeActionsById } from '@/data/lifeActions';
import { TAKE_HOME_RATIO } from '@/engine/constants';
import { getCommandCenterState } from '@/engine/commandCenter';
import { getLifeCampaign } from '@/engine/lifeCampaign';
import { getNextBestMoves } from '@/engine/decisionCoach';
import { getMonthlyIntentOptions, type MonthlyIntentOption } from '@/engine/monthlyIntents';
import { getNextHomePlan } from '@/engine/nextHomePlan';
import { getOwnershipCampaign } from '@/engine/ownershipCampaign';
import { deriveEligibilityFlags } from '@/engine/eligibility';
import { getFirstHomeMissions } from '@/engine/firstHomeMissions';
import { getLastTurnRecap } from '@/engine/turnRecap';
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
import {
  CashflowRow,
  DecisionMoveCard,
  FirstHomeMissionCard,
  LifeRow,
  StatCard,
} from './dashboard/DashboardComponents';
import { formatSignedPercent } from './dashboard/dashboardFormatters';
import ActionTile from './dashboard/panels/ActionTile';
import BeginnerAdvancedGate from './dashboard/panels/BeginnerAdvancedGate';
import BeginnerPrimerPanel from './dashboard/panels/BeginnerPrimerPanel';
import CareerReviewPanel from './dashboard/panels/CareerReviewPanel';
import EligibilitySummaryPanel from './dashboard/panels/EligibilitySummaryPanel';
import FirstRunQuestPanel from './dashboard/panels/FirstRunQuestPanel';
import LastMonthRecapPanel from './dashboard/panels/LastMonthRecapPanel';
import MonthlyIntentPanel from './dashboard/panels/MonthlyIntentPanel';
import NextHomeGatewayPanel from './dashboard/panels/NextHomeGatewayPanel';
import PropertyOperationsPanel from './dashboard/panels/PropertyOperationsPanel';
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
  const {
    player,
    market,
    settings,
    isGameActive,
    currentScenario,
    advanceToNextNotableMonth,
    applyMonthlyIntent,
    prepareMonthlyIntent,
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
  const commandState = useMemo(() => getCommandCenterState(player, currentScenario), [player, currentScenario]);
  const lifeCampaign = useMemo(() => getLifeCampaign(player, currentScenario), [player, currentScenario]);
  const selectedPrimaryAction = lifeActions.find((action) => action.id === (player.life.selectedPrimaryActionId ?? 'focus-at-work'))
    ?? lifeActionsById['focus-at-work'];
  const selectedSecondaryAction = player.life.selectedSecondaryActionId
    ? lifeActionsById[player.life.selectedSecondaryActionId]
    : null;
  const marketChange = useMemo(() => formatSignedPercent(market.monthlyPriceChangePct ?? 0), [market.monthlyPriceChangePct]);
  const eligibilityFlags = useMemo(() => deriveEligibilityFlags({
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
    buyerProfile: player.buyerProfile,
  }), [player.salary, player.properties, player.firstHomePurchased, player.ownedPrivateHome, player.buyerProfile]);
  const latestCareerReview = player.careerReviewHistory[player.careerReviewHistory.length - 1] ?? null;
  const nextJobSwitchIn = Math.max(player.nextJobSwitchTurn - player.turnCount, 0);
  const openIssues = player.properties.flatMap((property) => property.openMaintenanceIssues ?? []);
  const activeRenovations = player.properties.filter((property) => property.activeRenovation);
  const weakTenant = player.properties.find((property) => property.tenant && property.tenant.satisfaction < 55);
  const latestOperation = player.operationHistory?.[0] ?? null;
  const nextBestMoves = useMemo(() => getNextBestMoves({ player, currentScenario }), [player, currentScenario]);
  const nextHomePlan = useMemo(() => getNextHomePlan(player), [player]);
  const ownershipCampaign = useMemo(() => getOwnershipCampaign(player), [player]);
  const monthlyIntents = useMemo(() => getMonthlyIntentOptions(player), [player]);
  const recommendedMonthlyIntent = monthlyIntents.find((intent) => intent.recommended) ?? monthlyIntents[0] ?? null;
  const firstHomeMissions = useMemo(() => getFirstHomeMissions(player), [player]);
  const lastTurnRecap = useMemo(() => getLastTurnRecap({ player, market, currentScenario }), [player, market, currentScenario]);
  const firstRunQuest = useMemo(() => getFirstRunQuest(player, currentScenario), [player, currentScenario]);
  const beginnerDashboardFocus = settings.guidedMode && player.turnCount <= 6 && player.properties.length === 0 && !settings.compactMode;
  const hideAdvancedPanels = beginnerDashboardFocus && !showAdvancedPanels;
  const hasPropertyAttention = openIssues.length > 0 || activeRenovations.length > 0 || Boolean(weakTenant);
  useEffect(() => {
    if (!isGameActive) navigate('/gameover');
  }, [isGameActive, navigate]);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } } };
  const handleSelectIntent = (intent: MonthlyIntentOption) => {
    applyMonthlyIntent(intent);
    navigate('/dashboard');
  };
  const handleOpenIntent = (intent: MonthlyIntentOption) => {
    prepareMonthlyIntent(intent);
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

        {settings.guidedMode && (
          <motion.div variants={itemVariants} className="mb-6">
            <BeginnerPrimerPanel
              onDisableGuidance={() => updateSettings({ guidedMode: false })}
              onOpenLearn={() => navigate('/learn')}
            />
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="mb-6">
          <LifeCampaignPanel campaign={lifeCampaign} onNavigate={navigate} />
        </motion.div>

        {lastTurnRecap && (
          <motion.div variants={itemVariants} className="mb-6">
            <LastMonthRecapPanel recap={lastTurnRecap} />
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={Wallet}
            label="Spendable Cash"
            value={`S$${(availableCash / 1000).toFixed(1)}K`}
            color="#00F0FF"
            detail={reservedCash > 0 ? `Wallet S$${(player.cash / 1000).toFixed(1)}K | Reserve S$${(reservedCash / 1000).toFixed(1)}K` : 'All wallet cash is currently spendable'}
          />
          <StatCard icon={TrendingUp} label="Net Worth" value={`S$${(netWorth / 1000000).toFixed(2)}M`} color="#00E676" />
          <StatCard icon={Building2} label="Properties" value={String(player.properties.length)} color="#7C4DFF" />
          <StatCard icon={Newspaper} label="Market Index" value={`${market.priceIndex.toFixed(1)}`} color="#FF9100" change={marketChange} />
        </motion.div>

        {reservedCash > 0 && (
          <motion.div variants={itemVariants} className="mb-6">
            <div className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3">
              <p className="label-text mb-1 text-[10px] text-warning">Cash split</p>
              <p className="text-sm leading-relaxed text-text-secondary">
                Spendable cash is safe to use now. Reserved cash is still part of your net worth, but earmarked for repairs, vacancies, and emergency buffer decisions.
              </p>
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="mb-6 grid gap-3 md:grid-cols-4">
          <ActionTile icon={Banknote} title="Earn" detail="Life actions, side gigs, schemes" onClick={() => navigate('/life')} />
          <ActionTile icon={ShoppingBag} title="Buy" detail="Best next listing and filters" onClick={() => navigate('/properties')} />
          <ActionTile icon={PieChart} title="Own" detail="Tenants, repairs, upgrades" onClick={() => navigate('/portfolio')} />
          <ActionTile icon={BookOpen} title="Learn" detail="Rules, blockers, first-run help" onClick={() => navigate('/learn')} />
        </motion.div>

        {player.properties.length > 0 && (
          <motion.div variants={itemVariants} className="mb-6">
            <NextHomeGatewayPanel
              plan={nextHomePlan}
              campaign={ownershipCampaign}
              recommendedIntent={recommendedMonthlyIntent}
              onUseIntent={handleSelectIntent}
              onOpenTarget={() => navigate(nextHomePlan.targetRoute)}
              onAdvanceToNotableMonth={() => advanceToNextNotableMonth()}
            />
          </motion.div>
        )}

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
