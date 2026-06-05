import type { Player, MarketState } from '@/game/types';
import { Money } from '@/ui/Money';
import { Meter } from '@/ui/Card';
import { deriveView, lifeTitle } from '@/game-ui/derive';
import { cn } from '@/lib/utils';

function marketMood(market: MarketState): { emoji: string; label: string; cls: string } {
  const p = market.monthlyPriceChangePct ?? 0;
  if (p > 0.8) return { emoji: '📈', label: 'Hot market', cls: 'text-money' };
  if (p > 0.15) return { emoji: '🙂', label: 'Rising', cls: 'text-money' };
  if (p < -0.8) return { emoji: '📉', label: 'Falling', cls: 'text-loss' };
  if (p < -0.15) return { emoji: '😟', label: 'Cooling', cls: 'text-loss' };
  return { emoji: '😐', label: 'Steady', cls: 'text-ink-soft' };
}

export function StatusStrip({
  player,
  market,
  onOpenYou,
}: {
  player: Player;
  market: MarketState;
  onOpenYou: () => void;
}) {
  const v = deriveView(player);
  const mood = marketMood(market);

  return (
    <div className="safe-top sticky top-0 z-30 bg-paper/85 px-4 pb-2 pt-2 backdrop-blur-md">
      <div className="mx-auto max-w-[480px]">
        <div className="flex items-center justify-between">
          <button onClick={onOpenYou} className="pl-press flex items-center gap-2.5 text-left">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-coral to-gold text-lg shadow-soft">
              {player.name?.[0]?.toUpperCase() ?? '🙂'}
            </div>
            <div className="leading-tight">
              <div className="font-jakarta text-[15px] font-bold text-ink">{player.name}</div>
              <div className="text-[11.5px] font-semibold text-ink-soft">{lifeTitle(player)} · age {player.age}</div>
            </div>
          </button>

          <div className="text-right leading-tight">
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{v.monthLabel}</div>
            <div className={cn('text-[12.5px] font-bold', mood.cls)}>{mood.emoji} {mood.label}</div>
          </div>
        </div>

        {/* Money row */}
        <div className="mt-2.5 flex items-end justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Cash on hand</div>
            <div className="text-xl font-extrabold text-ink"><Money value={player.cash} animate /></div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Net worth</div>
            <div className="text-xl font-extrabold text-money"><Money value={v.netWorth} compact animate /></div>
          </div>
        </div>

        {/* Freedom bar */}
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-ink-soft">
            <span>Journey to freedom</span>
            <span className="tabnums">{Math.floor(v.freedomPct)}% · goal <Money value={v.target} compact /></span>
          </div>
          <Meter value={v.freedomPct} />
        </div>
      </div>
    </div>
  );
}
