import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import HUDTopBar from './HUDTopBar';
import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Building2, TrendingUp, PieChart, Landmark, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNavItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Properties', path: '/properties', icon: Building2 },
  { label: 'Market', path: '/market', icon: TrendingUp },
  { label: 'Portfolio', path: '/portfolio', icon: PieChart },
  { label: 'Bank', path: '/bank', icon: Landmark },
  { label: 'Scenarios', path: '/scenarios', icon: Sparkles },
];

export default function GameLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const sidebarWidth = isMobile ? 0 : 224;
  const bottomNavHeight = isMobile ? 56 : 0;

  return (
    <div className="bg-deep-space text-white game-root" style={{ height: '100dvh', overflow: 'hidden' }}>
      <HUDTopBar />
      <Sidebar />

      <main
        className="overflow-y-auto"
        style={{
          paddingTop: 64,
          paddingLeft: sidebarWidth,
          paddingBottom: bottomNavHeight,
          height: '100dvh',
        }}
      >
        <div key={location.key || location.pathname}>
          <Outlet />
        </div>
      </main>

      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-14 bg-void-navy/95 backdrop-blur-xl border-t border-glass-border flex items-center justify-around lg:hidden">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 w-14 h-14 transition-colors',
                  isActive ? 'text-cyan-glow' : 'text-text-dim'
                )}
              >
                <Icon size={18} />
                <span className="text-[9px] font-rajdhani uppercase tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
