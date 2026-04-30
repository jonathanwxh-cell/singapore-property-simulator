import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/game/useGameStore';
import { difficultySettings } from '@/game/types';
import { INSOLVENCY_STRIKES_LIMIT } from '@/engine/constants';
import { selectNetWorth } from '@/engine/selectors';
import GlassCard from '@/components/GlassCard';
import { Trophy, RotateCcw, Home } from 'lucide-react';

export default function GameOver() {
  const navigate = useNavigate();
  const { player } = useGameStore();

  const netWorth = selectNetWorth(player);
  const target = difficultySettings[player.difficulty].targetNetWorth;
  const won = netWorth >= target;
  const score = Math.round((netWorth / target) * 1000) + player.achievements.length * 100 + player.turnCount * 10;

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
              : player.bankruptcyStrikes >= INSOLVENCY_STRIKES_LIMIT
                ? 'You stayed insolvent for three consecutive turns.'
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
