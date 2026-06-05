import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '@/game/useGameStore';
import { readAutoSave } from '@/game/savePersistence';
import { StatusStrip } from './play/StatusStrip';
import { QuietHub, type Overlay } from './play/QuietHub';
import { DecisionCard } from './play/DecisionCard';
import { BuySheet } from './play/BuySheet';
import { PortfolioSheet } from './play/PortfolioSheet';
import { BankSheet } from './play/BankSheet';
import { YouSheet } from './play/YouSheet';
import { BigButton } from '@/ui/Button';
import { useToast } from '@/ui/Toast';
import { playWoosh } from '@/ui/sound';
import { setSoundEnabled } from '@/ui/sound';
import { fireConfetti } from '@/ui/confetti';
import { formatCompactCurrency } from '@/lib/format';
import { selectNetWorth } from '@/engine/selectors';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Play() {
  const navigate = useNavigate();
  const player = useGameStore((s) => s.player);
  const market = useGameStore((s) => s.market);
  const currentScenario = useGameStore((s) => s.currentScenario);
  const isGameActive = useGameStore((s) => s.isGameActive);
  const soundEnabled = useGameStore((s) => s.settings.soundEnabled);
  const nextTurn = useGameStore((s) => s.nextTurn);
  const loadGame = useGameStore((s) => s.loadGame);
  const toast = useToast();

  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const wasActive = useRef(isGameActive);

  // Keep sound in sync with settings.
  useEffect(() => { setSoundEnabled(soundEnabled); }, [soundEnabled]);

  // On a cold load (e.g. refresh), revive the autosave or bounce home — so we
  // never flash the ending screen for someone mid-game.
  useEffect(() => {
    if (useGameStore.getState().isGameActive) return;
    const saved = readAutoSave();
    if (saved) loadGame(saved);
    else navigate('/', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Latch the scenario locally so the outcome stays on screen even after the
  // store clears `currentScenario` on resolve.
  useEffect(() => { if (currentScenario) setActiveScenario(currentScenario); }, [currentScenario]);

  // Real game-over (active → inactive transition) → ending screen.
  useEffect(() => {
    if (wasActive.current && !isGameActive) navigate('/end');
    wasActive.current = isGameActive;
  }, [isGameActive, navigate]);

  const advance = () => {
    const before = useGameStore.getState().player;
    const beforeNet = selectNetWorth(before);
    const beforeProps = before.properties.length;
    nextTurn();
    const after = useGameStore.getState().player;
    const afterMarket = useGameStore.getState().market;
    playWoosh();

    const cashDelta = Math.round(after.cash - before.cash);
    const label = `${MONTHS[(after.month - 1) % 12]} ${after.year}`;
    toast({
      emoji: '📅',
      tone: cashDelta >= 0 ? 'good' : 'bad',
      title: `${label} · ${cashDelta >= 0 ? '+' : '−'}${formatCompactCurrency(Math.abs(cashDelta))}`,
      body: afterMarket.lastHeadline ?? 'The month rolls on.',
    });

    // Milestone juice: crossing $1M, first $100k.
    const afterNet = selectNetWorth(after);
    if (beforeNet < 1_000_000 && afterNet >= 1_000_000) {
      fireConfetti({ count: 100 });
      toast({ emoji: '💰', tone: 'gold', title: 'Millionaire!', body: 'Your net worth just crossed S$1,000,000.' });
    }
    if (beforeProps === 0 && after.properties.length === 0 && after.turnCount % 24 === 0 && afterNet > beforeNet) {
      // gentle long-haul encouragement handled elsewhere
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <StatusStrip player={player} market={market} onOpenYou={() => setOverlay('you')} />

      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 pb-32 pt-3">
        {activeScenario ? (
          <DecisionCard scenarioId={activeScenario} onResolved={() => setActiveScenario(null)} />
        ) : (
          <QuietHub player={player} market={market} onOpen={setOverlay} />
        )}
      </main>

      {/* Heartbeat */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] safe-bottom bg-gradient-to-t from-paper via-paper/95 to-transparent px-4 pt-6">
        {activeScenario ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-1 rounded-[20px] border border-line-2 bg-white/80 px-4 py-3 text-center text-[13px] font-bold text-ink-soft backdrop-blur"
          >
            👆 Make your choice to continue
          </motion.div>
        ) : (
          <BigButton tone="coral" onClick={advance} sub="Salary in · market moves · life happens" icon={<span className="text-lg">▶</span>}>
            Next Month
          </BigButton>
        )}
      </div>

      <BuySheet open={overlay === 'buy'} onClose={() => setOverlay(null)} />
      <PortfolioSheet open={overlay === 'portfolio'} onClose={() => setOverlay(null)} />
      <BankSheet open={overlay === 'bank'} onClose={() => setOverlay(null)} />
      <YouSheet open={overlay === 'you'} onClose={() => setOverlay(null)} />
    </div>
  );
}
