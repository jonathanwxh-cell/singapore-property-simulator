import { motion } from 'framer-motion';
import type { NavigateFunction } from 'react-router-dom';
import { BatteryCharging, Building2, Flame, House } from 'lucide-react';
import ProgressivePanel from '@/components/ProgressivePanel';
import RuleGlossaryPanel from '@/components/RuleGlossaryPanel';
import RunArcPanel from '@/components/RunArcPanel';
import SceneImage from '@/components/SceneImage';
import { properties } from '@/data/properties';
import type { CommandCenterState } from '@/engine/commandCenter';
import type { CoachMove } from '@/engine/decisionCoach';
import type { FirstHomeMission } from '@/engine/firstHomeMissions';
import type { LifeActionDefinition } from '@/data/lifeActions';
import type { CareerReviewHistoryEntry, MarketState, OwnedProperty, Player } from '@/game/types';
import { CashflowRow, DecisionMoveCard, FirstHomeMissionCard, LifeRow } from './DashboardComponents';
import { dashboardItemVariants } from './dashboardMotion';
import CareerReviewPanel from './panels/CareerReviewPanel';
import EligibilitySummaryPanel from './panels/EligibilitySummaryPanel';

interface DashboardAdvancedRailProps {
  player: Player;
  market: MarketState;
  commandState: CommandCenterState;
  nextBestMoves: CoachMove[];
  firstHomeMissions: FirstHomeMission[];
  selectedPrimaryAction: LifeActionDefinition;
  selectedSecondaryAction: LifeActionDefinition | null;
  latestCareerReview: CareerReviewHistoryEntry | null;
  nextJobSwitchIn: number;
  marketChange: string;
  monthlyTakeHome: number;
  monthlyRental: number;
  monthlyDebt: number;
  monthlyHouseholdLoad: number;
  monthlyNetCashflow: number;
  eligibilityFlags: ReturnType<typeof import('@/engine/eligibility').deriveEligibilityFlags>;
  navigate: NavigateFunction;
}

export default function DashboardAdvancedRail({
  player,
  market,
  commandState,
  nextBestMoves,
  firstHomeMissions,
  selectedPrimaryAction,
  selectedSecondaryAction,
  latestCareerReview,
  nextJobSwitchIn,
  marketChange,
  monthlyTakeHome,
  monthlyRental,
  monthlyDebt,
  monthlyHouseholdLoad,
  monthlyNetCashflow,
  eligibilityFlags,
  navigate,
}: DashboardAdvancedRailProps) {
  return (
    <>
      <div className="mb-6 grid gap-4 xl:grid-cols-[1.3fr,0.9fr]">
        <motion.div variants={dashboardItemVariants}>
          <CareerReviewPanel
            latestCareerReview={latestCareerReview}
            nextJobSwitchIn={nextJobSwitchIn}
          />
        </motion.div>
        <motion.div variants={dashboardItemVariants}>
          <EligibilitySummaryPanel
            eligibilityFlags={eligibilityFlags}
            player={player}
          />
        </motion.div>
      </div>

      <div className="space-y-4">
        <motion.div variants={dashboardItemVariants}>
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

        <motion.div variants={dashboardItemVariants}>
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

        <motion.div variants={dashboardItemVariants}>
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

        <motion.div variants={dashboardItemVariants}>
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

        <motion.div variants={dashboardItemVariants}>
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

        <motion.div variants={dashboardItemVariants}>
          <ProgressivePanel
            title="Rules Glossary"
            eyebrow="Learn"
            summary="CPF, ABSD, MOP, MSR, TDSR, reserves, and room rental explained only when you need the rulebook."
            defaultOpen={commandState.panelDefaults.rules === 'open'}
          >
            <RuleGlossaryPanel termIds={['absd', 'cpf-oa', 'mop', 'hdb-room-rental', 'msr', 'tdsr', 'reserve-cash']} />
          </ProgressivePanel>
        </motion.div>

        <motion.div variants={dashboardItemVariants} className="grid gap-4 lg:grid-cols-2">
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
                {player.properties.slice(0, 5).map((holding, index) => (
                  <MiniPortfolioRow
                    key={`${holding.propertyId}-${index}`}
                    holding={holding}
                    fallbackLabel={`Property #${index + 1}`}
                    onOpen={(propertyId) => navigate(`/property/${propertyId}`)}
                  />
                ))}
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
  );
}

interface MiniPortfolioRowProps {
  holding: OwnedProperty;
  fallbackLabel: string;
  onOpen: (propertyId: string) => void;
}

function MiniPortfolioRow({ holding, fallbackLabel, onOpen }: MiniPortfolioRowProps) {
  const propInfo = properties.find((property) => property.id === holding.propertyId);
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded px-2 py-2 text-left transition-colors hover:bg-white/5"
      onClick={() => propInfo && onOpen(propInfo.id)}
    >
      <span>
        <span className="block text-sm font-medium text-white">{propInfo ? propInfo.name : fallbackLabel}</span>
        <span className="block text-xs text-text-dim">Purchased: {holding.purchaseDate}</span>
      </span>
      <span className="text-right">
        <span className="block font-mono text-sm text-cyan-glow">S${(holding.currentValue / 1000).toFixed(0)}K</span>
        <span className={`block text-[10px] ${holding.isRented ? 'text-cyan-glow' : 'text-text-dim'}`}>{holding.isRented ? 'Rented' : 'Vacant'}</span>
      </span>
    </button>
  );
}
