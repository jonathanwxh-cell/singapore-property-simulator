import { useNavigate } from 'react-router-dom';
import { achievements, tierColors } from '@/data/achievements';
import GlassCard from '@/components/GlassCard';
import { Trophy, ArrowLeft, Award, Star, Crown, Medal } from 'lucide-react';

// Mock leaderboard data
const leaderboardData = [
  { name: 'PropertyKing', score: 28500, netWorth: 52000000, turns: 89, difficulty: 'tycoon' as const },
  { name: 'SGInvestor', score: 22400, netWorth: 38000000, turns: 120, difficulty: 'hard' as const },
  { name: 'CondoCollector', score: 18900, netWorth: 22000000, turns: 76, difficulty: 'normal' as const },
  { name: 'HDBHero', score: 15200, netWorth: 16000000, turns: 95, difficulty: 'normal' as const },
  { name: 'TycoonTrainee', score: 12100, netWorth: 12000000, turns: 65, difficulty: 'hard' as const },
  { name: 'RentalRich', score: 9800, netWorth: 8500000, turns: 55, difficulty: 'easy' as const },
  { name: 'FlipperPro', score: 7600, netWorth: 6200000, turns: 42, difficulty: 'normal' as const },
  { name: 'NewbieAgent', score: 4200, netWorth: 3500000, turns: 30, difficulty: 'easy' as const },
];

const rankIcons = [Crown, Medal, Medal, Star, Star, Star, Award, Award];

const difficultyColors: Record<string, string> = {
  easy: '#00E676',
  normal: '#00F0FF',
  hard: '#FF9100',
  tycoon: '#FF1744',
};

export default function Leaderboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-secondary hover:text-cyan-glow transition-colors mb-4">
          <ArrowLeft size={18} />
          <span className="font-rajdhani text-sm uppercase">Back</span>
        </button>

        <h1 className="page-title text-white mb-6 text-center flex items-center justify-center gap-3">
          <Trophy size={28} className="text-yellow-400" />
          Leaderboard
        </h1>

        {/* Top 3 Podium */}
        <div className="flex items-end justify-center gap-3 mb-8 h-40">
          {leaderboardData.slice(0, 3).map((entry, i) => {
            const heights = ['h-24', 'h-36', 'h-28'];
            const medals = ['text-gray-400', 'text-yellow-400', 'text-orange-400'];
            const actualIndex = i === 0 ? 1 : i === 1 ? 0 : 2;
            const RankIcon = rankIcons[actualIndex];
            return (
              <div key={actualIndex} className={`flex flex-col items-center ${heights[i]} w-24`}>
                <RankIcon size={24} className={medals[i]} />
                <p className="text-white text-xs font-rajdhani font-semibold mt-1 truncate w-full text-center">{entry.name}</p>
                <p className="font-mono text-cyan-glow text-[10px]">{entry.score.toLocaleString()}</p>
                <div
                  className="w-full mt-2 rounded-t-lg"
                  style={{
                    height: '100%',
                    background: `linear-gradient(to top, ${difficultyColors[entry.difficulty]}30, ${difficultyColors[entry.difficulty]}10)`,
                    borderTop: `2px solid ${difficultyColors[entry.difficulty]}`,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Full Table */}
        <GlassCard>
          <h3 className="section-title text-white mb-4">All Rankings</h3>
          <div className="space-y-2">
            {leaderboardData.map((entry, i) => {
              const RankIcon = rankIcons[i] || Award;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-8 text-center">
                    <span className="font-mono text-text-dim text-sm">{i + 1}</span>
                  </div>
                  <RankIcon size={16} className={i < 3 ? 'text-yellow-400' : 'text-text-dim'} />
                  <div className="flex-1 min-w-0">
                    <p className="font-rajdhani font-semibold text-white text-sm truncate">{entry.name}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-text-dim text-[10px]">Net Worth</p>
                    <p className="font-mono text-white text-xs">S${(entry.netWorth / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-text-dim text-[10px]">Turns</p>
                    <p className="font-mono text-white text-xs">{entry.turns}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-rajdhani uppercase"
                      style={{ backgroundColor: `${difficultyColors[entry.difficulty]}20`, color: difficultyColors[entry.difficulty] }}
                    >
                      {entry.difficulty}
                    </span>
                  </div>
                  <div className="text-right w-16">
                    <p className="font-mono text-cyan-glow text-sm font-bold">{entry.score.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Achievement Gallery */}
        <h3 className="section-title text-white mt-8 mb-4">Achievement Gallery</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {achievements.filter(a => !a.secret).map((a) => (
            <div
              key={a.id}
              className="p-3 rounded-lg text-center"
              style={{
                backgroundColor: `${tierColors[a.tier]}10`,
                border: `1px solid ${tierColors[a.tier]}30`,
              }}
            >
              <Award size={20} style={{ color: tierColors[a.tier] }} className="mx-auto mb-1" />
              <p className="font-rajdhani font-semibold text-white text-xs truncate">{a.name}</p>
              <p className="text-[10px] font-mono" style={{ color: tierColors[a.tier] }}>{a.points}pts</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
