import { useCallback, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ToastCtx, type ToastInput, type ToastTone } from './toastContext';

interface ToastItem extends ToastInput {
  id: number;
}

const toneClass: Record<ToastTone, string> = {
  neutral: 'bg-white text-ink border-line',
  good: 'bg-white text-ink border-money/30',
  bad: 'bg-white text-ink border-loss/40',
  gold: 'bg-white text-ink border-gold/50',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((t: ToastInput) => {
    const id = ++idRef.current;
    setItems((prev) => [...prev, { ...t, id }].slice(-4));
    const duration = t.duration ?? 3400;
    window.setTimeout(() => {
      setItems((prev) => prev.filter((it) => it.id !== id));
    }, duration);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] safe-top flex flex-col items-center gap-2 px-3">
        <AnimatePresence>
          {items.map((it) => (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, y: -18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className={cn(
                'pointer-events-auto w-full max-w-[420px] rounded-2xl border px-4 py-3 shadow-card',
                toneClass[it.tone ?? 'neutral'],
              )}
            >
              <div className="flex items-start gap-3">
                {it.emoji && <span className="text-xl leading-none">{it.emoji}</span>}
                <div className="min-w-0 flex-1">
                  <div className="font-jakarta text-[14px] font-bold leading-tight">{it.title}</div>
                  {it.body && <div className="mt-0.5 text-[13px] text-ink-soft">{it.body}</div>}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
