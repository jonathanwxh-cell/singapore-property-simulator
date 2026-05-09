import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { lifeActions, lifeActionsById } from '@/data/lifeActions';
import { runRoutesById } from '@/data/runRoutes';
import { TAKE_HOME_RATIO } from '@/engine/constants';
import { getCommandCenterState } from '@/engine/commandCenter';
import { getNextBestMoves } from '@/engine/decisionCoach';
import { getMonthlyIntentOptions, type MonthlyIntentOption } from '@/engine/monthlyIntents';
import { getOwnershipBeatState } from '@/engine/ownershipMoments';
import { getOwnershipPayoffState } from '@/engine/ownershipPayoffs';
import { getNextHomePlan } from '@/engine/nextHomePlan';
import { getOwnershipTargetRace } from '@/engine/ownershipTargets';
import { getOwnershipCampaign } from '@/engine/ownershipCampaign';
import { getNextHomeShortlist, getOwnershipForkOptions, type OwnershipForkOption } from '@/engine/ownershipForks';
import { getPlaySurfaceState, type PlaySurfaceChoice } from '@/engine/playSurface';
import { getLifeBoardVisualState, getPrimaryLivingHomeVisual } from '@/engine/visuals';
import { deriveEligibilityFlags } from '@/engine/eligibility';
import { getFirstHomeMissions } from '@/engine/firstHomeMissions';
import { getLastTurnRecap } from '@/engine/turnRecap';
import { getFirstRunQuest, type FirstRunQuest } from '@/engine/runQuest';
import {
  selectMonthlyExpenses,
  selectMonthlyHouseholdLoad,
  selectMonthlyNetCashflow,
  selectMonthlyRentalIncome,
  selectMonthlyTakeHome,
} from '@/engine/selectors';
import { useGameStore } from '@/game/useGameStore';
import NextMonthCTA from '@/components/NextMonthCTA';
import { formatSignedPercent } from './dashboard/dashboardFormatters';
import { dashboardContainerVariants, dashboardItemVariants } from './dashboard/dashboardMotion';
import DashboardAdvancedRail from './dashboard/DashboardAdvancedRail';
import ActionTile from './dashboard/panels/ActionTile';
import BeginnerAdvancedGate from './dashboard/panels/BeginnerAdvancedGate';
import BeginnerPrimerPanel from './dashboard/panels/BeginnerPrimerPanel';
import FirstRunQuestPanel from './dashboard/panels/FirstRunQuestPanel';
import LastMonthRecapPanel from './dashboard/panels/LastMonthRecapPanel';
import LifeGoalPanel from './dashboard/panels/LifeGoalPanel';
import NextHomeGatewayPanel from './dashboard/panels/NextHomeGatewayPanel';
import OwnershipForksPanel from './dashboard/panels/OwnershipForksPanel';
import PlaySurfacePanel from './dashboard/panels/PlaySurfacePanel';
import PropertyOperationsPanel from './dashboard/panels/PropertyOperationsPanel';
import {
  Banknote,
  BookOpen,
  PieChart,
  ShoppingBag,
  Sparkles,
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
  const playSurfaceRef = useRef<HTMLDivElement>(null);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthlyTakeHome = selectMonthlyTakeHome(player, TAKE_HOME_RATIO);
  const monthlyRental = selectMonthlyRentalIncome(player);
  const monthlyDebt = selectMonthlyExpenses(player);
  const monthlyHouseholdLoad = selectMonthlyHouseholdLoad(player);
  const monthlyNetCashflow = selectMonthlyNetCashflow(player, TAKE_HOME_RATIO);
  const commandState = useMemo(() => getCommandCenterState(player, currentScenario), [player, currentScenario]);
  const playSurface = useMemo(() => getPlaySurfaceState({ player, currentScenario }), [player, currentScenario]);
  const lifeBoardVisual = useMemo(() => getLifeBoardVisualState(player), [player]);
  const livingHomeVisual = useMemo(() => getPrimaryLivingHomeVisual(player), [player]);
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
  const activeRunRoute = runRoutesById[player.runRouteId ?? 'bto-upgrader'] ?? runRoutesById['bto-upgrader'];
  const beginnerDashboardFocus = settings.guidedMode && player.turnCount <= 6 && player.properties.length === 0 && !settings.compactMode;
  const hideAdvancedPanels = beginnerDashboardFocus && !showAdvancedPanels;
  const hasPropertyAttention = openIssues.length > 0 || activeRenovations.length > 0 || Boolean(weakTenant);
  useEffect(() => {
    if (!isGameActive) navigate('/gameover');
  }, [isGameActive, navigate]);

  const scrollToLifeBoard = () => {
    window.requestAnimationFrame(() => {
      document.querySelector('main')?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });
  };

  const handleSelectIntent = (intent: MonthlyIntentOption) => {
    applyMonthlyIntent(intent);
    navigate('/dashboard');
    scrollToLifeBoard();
  };
  const handleOpenIntent = (intent: MonthlyIntentOption) => {
    prepareMonthlyIntent(intent);
    navigate(intent.route);
  };
  const handlePlayOwnershipFork = (fork: OwnershipForkOption) => {
    applyOwnershipFork(fork);
    navigate('/dashboard');
  };
  const handlePlaySurfaceChoice = (choice: PlaySurfaceChoice) => {
    if (choice.kind === 'intent' && choice.intentId) {
      const intent = monthlyIntents.find((candidate) => candidate.id === choice.intentId);
      if (intent) {
        handleSelectIntent(intent);
        return;
      }
    }
    navigate(choice.route);
  };
  const handleInspectSurfaceChoice = (choice: PlaySurfaceChoice) => {
    if (choice.kind === 'intent' && choice.intentId) {
      const intent = monthlyIntents.find((candidate) => candidate.id === choice.intentId);
      if (intent) {
        handleOpenIntent(intent);
        return;
      }
    }
    navigate(choice.route);
  };
  const handleQuestStep = (step: FirstRunQuest['steps'][number]) => {
    if (step.id === 'choose-monthly-intent') {
      playSurfaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
          <h1 className="page-title text-white">This Month</h1>
          <p className="mt-1 font-rajdhani text-text-secondary">
            {monthNames[player.month - 1]} {player.year} | Age {player.age} | {player.name}'s Singapore life
          </p>
          {!settings.guidedMode && (
            <button
              type="button"
              onClick={() => updateSettings({ guidedMode: true })}
              className="mt-3 inline-flex min-h-11 items-center gap-3 rounded-2xl border border-cyan-glow/30 bg-cyan-glow/10 px-4 py-2 text-left text-cyan-glow shadow-[0_0_22px_rgba(0,240,255,0.08)] transition-colors hover:border-cyan-glow/55 hover:bg-cyan-glow/15"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-glow/35 bg-cyan-glow/15">
                <Sparkles size={16} />
              </span>
              <span>
                <span className="label-text block text-[10px] text-cyan-glow">Guidance is off</span>
                <span className="block text-xs text-text-secondary">Turn guided help back on</span>
              </span>
            </button>
          )}
        </motion.div>

        <motion.div ref={playSurfaceRef} variants={dashboardItemVariants} className="scroll-mt-24">
          <PlaySurfacePanel
            state={playSurface}
            boardVisual={lifeBoardVisual}
            homeVisual={livingHomeVisual}
            compactMode={settings.compactMode}
            highlighted={highlightMonthlyIntent}
            advanceSlot={<NextMonthCTA variant="inline" />}
            onPlayChoice={handlePlaySurfaceChoice}
            onInspectChoice={handleInspectSurfaceChoice}
            onToggleCompact={() => updateSettings({ compactMode: !settings.compactMode })}
          />
        </motion.div>

        <motion.div variants={dashboardItemVariants} className="mb-6">
          <LifeGoalPanel routeLabel={activeRunRoute.label} routeTagline={activeRunRoute.tagline} />
        </motion.div>

        <motion.div variants={dashboardItemVariants} className="mb-6 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <FirstRunQuestPanel quest={firstRunQuest} onNavigate={navigate} onContinueStep={handleQuestStep} />
          {settings.guidedMode ? (
            <BeginnerPrimerPanel
              onDisableGuidance={() => updateSettings({ guidedMode: false })}
              onOpenLearn={() => navigate('/learn')}
            />
          ) : lastTurnRecap ? (
            <LastMonthRecapPanel recap={lastTurnRecap} />
          ) : null}
        </motion.div>

        {lastTurnRecap && settings.guidedMode && (
          <motion.div variants={dashboardItemVariants} className="mb-6">
            <LastMonthRecapPanel recap={lastTurnRecap} />
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
