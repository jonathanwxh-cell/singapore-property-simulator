import { useEffect, useRef, useState } from 'react';
import { formatCurrency, formatCompactCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Animated count toward a target number. Honors reduced-motion. */
export function useCountUp(target: number, duration = 650): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const from = fromRef.current;
    const to = target;
    if (reduce || from === to) {
      fromRef.current = to;
      setValue(to);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

export function Money({
  value,
  compact = false,
  animate = false,
  className,
}: {
  value: number;
  compact?: boolean;
  animate?: boolean;
  className?: string;
}) {
  const animated = useCountUp(value);
  const shown = animate ? animated : value;
  const text = compact ? formatCompactCurrency(shown) : formatCurrency(shown);
  return <span className={cn('tabnums', className)}>{text}</span>;
}

/** Signed delta with color + arrow, e.g. +S$1,200 (green) / -S$800 (red). */
export function Delta({
  value,
  compact = true,
  className,
}: {
  value: number;
  compact?: boolean;
  className?: string;
}) {
  const positive = value >= 0;
  const text = (compact ? formatCompactCurrency(Math.abs(value)) : formatCurrency(Math.abs(value)));
  return (
    <span
      className={cn(
        'tabnums font-semibold',
        positive ? 'text-money' : 'text-loss',
        className,
      )}
    >
      {positive ? '+' : '−'}{text}
    </span>
  );
}
