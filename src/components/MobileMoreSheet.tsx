import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { getMobileMoreSections } from './mobileMoreNavigation';
import { cn } from '@/lib/utils';

interface MobileMoreSheetProps {
  open: boolean;
  pathname: string;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export default function MobileMoreSheet({
  open,
  pathname,
  onClose,
  onNavigate,
}: MobileMoreSheetProps) {
  const sections = getMobileMoreSections();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="mobile-more-backdrop"
            type="button"
            aria-label="Close More tools"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-[2px] lg:hidden"
            onClick={onClose}
          />

          <motion.section
            key="mobile-more-sheet"
            id="mobile-more-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 z-[60] max-h-[78vh] overflow-y-auto rounded-t-[2rem] border border-glass-border border-b-0 bg-void-navy/98 px-4 pb-4 pt-3 shadow-[0_-20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:hidden"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-white/15" />

            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="label-text text-[10px] text-cyan-glow">More tools</p>
                <h2 id="mobile-more-title" className="mt-1 font-rajdhani text-xl font-semibold uppercase tracking-[0.08em] text-white">
                  Plan, save, and tune the run
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
                  Start with Home, Life, Buy, Own, or Learn. Use these extra tabs when you need financing, market context, saves, or replay tools.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-text-secondary transition-colors hover:border-cyan-glow/30 hover:text-cyan-glow"
                aria-label="Close More tools"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.id} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-3">
                  <div className="mb-3">
                    <p className="label-text text-[10px] text-cyan-glow">{section.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-text-dim">{section.summary}</p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.path;

                      return (
                        <button
                          key={item.path}
                          type="button"
                          onClick={() => onNavigate(item.path)}
                          className={cn(
                            'rounded-[1.25rem] border p-4 text-left transition-all duration-200',
                            'hover:-translate-y-0.5',
                            isActive
                              ? 'border-cyan-glow/45 bg-cyan-glow/10 text-cyan-glow shadow-cyan-glow'
                              : 'border-white/10 bg-black/20 text-text-secondary hover:border-cyan-glow/30 hover:bg-white/[0.05] hover:text-white',
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className={cn(
                              'inline-flex h-10 w-10 items-center justify-center rounded-2xl border',
                              isActive
                                ? 'border-cyan-glow/40 bg-cyan-glow/10 text-cyan-glow'
                                : 'border-white/10 bg-white/[0.04] text-text-secondary',
                            )}>
                              <Icon size={18} />
                            </div>
                            <div className="flex items-center gap-2">
                              {isActive && (
                                <span className="rounded-full border border-cyan-glow/35 bg-cyan-glow/10 px-2 py-1 text-[9px] font-mono uppercase tracking-[0.14em] text-cyan-glow">
                                  Open now
                                </span>
                              )}
                              <ChevronRight size={16} className={isActive ? 'text-cyan-glow' : 'text-text-dim'} />
                            </div>
                          </div>

                          <p className="mt-3 text-[10px] font-mono uppercase tracking-[0.16em] text-text-dim">{item.eyebrow}</p>
                          <p className={cn('mt-1 font-rajdhani text-base font-semibold uppercase tracking-[0.08em]', isActive ? 'text-cyan-glow' : 'text-white')}>
                            {item.label}
                          </p>
                          <p className={cn('mt-1 text-xs leading-relaxed', isActive ? 'text-cyan-glow/80' : 'text-text-secondary')}>
                            {item.detail}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}
