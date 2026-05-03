export default function EligibilityBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'good' | 'warn' | 'blocked';
}) {
  const toneClasses = {
    good: 'border-success/30 bg-success/15 text-success',
    warn: 'border-warning/30 bg-warning/15 text-warning',
    blocked: 'border-danger/30 bg-danger/15 text-danger',
  } satisfies Record<typeof tone, string>;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-rajdhani font-semibold uppercase tracking-[0.14em] ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
