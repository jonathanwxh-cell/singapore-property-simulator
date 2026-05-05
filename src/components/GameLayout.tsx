import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import HUDTopBar from './HUDTopBar';
import Sidebar from './Sidebar';
import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Building2, TrendingUp, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/game/useGameStore';
import NextMonthCTA from './NextMonthCTA';

const mobileNavItems = [
  { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Life', path: '/life', icon: BriefcaseBusiness },
  { label: 'Buy', path: '/properties', icon: Building2 },
  { label: 'Own', path: '/portfolio', icon: PieChart },
  { label: 'Learn', path: '/learn', icon: TrendingUp },
];

export default function GameLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentScenario = useGameStore(state => state.currentScenario);
  const isGameActive = useGameStore(state => state.isGameActive);
  const [isMobile, setIsMobile] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const shellControlsVisible = isGameActive && ![
    '/newgame',
    '/saveload',
    '/settings',
    '/gameover',
    '/leaderboard',
  ].includes(location.pathname);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (shellControlsVisible && currentScenario && location.pathname !== '/scenarios') {
      navigate('/scenarios');
    }
  }, [currentScenario, location.pathname, navigate, shellControlsVisible]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  const sidebarWidth = isMobile || !shellControlsVisible ? 0 : 224;
  const bottomNavHeight = isMobile && shellControlsVisible ? 116 : 0;
  const showFloatingAdvance = isMobile
    && shellControlsVisible
    && ['/dashboard', '/life', '/portfolio', '/market', '/bank', '/learn'].includes(location.pathname);

  return (
    <div className="bg-deep-space text-white" style={{ height: '100dvh', overflow: 'hidden' }}>
      <HUDTopBar />
      {shellControlsVisible && <Sidebar />}

      {/* Main content area - fills remaining viewport */}
      <main
        ref={mainRef}
        className="overflow-y-auto"
        style={{
          paddingTop: 64,
          paddingLeft: sidebarWidth,
          paddingBottom: bottomNavHeight,
          height: '100dvh',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      {isMobile && shellControlsVisible && (
        <>
        {showFloatingAdvance && <NextMonthCTA variant="floating" />}
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-14 bg-void-navy/95 backdrop-blur-xl border-t border-glass-border flex items-center justify-around gap-1 px-2 lg:hidden">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 min-w-[3.75rem] h-14 shrink-0 transition-colors',
                  isActive ? 'text-cyan-glow' : 'text-text-dim'
                )}
              >
                <Icon size={18} />
                <span className="text-[9px] font-rajdhani uppercase tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>
        </>
      )}
    </div>
  );
}
