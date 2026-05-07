import { ArrowRight, CalendarClock, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCommandCenterState } from '@/engine/commandCenter';
import { useGameStore } from '@/game/useGameStore';
import { cn } from '@/lib/utils';

interface NextMonthCTAProps {
  variant?: 'inline' | 'sidebar' | 'floating';
  className?: string;
  showDetail?: boolean;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function NextMonthCTA({
  variant = 'inline',
  className,
  showDetail = true,
}: NextMonthCTAProps) {
  const navigate = useNavigate();
  const { player, currentScenario, isGameActive, nextTurn } = useGameStore();

  if (!isGameActive) return null;

  const commandState = getCommandCenterState(player, currentScenario);
  const nextMonth = monthNames[player.month % 12];
  const nextYear = player.month === 12 ? player.year + 1 : player.year;
  const isBlocked = commandState.advance.tone === 'blocked';
  const Icon = isBlocked ? ShieldAlert : CalendarClock;
  const detail = commandState.advance.label === 'Next Month'
    ? `Advance to ${nextMonth} ${nextYear}`
    : commandState.advance.detail;

  const handleClick = () => {
    if (commandState.advance.disabled) return;
    if (commandState.advance.route) {
      navigate(commandState.advance.route);
      return;
    }
    nextTurn();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={commandState.advance.disabled}
      aria-label={`${commandState.advance.label}: ${detail}`}
      className={cn(
        'group relative overflow-hidden rounded-2xl border text-left transition-all disabled:cursor-not-allowed disabled:opacity-50',
        isBlocked
          ? 'border-danger/40 bg-danger/15 text-white shadow-[0_0_24px_rgba(255,23,68,0.16)]'
          : commandState.advance.tone === 'warn'
            ? 'border-warning/40 bg-warning/15 text-white shadow-[0_0_24px_rgba(255,215,64,0.12)]'
            : 'border-cyan-glow/50 bg-cyan-glow/15 text-white shadow-[0_0_28px_rgba(0,240,255,0.16)]',
        variant === 'floating' && 'fixed right-4 z-[60] w-[min(18rem,calc(100vw-2rem))] p-3 lg:hidden',
        variant === 'sidebar' && 'w-full p-3',
        variant === 'inline' && 'w-full sm:w-auto px-5 py-3',
        className,
      )}
      style={variant === 'floating' ? { bottom: 'calc(env(safe-area-inset-bottom) + 4.75rem)' } : undefined}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <span className="relative flex items-center gap-3">
        <span className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
          isBlocked ? 'border-danger/40 bg-danger/20 text-danger' : 'border-cyan-glow/40 bg-cyan-glow/20 text-cyan-glow',
        )}>
          <Icon size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="label-text block text-xs text-white">{commandState.advance.label}</span>
          {showDetail && (
            <span className="mt-0.5 block truncate text-xs text-text-secondary">{detail}</span>
          )}
        </span>
        <ArrowRight size={16} className="shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
