import { HashRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ToastProvider } from '@/ui/Toast';
import Title from '@/screens/Title';

const NewGame = lazy(() => import('@/screens/NewGame'));
const Play = lazy(() => import('@/screens/Play'));
const End = lazy(() => import('@/screens/End'));

function Loading() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-coral border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Title />} />
            <Route path="/new" element={<NewGame />} />
            <Route path="/play" element={<Play />} />
            <Route path="/end" element={<End />} />
            <Route path="*" element={<Title />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </ToastProvider>
  );
}
