import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useGameStore } from '@/game/useGameStore';
import { selectNetWorth } from '@/engine/selectors';
import { difficultySettings } from '@/game/types';
import GlassCard from '@/components/GlassCard';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import { careers } from '@/data/careers';
import { deriveEligibilityFlags } from '@/engine/eligibility';
import EligibilityBadge from '@/components/EligibilityBadge';
import { runRoutesById } from '@/data/runRoutes';
import { scoreRunRoute } from '@/engine/runDirector';
import { detectLifetimeEnding, type LifetimeEndingResult } from '@/engine/lifetime/endings';
import { getGameOverRedirectTarget } from './gameOverGuards';
import PageSceneHero, { HeroAction } from '@/components/visuals/PageSceneHero';

export default function GameOver() {
  const navigate = useNavigate();
  const { player, isGameActive } = useGameStore();
  const redirectTarget = getGameOverRedirectTarget(player, isGameActive);

  useEffect(() => {
    if (redirectTarget) navigate(redirectTarget, { replace: true });
  }, [navigate, redirectTarget]);

  if (redirectTarget) {
    return (
      <div className="min-h-[calc(100dvh-64px)] bg-deep-space flex items-center justify-center px-4">
        <GlassCard className="max-w-md text-center">
          <p className="label-text text-[10px] text-cyan-glow">Run still in progress</p>
          <h1 className="section-title mt-2 text-white">Returning you to the right screen</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Endings unlock only after the run actually resolves.
          </p>
        </GlassCard>
      </div>
    );
  }

  const netWorth = selectNetWorth(player);
  const target = difficultySettings[player.difficulty].targetNetWorth;
  const won = netWorth >= target;
  const score = Math.round((netWorth / target) * 1000) + player.achievements.length * 100 + player.turnCount * 10;
  const lifetimeEnding = detectLifetimeEnding(player, won ? 'won' : 'lost');
  const career = careers.find((candidate) => candidate.id === player.careerId) ?? careers[0];
  const startingSalary = Math.round(career.startingSalary * difficultySettings[player.difficulty].salaryModifier);
  const salaryGrowth = player.salary - startingSalary;
  const latestReview = player.careerReviewHistory[player.careerReviewHistory.length - 1] ?? null;
  const routeScore = scoreRunRoute(player);
  const suggestedRoute = runRoutesById[routeScore.suggestedNextRouteId];
  const eligibilityFlags = deriveEligibilityFlags({
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
    buyerProfile: player.buyerProfile,
  });

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space flex items-center justify-center px-4">
      <div className="w-full max-w-5xl py-8">
        <PageSceneHero
          variant="portfolio"
          eyebrow="Run ending"
          title={lifetimeEnding.ending.label}
          subtitle={lifetimeEnding.ending.summary}
          className="mb-6"
          stats={[
            { label: 'Final Net Worth', value: `S$${(netWorth / 1000000).toFixed(2)}M`, tone: won ? 'good' : 'warn' },
            { label: 'Score', value: score.toLocaleString(), tone: 'neutral' },
            { label: 'Properties', value: String(player.properties.length), tone: player.properties.length > 0 ? 'good' : 'warn' },
          ]}
          actions={<HeroAction onClick={() => navigate('/newgame')}>Replay a different life</HeroAction>}
        />

        <GlassCard className="text-center py-10" accentColor={won ? '#FFD700' : '#FF1744'}>
          <Trophy size={56} className={`mx-auto mb-4 ${won ? 'text-yellow-400' : 'text-text-dim'}`} />

          <LifetimeEndingSummary result={lifetimeEnding} />
          <p className="text-text-dim mt-3 mb-6">
            {won
              ? `You reached your target of S$${(target / 1000000).toFixed(0)}M!`
              : `You did not reach the target of S$${(target / 1000000).toFixed(0)}M.`}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6 max-w-2xl mx-auto md:grid-cols-4">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-text-dim text-[10px] uppercase">Final Net Worth</p>
              <p className="font-mono text-cyan-glow text-lg">S${(netWorth / 1000000).toFixed(2)}M</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-text-dim text-[10px] uppercase">Final Score</p>
              <p className="font-mono text-warning text-lg">{score.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-text-dim text-[10px] uppercase">Turns Played</p>
              <p className="font-mono text-white">{player.turnCount}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-text-dim text-[10px] uppercase">Properties</p>
              <p className="font-mono text-white">{player.properties.length}</p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-glass-border bg-white/5 p-4 text-left">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="label-text text-text-dim text-[10px] mb-1">Route Recap</p>
                <h2 className="section-title text-white">{routeScore.routeLabel}</h2>
              </div>
              <p className="font-mono text-lg text-cyan-glow">{routeScore.score}</p>
            </div>
            <p className="text-text-secondary text-sm">{routeScore.summary}</p>
            <p className="text-text-dim text-xs mt-2">{routeScore.nextLesson}</p>
            <div className="mt-3 rounded-lg border border-cyan-glow/20 bg-cyan-glow/10 p-3">
              <p className="text-cyan-glow text-xs font-mono uppercase tracking-[0.08em]">Try next</p>
              <p className="text-white text-sm font-semibold mt-1">{suggestedRoute.label}</p>
              <p className="text-text-secondary text-xs mt-1">{suggestedRoute.tagline}</p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-glass-border bg-white/5 p-4 text-left">
            <h2 className="section-title text-white mb-3">Progression Recap</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {eligibilityFlags.firstTimer && <EligibilityBadge label="First-Timer" tone="good" />}
              {eligibilityFlags.upgrader && <EligibilityBadge label="Upgrader" tone="warn" />}
              {eligibilityFlags.homeowner && <EligibilityBadge label="Homeowner" tone="warn" />}
              {player.ownedPrivateHome && <EligibilityBadge label="Private-Home Owner" tone="warn" />}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <RecapRow label="Career Path" value={career.name} />
              <RecapRow label="Annual Reviews" value={String(player.careerProgressionProfile.reviewCount)} />
              <RecapRow label="Salary Growth" value={`${salaryGrowth >= 0 ? '+' : '-'}S$${Math.abs(salaryGrowth).toLocaleString()}`} />
              <RecapRow label="Current Salary" value={`S$${player.salary.toLocaleString()}`} />
              <RecapRow label="First Purchase" value={player.firstHomePurchased ? 'Completed' : 'Not reached'} />
              <RecapRow label="Latest Review" value={latestReview ? formatCareerOutcome(latestReview.outcome) : 'None yet'} />
            </div>
          </div>

          <div className="space-y-2">
            <button onClick={() => navigate('/newgame')} className="btn-primary w-full flex items-center justify-center gap-2">
              <RotateCcw size={16} />
              Replay A Different Life
            </button>
            <button onClick={() => navigate('/')} className="btn-secondary w-full flex items-center justify-center gap-2">
              <Home size={16} />
              Main Menu
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export function LifetimeEndingSummary({ result }: { result: LifetimeEndingResult }) {
  return (
    <div className="mb-6">
      <p className="label-text text-[11px] text-cyan-glow">This was your Singapore life</p>
      <h1 className="page-title mt-2 text-4xl text-white">{result.ending.label}</h1>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-text-secondary">{result.ending.summary}</p>

      <div className="mt-6 grid gap-4 text-left lg:grid-cols-[0.85fr,1.15fr]">
        <div className="rounded-xl border border-glass-border bg-white/5 p-4">
          <p className="label-text text-text-dim text-[10px] mb-2">Why you got this ending</p>
          <ul className="space-y-2 text-sm text-text-secondary">
            {result.reasons.map((reason) => (
              <li key={reason} className="rounded-lg bg-black/20 p-3">{reason}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-glass-border bg-white/5 p-4">
          <p className="label-text text-text-dim text-[10px] mb-2">Recent life memories</p>
          {result.memories.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {result.memories.map((memory) => (
                <article key={memory.id} className="rounded-lg bg-black/20 p-3">
                  <p className="label-text text-[10px] text-text-dim">
                    {memory.year}.{String(memory.month).padStart(2, '0')}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-white">{memory.title}</h3>
                  <p className="mt-1 text-xs text-text-secondary">{memory.detail}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-black/20 p-3 text-sm text-text-secondary">
              No major life memories were logged yet. Future runs will collect home, career, family, landlord, and setback beats as you play.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCareerOutcome(outcome: 'promotion' | 'bonus' | 'steady' | 'setback' | null): string {
  if (outcome === 'promotion') return 'Promotion';
  if (outcome === 'bonus') return 'Bonus';
  if (outcome === 'steady') return 'Steady';
  if (outcome === 'setback') return 'Setback';
  return 'Career Review';
}

function RecapRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/20 p-3">
      <p className="text-text-dim text-[10px] uppercase">{label}</p>
      <p className="mt-1 text-sm text-white">{value}</p>
    </div>
  );
}
