import { HashRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import GameLayout from '@/components/GameLayout';

// Eagerly load title screen (first impression)
import TitleScreen from '@/pages/TitleScreen';

// Lazy load other pages for code splitting
const NewGame = lazy(() => import('@/pages/NewGame'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Properties = lazy(() => import('@/pages/Properties'));
const PropertyDetail = lazy(() => import('@/pages/PropertyDetail'));
const Market = lazy(() => import('@/pages/Market'));
const Portfolio = lazy(() => import('@/pages/Portfolio'));
const Bank = lazy(() => import('@/pages/Bank'));
const Scenarios = lazy(() => import('@/pages/Scenarios'));
const SaveLoad = lazy(() => import('@/pages/SaveLoad'));
const Settings = lazy(() => import('@/pages/Settings'));
const GameOver = lazy(() => import('@/pages/GameOver'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));

function LoadingFallback() {
  return (
    <div className="min-h-[100dvh] bg-deep-space flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-glow border-t-transparent animate-spin" />
        <p className="text-text-secondary font-rajdhani text-sm uppercase tracking-wider">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Title Screen - no layout (no HUD/Sidebar) */}
          <Route path="/" element={<TitleScreen />} />

          {/* Game screens with layout */}
          <Route element={<GameLayout />}>
            <Route path="/newgame" element={<NewGame />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/market" element={<Market />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/bank" element={<Bank />} />
            <Route path="/scenarios" element={<Scenarios />} />
            <Route path="/saveload" element={<SaveLoad />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/gameover" element={<GameOver />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
