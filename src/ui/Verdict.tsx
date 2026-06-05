import { cn } from '@/lib/utils';

export type VerdictKind = 'steal' | 'comfortable' | 'stretch' | 'blocked';

const meta: Record<VerdictKind, { label: string; cls: string; emoji: string }> = {
  steal: { label: 'Steal', cls: 'bg-money-soft text-money', emoji: '🔥' },
  comfortable: { label: 'Comfortable', cls: 'bg-[#E9F2FF] text-sky', emoji: '👍' },
  stretch: { label: 'A Stretch', cls: 'bg-gold-soft text-[#B9791E]', emoji: '😬' },
  blocked: { label: 'Blocked', cls: 'bg-loss-soft text-loss', emoji: '🚫' },
};

export function Verdict({
  kind,
  label,
  className,
}: {
  kind: VerdictKind;
  /** override the default label, e.g. "Blocked — ABSD 20%" */
  label?: string;
  className?: string;
}) {
  const m = meta[kind];
  return (
    <span className={cn('pl-chip', m.cls, className)}>
      <span aria-hidden>{m.emoji}</span>
      {label ?? m.label}
    </span>
  );
}
