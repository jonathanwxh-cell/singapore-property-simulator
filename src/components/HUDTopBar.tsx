import { useGameStore } from '@/game/useGameStore';
import { Settings, Pause, Play, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, memo } from 'react';

const HUDTopBar = memo(function HUDTopBar() {
  const navigate = useNavigate();
  const { player, isGameActive } = useGameStore();
  const [isPaused, setIsPaused] = useState(false);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formatCash = (amount: number) => {
    if (amount >= 1000000) return `S$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `S$${(amount / 1000).toFixed(0)}K`;
    return `S$${amount.toLocaleString()}`;
  };

  const netWorth = player.cash + player.properties.reduce((sum, p) => sum + p.currentValue, 0) + player.cpfOrdinary + player.cpfSpecial;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-deep-space/95 backdrop-blur-md border-b border-cyan-glow/30">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Logo + Date */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 group shrink-0"
          >
            <img
              src="/title-logo.png"
              alt="SG Property Tycoon"
              className="h-8 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity hidden sm:block"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="font-orbitron text-cyan-glow text-sm font-bold tracking-wider hidden xs:block sm:hidden">SGPT</span>
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
            <MetricPill label="Cash" value={formatCash(player.cash)} color="#00F0FF" />
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
                onClick={() => setIsPaused(!isPaused)}
                className="flex items-center justify-center w-9 h-9 rounded-hud border border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 transition-all"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
              </button>
              <button
                onClick={() => navigate('/saveload')}
                className="flex items-center justify-center w-9 h-9 rounded-hud border border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 transition-all"
                title="Save / Load"
              >
                <Save size={16} />
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center w-9 h-9 rounded-hud border border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/10 hover:rotate-90 transition-all duration-500"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </header>
  );
});

function MetricPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="glass-pill flex items-center gap-2">
      <span className="label-text text-text-dim text-[10px]">{label}</span>
      <span
        className="font-mono text-sm font-bold"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

export default HUDTopBar;
