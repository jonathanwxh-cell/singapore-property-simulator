import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({
  children,
  className,
  onClick,
  interactive,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'pl-card p-4',
        interactive && 'pl-press cursor-pointer hover:shadow-card-lift',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Compact labelled figure used in the status strip and sheets. */
export function Stat({
  label,
  children,
  tone,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  tone?: 'ink' | 'money' | 'loss' | 'soft';
  className?: string;
}) {
  const toneClass =
    tone === 'money' ? 'text-money'
    : tone === 'loss' ? 'text-loss'
    : tone === 'soft' ? 'text-ink-soft'
    : 'text-ink';
  return (
    <div className={cn('flex flex-col', className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</span>
      <span className={cn('tabnums text-lg font-extrabold leading-tight', toneClass)}>{children}</span>
    </div>
  );
}

/** Thin progress meter (freedom bar, condition, etc.). */
export function Meter({
  value,
  max = 100,
  className,
  barClassName,
  height = 10,
}: {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-ink/10', className)}
      style={{ height }}
    >
      <div
        className={cn('h-full rounded-full bg-gradient-to-r from-gold to-coral transition-[width] duration-700 ease-out', barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
