import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import HUDTopBar from './HUDTopBar';
import MobileMoreSheet from './MobileMoreSheet';
import Sidebar from './Sidebar';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Building2,
  TrendingUp,
  PieChart,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/game/useGameStore';
import { isMobileMorePath } from './mobileMoreNavigation';

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
  const settings = useGameStore(state => state.settings);
  const [isMobile, setIsMobile] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const shellControlsVisible = isGameActive && ![
    '/newgame',
    '/new-game',
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
  const bottomNavPadding = isMobile && shellControlsVisible ? 'calc(4rem + env(safe-area-inset-bottom))' : 0;
  const navigateFromMobileMore = (path: string) => {
    setShowMoreMenu(false);
    window.setTimeout(() => navigate(path), 0);
  };

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
          paddingBottom: bottomNavPadding,
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
        <MobileMoreSheet
          open={showMoreMenu}
          pathname={location.pathname}
          onClose={() => setShowMoreMenu(false)}
          onNavigate={navigateFromMobileMore}
        />
        <nav
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 bg-void-navy/95 backdrop-blur-xl border-t border-glass-border flex items-center justify-around gap-0.5 px-1 lg:hidden',
            showMoreMenu && 'pointer-events-none',
          )}
          style={{ height: 'calc(4rem + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
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
                  'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 min-w-0 transition-colors',
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
            aria-expanded={showMoreMenu}
            aria-controls="mobile-more-sheet"
            className={cn(
              'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 min-w-0 transition-colors',
              showMoreMenu || isMobileMorePath(location.pathname) ? 'text-cyan-glow' : 'text-text-dim'
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
