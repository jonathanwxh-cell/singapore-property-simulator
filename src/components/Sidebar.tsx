import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '@/game/useGameStore';
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  PieChart,
  Landmark,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, memo } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Properties', path: '/properties', icon: Building2 },
  { label: 'Market', path: '/market', icon: TrendingUp },
  { label: 'Portfolio', path: '/portfolio', icon: PieChart },
  { label: 'Bank', path: '/bank', icon: Landmark },
  { label: 'Scenarios', path: '/scenarios', icon: Sparkles },
];

const Sidebar = memo(function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isGameActive } = useGameStore();
  const [collapsed, setCollapsed] = useState(false);

  if (!isGameActive) return null;

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 bottom-0 z-40 bg-void-navy/95 backdrop-blur-xl border-r border-glass-border',
        'transition-all duration-300 ease-out flex flex-col',
        'hidden lg:flex',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-cyan-glow/20 border border-cyan-glow/40 text-cyan-glow flex items-center justify-center hover:bg-cyan-glow/30 transition-all z-50"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'bg-cyan-glow/10 text-cyan-glow'
                  : 'text-text-secondary hover:text-white hover:bg-white/5',
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-cyan-glow rounded-r-full shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
              )}

              <Icon size={20} className={cn('shrink-0', isActive && 'drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]')} />

              {!collapsed && (
                <span className={cn(
                  'label-text text-sm transition-all',
                  isActive && 'text-cyan-glow',
                )}>
                  {item.label}
                </span>
              )}

              {/* Tooltip for collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-3 py-1.5 bg-void-navy border border-cyan-glow/30 rounded-md text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom info */}
      {!collapsed && (
        <div className="p-4 border-t border-glass-border">
          <div className="text-[10px] text-text-dim font-mono uppercase tracking-wider">
            Singapore Property Tycoon
          </div>
          <div className="text-[10px] text-text-dim/60 mt-1">
            v1.0.0
          </div>
        </div>
      )}
    </aside>
  );
});

export default Sidebar;
