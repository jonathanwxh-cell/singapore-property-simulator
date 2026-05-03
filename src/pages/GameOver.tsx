import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/game/useGameStore';
import { selectNetWorth } from '@/engine/selectors';
import { difficultySettings } from '@/game/types';
import GlassCard from '@/components/GlassCard';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import { careers } from '@/data/careers';
import { deriveEligibilityFlags } from '@/engine/eligibility';
import EligibilityBadge from '@/components/EligibilityBadge';

export default function GameOver() {
  const navigate = useNavigate();
  const { player } = useGameStore();

  const netWorth = selectNetWorth(player);
  const target = difficultySettings[player.difficulty].targetNetWorth;
  const won = netWorth >= target;
  const score = Math.round((netWorth / target) * 1000) + player.achievements.length * 100 + player.turnCount * 10;
  const career = careers.find((candidate) => candidate.id === player.careerId) ?? careers[0];
  const startingSalary = Math.round(career.startingSalary * difficultySettings[player.difficulty].salaryModifier);
  const salaryGrowth = player.salary - startingSalary;
  const latestReview = player.careerReviewHistory[player.careerReviewHistory.length - 1] ?? null;
  const eligibilityFlags = deriveEligibilityFlags({
    salary: player.salary,
    properties: player.properties,
    firstHomePurchased: player.firstHomePurchased,
    ownedPrivateHome: player.ownedPrivateHome,
  });

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <GlassCard className="text-center py-10" accentColor={won ? '#FFD700' : '#FF1744'}>
          <Trophy size={56} className={`mx-auto mb-4 ${won ? 'text-yellow-400' : 'text-text-dim'}`} />

          <h1 className="page-title text-3xl text-white mb-2">
            {won ? 'Congratulations!' : 'Game Over'}
          </h1>
          <p className="text-text-secondary mb-6">
            {won
              ? `You reached your target of S$${(target / 1000000).toFixed(0)}M!`
              : `You did not reach the target of S$${(target / 1000000).toFixed(0)}M.`}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6 max-w-xs mx-auto">
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
              New Game
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
