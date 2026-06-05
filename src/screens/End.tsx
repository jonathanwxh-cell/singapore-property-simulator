import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '@/game/useGameStore';
import { difficultySettings } from '@/game/types';
import { selectNetWorth } from '@/engine/selectors';
import { BigButton, Btn } from '@/ui/Button';
import { Money } from '@/ui/Money';
import { fireConfetti } from '@/ui/confetti';
import { playKeys, playFail } from '@/ui/sound';
import { lifeTitle } from '@/game-ui/derive';
import { playerRank, getLeaderboard } from '@/game-ui/rivals';

export default function End() {
  const navigate = useNavigate();
  const player = useGameStore((s) => s.player);
  const netWorth = selectNetWorth(player);
  const target = difficultySettings[player.difficulty].targetNetWorth;
  const won = netWorth >= target;
  const years = Math.floor(player.turnCount / 12);
  const months = player.turnCount % 12;
  const score = Math.max(0, Math.round(netWorth / 1000 - player.turnCount * 8));
  const { rank, of } = playerRank(player);

  useEffect(() => {
    if (player.turnCount === 0) { navigate('/', { replace: true }); return; }
    if (won) {
      playKeys();
      fireConfetti({ count: 140, power: 1.2 });
      const t = setTimeout(() => fireConfetti({ x: 0.25, y: 0.4, count: 60 }), 450);
      return () => clearTimeout(t);
    }
    playFail();
  }, [won]);

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[480px] flex-col items-center justify-center px-6 py-10 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        className="text-[72px]"
      >
        {won ? '🏆' : '🌧️'}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="font-display text-4xl font-bold text-ink"
      >
        {won ? 'Financial Freedom!' : 'The dream slips away'}
      </motion.h1>

      <p className="mt-2 max-w-[20rem] text-balance text-[15px] text-ink-soft">
        {won
          ? `${player.name} made it — from renting and dreaming to a ${lifeTitle(player).toLowerCase()} who never has to worry about money again.`
          : `${player.name}'s portfolio couldn't carry its costs. Back to renting — but every mogul has a comeback story.`}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="pl-card mt-7 w-full p-5"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Final net worth</div>
            <div className="text-2xl font-extrabold text-money"><Money value={netWorth} compact animate /></div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Time taken</div>
            <div className="tabnums text-2xl font-extrabold text-ink">{years}y {months}m</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Ended at age</div>
            <div className="tabnums text-2xl font-extrabold text-ink">{player.age}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Score</div>
            <div className="tabnums text-2xl font-extrabold text-gold">{score.toLocaleString()}</div>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-paper-2 px-3 py-2 text-[13px] font-semibold text-ink-soft">
          {won ? '🎉' : '💪'} “{won ? 'I keyed in freedom' : 'I’ll be back'} — {player.properties.length} properties, {difficultySettings[player.difficulty].label} mode.”
        </div>
      </motion.div>

      {/* Final standing vs the kiasu crowd */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="pl-card mt-4 w-full p-4 text-left"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="font-jakarta text-[14px] font-bold text-ink">Final standing</span>
          <span className="pl-chip bg-paper-2 text-ink-soft">#{rank} of {of}</span>
        </div>
        {getLeaderboard(player).map((row, i) => (
          <div key={row.name + i} className={`flex items-center gap-2.5 py-1 ${row.you ? 'font-extrabold text-coral' : 'text-ink-soft'}`}>
            <span className="tabnums w-4 text-[12px]">{i + 1}</span>
            <span>{row.emoji}</span>
            <span className="flex-1 truncate text-[13px]">{row.you ? `${row.name} (you)` : row.name}</span>
            <span className="tabnums text-[12.5px] font-bold"><Money value={row.netWorth} compact /></span>
          </div>
        ))}
      </motion.div>

      <div className="mt-7 w-full space-y-3">
        <BigButton tone="coral" onClick={() => navigate('/new')} icon={<span>↻</span>}>Play again</BigButton>
        <Btn tone="ghost" full onClick={() => navigate('/')}>Back to title</Btn>
      </div>
    </div>
  );
}
