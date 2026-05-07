import type React from 'react';

export default function ActionTile({
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-glass-border bg-white/[0.04] p-4 text-left transition-all hover:border-cyan-glow/40 hover:bg-cyan-glow/10"
    >
      <Icon size={20} className="mb-3 text-cyan-glow" />
      <p className="font-rajdhani text-lg font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-text-secondary">{detail}</p>
    </button>
  );
}
