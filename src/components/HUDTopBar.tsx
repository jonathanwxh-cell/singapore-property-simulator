import { useGameStore } from '@/game/useGameStore';
import { BookOpen, Settings, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { memo } from 'react';
import { selectAvailableCash, selectNetWorth, selectReservedCash } from '@/engine/selectors';

const HUDTopBar = memo(function HUDTopBar() {
  const navigate = useNavigate();
  const { player, isGameActive } = useGameStore();

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formatCash = (amount: number) => {
    if (amount >= 1000000) return `S$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `S$${(amount / 1000).toFixed(0)}K`;
    return `S$${amount.toLocaleString()}`;
  };

  const netWorth = selectNetWorth(player);
  const availableCash = selectAvailableCash(player);
  const reservedCash = selectReservedCash(player);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-deep-space/95 backdrop-blur-md border-b border-cyan-glow/30">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Logo + Date */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="group flex min-h-12 shrink-0 items-center"
            aria-label="PropSim Singapore dashboard"
          >
            <span className="relative block h-11 w-[104px] overflow-hidden rounded-hud sm:h-12 sm:w-[136px] lg:h-14 lg:w-[156px]">
              <span className="pointer-events-none absolute inset-0 rounded-hud bg-cyan-glow/5 opacity-0 shadow-cyan-glow transition-opacity group-hover:opacity-100" />
              <img
                src="/title-logo.png"
                alt="PropSim Singapore"
                className="relative left-0 top-1/2 h-20 max-w-none -translate-y-1/2 object-contain opacity-95 drop-shadow-[0_0_14px_rgba(0,240,255,0.22)] transition-opacity group-hover:opacity-100 sm:h-24 lg:h-28"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </span>
          </button>
          {isGameActive && (
            <div className="glass-pill hidden sm:flex items-center gap-2">
              <span className="label-text text-text-dim text-xs">Date</span>
              <span className="font-mono text-white text-sm font-bold">
                {monthNames[player.month - 1]} {player.year}
              </span>
            </div>
          )}
        </div>

        {/* Center: Key Metrics */}
        {isGameActive && (
          <div className="hidden md:flex items-center gap-3">
            <MetricPill
              label="Available"
              value={formatCash(availableCash)}
              color="#00F0FF"
              detail={reservedCash > 0 ? `${formatCash(reservedCash)} reserve` : undefined}
            />
            <MetricPill label="Net Worth" value={formatCash(netWorth)} color="#00E676" />
            <MetricPill label="CPF" value={formatCash(player.cpfOrdinary + player.cpfSpecial)} color="#7C4DFF" />
            <MetricPill label="Credit" value={String(player.creditScore)} color="#FFD740" />
          </div>
        )}

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {isGameActive && (
            <>
              <button
                onClick={() => navigate('/learn')}
                className="flex h-11 w-11 items-center justify-center rounded-hud border border-cyan-glow/30 text-cyan-glow transition-all hover:bg-cyan-glow/10"
                title="Open guide. This is turn-based, so time only moves when you advance."
              >
                <BookOpen size={18} />
              </button>
              <button
                onClick={() => navigate('/saveload')}
                className="flex h-11 w-11 items-center justify-center rounded-hud border border-cyan-glow/30 text-cyan-glow transition-all hover:bg-cyan-glow/10"
                title="Save / Load"
              >
                <Save size={18} />
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/settings')}
            className="flex h-11 w-11 items-center justify-center rounded-hud border border-cyan-glow/30 text-cyan-glow transition-all duration-500 hover:rotate-90 hover:bg-cyan-glow/10"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
});

function MetricPill({ label, value, color, detail }: { label: string; value: string; color: string; detail?: string }) {
  return (
    <div className="glass-pill flex items-center gap-2" title={detail}>
      <span className="label-text text-text-dim text-[10px]">{label}</span>
      <span
        className="font-mono text-sm font-bold"
        style={{ color }}
      >
        {value}
      </span>
      {detail && <span className="font-mono text-[10px] text-text-dim hidden xl:inline">{detail}</span>}
    </div>
  );
}

export default HUDTopBar;
