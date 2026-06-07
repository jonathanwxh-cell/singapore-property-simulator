import { formatCurrency, formatCompactCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useCountUp } from './useCountUp';

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
