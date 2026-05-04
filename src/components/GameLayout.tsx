import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import HUDTopBar from './HUDTopBar';
import Sidebar from './Sidebar';
import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, BriefcaseBusiness, Building2, TrendingUp, PieChart, Landmark, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/game/useGameStore';

const mobileNavItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Life', path: '/life', icon: BriefcaseBusiness },
  { label: 'Properties', path: '/properties', icon: Building2 },
  { label: 'Market', path: '/market', icon: TrendingUp },
  { label: 'Portfolio', path: '/portfolio', icon: PieChart },
  { label: 'Bank', path: '/bank', icon: Landmark },
  { label: 'Scenarios', path: '/scenarios', icon: Sparkles },
];

export default function GameLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentScenario = useGameStore(state => state.currentScenario);
  const [isMobile, setIsMobile] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (currentScenario && location.pathname !== '/scenarios') {
      navigate('/scenarios');
    }
  }, [currentScenario, location.pathname, navigate]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  const sidebarWidth = isMobile ? 0 : 224;
  const bottomNavHeight = isMobile ? 56 : 0;

  return (
    <div className="bg-deep-space text-white" style={{ height: '100dvh', overflow: 'hidden' }}>
      <HUDTopBar />
      <Sidebar />

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
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-14 bg-void-navy/95 backdrop-blur-xl border-t border-glass-border flex items-center gap-1 px-2 overflow-x-auto lg:hidden">
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
      )}
    </div>
  );
}
