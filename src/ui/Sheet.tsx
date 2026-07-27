import { useEffect, useId, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playWoosh } from './sound';

/**
 * Bottom-sheet overlay. Mobile-first (slides from the bottom), capped to a
 * comfortable column on desktop. Used for every "page" in the game so the
 * player never navigates away from /play.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  tone = 'paper',
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  tone?: 'paper' | 'night';
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) {
        e.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
    });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence onExitComplete={() => undefined}>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : 'Dialog'}
            tabIndex={-1}
            className={cn(
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden sm:max-w-[460px]',
              'rounded-t-sheet sm:rounded-sheet shadow-sheet',
              tone === 'night' ? 'bg-night text-white' : 'bg-paper text-ink',
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            onAnimationStart={() => playWoosh()}
          >
            {(title || subtitle) && (
              <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
                <div className="min-w-0">
                  {title && <div id={titleId} className="font-display text-xl font-bold leading-tight">{title}</div>}
                  {subtitle && <div className="mt-0.5 text-sm text-ink-soft">{subtitle}</div>}
                </div>
                <button
                  aria-label="Close"
                  onClick={onClose}
                  className={cn(
                    'pl-press -mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-full',
                    tone === 'night' ? 'bg-white/10 text-white' : 'bg-paper-2 text-ink-soft',
                  )}
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
              {children}
            </div>
            {footer && (
              <div className={cn(
                'safe-bottom border-t px-5 pt-3',
                tone === 'night' ? 'border-white/10 bg-night' : 'border-line bg-paper/95 backdrop-blur',
              )}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
