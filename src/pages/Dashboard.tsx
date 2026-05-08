import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CommandCenterHero from '@/components/CommandCenterHero';
import LifeCampaignPanel from '@/components/LifeCampaignPanel';
import { lifeActions, lifeActionsById } from '@/data/lifeActions';
import { TAKE_HOME_RATIO } from '@/engine/constants';
import { getCommandCenterState } from '@/engine/commandCenter';
import { getLifeCampaign } from '@/engine/lifeCampaign';
import { getNextBestMoves } from '@/engine/decisionCoach';
import { getMonthlyIntentOptions, type MonthlyIntentOption } from '@/engine/monthlyIntents';
import { getOwnershipBeatState } from '@/engine/ownershipMoments';
import { getOwnershipPayoffState } from '@/engine/ownershipPayoffs';
import { getNextHomePlan } from '@/engine/nextHomePlan';
import { getOwnershipTargetRace } from '@/engine/ownershipTargets';
import { getOwnershipCampaign } from '@/engine/ownershipCampaign';
import { getNextHomeShortlist, getOwnershipForkOptions, type OwnershipForkOption } from '@/engine/ownershipForks';
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
import { StatCard } from './dashboard/DashboardComponents';
import { formatSignedPercent } from './dashboard/dashboardFormatters';
import { dashboardContainerVariants, dashboardItemVariants } from './dashboard/dashboardMotion';
import DashboardAdvancedRail from './dashboard/DashboardAdvancedRail';
import ActionTile from './dashboard/panels/ActionTile';
import BeginnerAdvancedGate from './dashboard/panels/BeginnerAdvancedGate';
import BeginnerPrimerPanel from './dashboard/panels/BeginnerPrimerPanel';
import FirstRunQuestPanel from './dashboard/panels/FirstRunQuestPanel';
import LastMonthRecapPanel from './dashboard/panels/LastMonthRecapPanel';
import MonthlyIntentPanel from './dashboard/panels/MonthlyIntentPanel';
import NextHomeGatewayPanel from './dashboard/panels/NextHomeGatewayPanel';
import OwnershipForksPanel from './dashboard/panels/OwnershipForksPanel';
import PropertyOperationsPanel from './dashboard/panels/PropertyOperationsPanel';
import {
  Banknote,
  BookOpen,
  Building2,
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
    applyOwnershipFork,
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
  const ownershipBeatState = useMemo(() => getOwnershipBeatState(player), [player]);
  const ownershipTargetRace = useMemo(() => getOwnershipTargetRace(player), [player]);
  const ownershipPayoffState = useMemo(() => getOwnershipPayoffState(player), [player]);
  const ownershipForks = useMemo(() => getOwnershipForkOptions(player), [player]);
  const nextHomeShortlist = useMemo(() => getNextHomeShortlist(player), [player]);
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

  const handleSelectIntent = (intent: MonthlyIntentOption) => {
    applyMonthlyIntent(intent);
    navigate('/dashboard');
  };
  const handleOpenIntent = (intent: MonthlyIntentOption) => {
    prepareMonthlyIntent(intent);
    navigate(intent.route);
  };
  const handlePlayOwnershipFork = (fork: OwnershipForkOption) => {
    applyOwnershipFork(fork);
    navigate('/dashboard');
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
      <motion.div variants={dashboardContainerVariants} initial="hidden" animate="show" className="mx-auto max-w-6xl">
        <motion.div variants={dashboardItemVariants} className="mb-5 pt-1">
          <h1 className="page-title text-white">Home Command Center</h1>
          <p className="mt-1 font-rajdhani text-text-secondary">
            {monthNames[player.month - 1]} {player.year} | Turn {player.turnCount} | Age {player.age} | Welcome, {player.name}
          </p>
        </motion.div>

        <motion.div variants={dashboardItemVariants}>
          <CommandCenterHero state={commandState} onNavigate={navigate} />
        </motion.div>

        <motion.div variants={dashboardItemVariants} className="mb-6">
          <FirstRunQuestPanel quest={firstRunQuest} onNavigate={navigate} onContinueStep={handleQuestStep} />
        </motion.div>

        {settings.guidedMode && (
          <motion.div variants={dashboardItemVariants} className="mb-6">
            <BeginnerPrimerPanel
              onDisableGuidance={() => updateSettings({ guidedMode: false })}
              onOpenLearn={() => navigate('/learn')}
            />
          </motion.div>
        )}

        <motion.div variants={dashboardItemVariants} className="mb-6">
          <LifeCampaignPanel campaign={lifeCampaign} onNavigate={navigate} />
        </motion.div>

        {lastTurnRecap && (
          <motion.div variants={dashboardItemVariants} className="mb-6">
            <LastMonthRecapPanel recap={lastTurnRecap} />
          </motion.div>
        )}

        <motion.div variants={dashboardItemVariants} className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          <motion.div variants={dashboardItemVariants} className="mb-6">
            <div className="rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3">
              <p className="label-text mb-1 text-[10px] text-warning">Cash split</p>
              <p className="text-sm leading-relaxed text-text-secondary">
                Spendable cash is safe to use now. Reserved cash is still part of your net worth, but earmarked for repairs, vacancies, and emergency buffer decisions.
              </p>
            </div>
          </motion.div>
        )}

        <motion.div variants={dashboardItemVariants} className="mb-6 grid gap-3 md:grid-cols-4">
          <ActionTile icon={Banknote} title="Earn" detail="Life actions, side gigs, schemes" onClick={() => navigate('/life')} />
          <ActionTile icon={ShoppingBag} title="Buy" detail="Best next listing and filters" onClick={() => navigate('/properties')} />
          <ActionTile icon={PieChart} title="Own" detail="Tenants, repairs, upgrades" onClick={() => navigate('/portfolio')} />
          <ActionTile icon={BookOpen} title="Learn" detail="Rules, blockers, first-run help" onClick={() => navigate('/learn')} />
        </motion.div>

        {player.properties.length > 0 && (
          <motion.div variants={dashboardItemVariants} className="mb-6">
            <NextHomeGatewayPanel
              plan={nextHomePlan}
              campaign={ownershipCampaign}
              beatState={ownershipBeatState}
              targetRace={ownershipTargetRace}
              payoffState={ownershipPayoffState}
              recommendedIntent={recommendedMonthlyIntent}
              onUseIntent={handleSelectIntent}
              onOpenTarget={() => navigate(nextHomePlan.targetRoute)}
              onAdvanceToNotableMonth={() => advanceToNextNotableMonth()}
            />
          </motion.div>
        )}

        {ownershipCampaign.active && ownershipForks.length > 0 && (
          <motion.div variants={dashboardItemVariants} className="mb-6">
            <OwnershipForksPanel
              beatState={ownershipBeatState}
              forks={ownershipForks}
              shortlist={nextHomeShortlist}
              onPlayFork={handlePlayOwnershipFork}
              onOpenRoute={(route) => navigate(route)}
              onOpenBuy={() => navigate('/properties')}
            />
          </motion.div>
        )}

        <motion.div ref={monthlyIntentRef} variants={dashboardItemVariants} className="mb-6 scroll-mt-24">
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
          <motion.div variants={dashboardItemVariants} className="mb-6">
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
          <motion.div variants={dashboardItemVariants} className="mb-6">
            <BeginnerAdvancedGate
              onShow={() => setShowAdvancedPanels(true)}
              onLearn={() => navigate('/learn')}
            />
          </motion.div>
        ) : (
          <DashboardAdvancedRail
            player={player}
            market={market}
            commandState={commandState}
            nextBestMoves={nextBestMoves}
            firstHomeMissions={firstHomeMissions}
            selectedPrimaryAction={selectedPrimaryAction}
            selectedSecondaryAction={selectedSecondaryAction}
            latestCareerReview={latestCareerReview}
            nextJobSwitchIn={nextJobSwitchIn}
            marketChange={marketChange}
            monthlyTakeHome={monthlyTakeHome}
            monthlyRental={monthlyRental}
            monthlyDebt={monthlyDebt}
            monthlyHouseholdLoad={monthlyHouseholdLoad}
            monthlyNetCashflow={monthlyNetCashflow}
            eligibilityFlags={eligibilityFlags}
            navigate={navigate}
          />
        )}
      </motion.div>
    </div>
  );
}
