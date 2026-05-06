import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import HUDTopBar from './HUDTopBar';
import Sidebar from './Sidebar';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Building2,
  TrendingUp,
  PieChart,
  MoreHorizontal,
  Landmark,
  Save,
  Settings,
  Trophy,
  Newspaper,
} from 'lucide-react';
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

const mobileMoreItems = [
  { label: 'Market', path: '/market', icon: Newspaper, detail: 'District map' },
  { label: 'Bank', path: '/bank', icon: Landmark, detail: 'Loans' },
  { label: 'Save', path: '/saveload', icon: Save, detail: 'Profiles' },
  { label: 'Scenarios', path: '/scenarios', icon: TrendingUp, detail: 'Choices' },
  { label: 'Leaderboard', path: '/leaderboard', icon: Trophy, detail: 'Replay score' },
  { label: 'Settings', path: '/settings', icon: Settings, detail: 'Comfort' },
];

export default function GameLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentScenario = useGameStore(state => state.currentScenario);
  const isGameActive = useGameStore(state => state.isGameActive);
  const settings = useGameStore(state => state.settings);
  const [isMobile, setIsMobile] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
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
  const routesWithInlineAdvance = ['/dashboard', '/life'];
  const showFloatingAdvance = isMobile
    && shellControlsVisible
    && !routesWithInlineAdvance.includes(location.pathname)
    && ['/market', '/bank'].includes(location.pathname);

  return (
    <div
      className={cn(
        'bg-deep-space text-white',
        settings.largeTextMode && 'large-text-mode',
        settings.highContrastMode && 'high-contrast-mode',
      )}
      style={{ height: '100dvh', overflow: 'hidden' }}
    >
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
        <AnimatePresence>
          {showMoreMenu && (
            <motion.div
              key="mobile-more-menu"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.18 }}
              className="fixed bottom-16 left-3 right-3 z-50 rounded-3xl border border-glass-border bg-void-navy/95 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:hidden"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="label-text text-[10px] text-cyan-glow">More game tabs</p>
                <button
                  type="button"
                  onClick={() => setShowMoreMenu(false)}
                  className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-text-secondary"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {mobileMoreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        navigate(item.path);
                      }}
                      className={`rounded-2xl border p-3 text-left transition-colors ${
                        isActive
                          ? 'border-cyan-glow/45 bg-cyan-glow/10 text-cyan-glow'
                          : 'border-white/10 bg-white/[0.04] text-text-secondary hover:border-cyan-glow/30 hover:text-white'
                      }`}
                    >
                      <Icon size={17} className="mb-2" />
                      <span className="block font-rajdhani text-sm font-semibold uppercase tracking-[0.1em]">{item.label}</span>
                      <span className="mt-0.5 block text-[10px] text-text-dim">{item.detail}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-14 bg-void-navy/95 backdrop-blur-xl border-t border-glass-border flex items-center justify-around gap-0.5 px-1 lg:hidden">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => {
                  setShowMoreMenu(false);
                  navigate(item.path);
                }}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 h-14 min-w-0 flex-1 transition-colors',
                  isActive ? 'text-cyan-glow' : 'text-text-dim'
                )}
              >
                <Icon size={18} />
                <span className="text-[8px] font-rajdhani uppercase tracking-wide xs:text-[9px]">{item.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowMoreMenu((value) => !value)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 h-14 min-w-0 flex-1 transition-colors',
              showMoreMenu || mobileMoreItems.some((item) => item.path === location.pathname) ? 'text-cyan-glow' : 'text-text-dim'
            )}
          >
            <MoreHorizontal size={18} />
            <span className="text-[8px] font-rajdhani uppercase tracking-wide xs:text-[9px]">More</span>
          </button>
        </nav>
        </>
      )}
    </div>
  );
}
