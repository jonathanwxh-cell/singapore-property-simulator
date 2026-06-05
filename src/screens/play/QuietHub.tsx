import { motion } from 'framer-motion';
import type { Player, MarketState } from '@/game/types';
import { Money, Delta } from '@/ui/Money';
import { deriveView } from '@/game-ui/derive';
import { cn } from '@/lib/utils';

export type Overlay = 'buy' | 'portfolio' | 'bank' | 'you';

function Nudge({ player }: { player: Player }) {
  const v = deriveView(player);
  let text = 'A calm month. Browse the market, manage your places, or just let time roll.';
  let emoji = '🌤️';
  if (player.properties.length === 0) {
    text = "You're still renting. Your first place is the biggest leap — go browse what's out there.";
    emoji = '🔑';
  } else if (v.cashflow < 0) {
    text = "You're burning cash each month. Watch your costs, or your runway will run dry.";
    emoji = '⚠️';
  } else if (player.cash > v.target * 0.04 && player.properties.length > 0) {
    text = 'Cash is piling up. Idle cash is lazy money — could it be working in another property?';
    emoji = '💡';
  }
  return (
    <div className="flex items-start gap-2.5 rounded-2xl bg-gold-soft px-3.5 py-3">
      <span className="text-lg leading-none">{emoji}</span>
      <p className="text-[13px] font-medium leading-snug text-[#8a5a16]">{text}</p>
    </div>
  );
}

function ActionTile({
  emoji, title, hint, badge, onClick,
}: { emoji: string; title: string; hint: string; badge?: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="pl-press relative rounded-2xl border border-line-2 bg-white p-3.5 text-left hover:shadow-card">
      {badge !== undefined && badge > 0 && (
        <span className="absolute right-2.5 top-2.5 grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[11px] font-bold text-white">{badge}</span>
      )}
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1 font-jakarta text-[14px] font-bold text-ink">{title}</div>
      <div className="text-[11.5px] leading-snug text-ink-soft">{hint}</div>
    </button>
  );
}

export function QuietHub({
  player,
  market,
  onOpen,
}: {
  player: Player;
  market: MarketState;
  onOpen: (o: Overlay) => void;
}) {
  const v = deriveView(player);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3.5"
    >
      <Nudge player={player} />

      {/* This month snapshot */}
      <div className="pl-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-jakarta text-[14px] font-bold text-ink">Your month</h3>
          <span className={cn('tabnums text-[13px] font-bold', v.cashflow >= 0 ? 'text-money' : 'text-loss')}>
            {v.cashflow >= 0 ? '+' : '−'}<Money value={Math.abs(v.cashflow)} />/mo
          </span>
        </div>
        <div className="grid grid-cols-2 gap-y-2 text-[13px]">
          <span className="text-ink-soft">💼 Take-home</span>
          <span className="text-right"><Delta value={v.takeHome} compact={false} /></span>
          {v.rental > 0 && (<>
            <span className="text-ink-soft">🏠 Rent collected</span>
            <span className="text-right"><Delta value={v.rental} compact={false} /></span>
          </>)}
          {v.expenses > 0 && (<>
            <span className="text-ink-soft">🏦 Loan payments</span>
            <span className="text-right"><Delta value={-v.expenses} compact={false} /></span>
          </>)}
          {v.ownership > 0 && (<>
            <span className="text-ink-soft">🔧 Upkeep & tax</span>
            <span className="text-right"><Delta value={-v.ownership} compact={false} /></span>
          </>)}
          <span className="text-ink-soft">🍜 Living costs</span>
          <span className="text-right"><Delta value={-v.household} compact={false} /></span>
        </div>
      </div>

      {/* Market headline flavor */}
      {market.lastHeadline && (
        <div className="rounded-2xl border border-line bg-white/70 px-3.5 py-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">📰 Word on the street</div>
          <div className="text-[13px] font-semibold text-ink">{market.lastHeadline}</div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2.5">
        <ActionTile emoji="🏠" title="Browse homes" hint="See what's on the market" onClick={() => onOpen('buy')} />
        <ActionTile emoji="🏢" title="Your places" hint={player.properties.length ? 'Manage & cash in' : 'Nothing yet'} badge={player.properties.length} onClick={() => onOpen('portfolio')} />
        <ActionTile emoji="🏦" title="The bank" hint="Loans & repayments" onClick={() => onOpen('bank')} />
        <ActionTile emoji="📊" title="You" hint="Stats & milestones" onClick={() => onOpen('you')} />
      </div>
    </motion.div>
  );
}
