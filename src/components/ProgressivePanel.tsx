import { type ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import GlassCard from './GlassCard';
import { cn } from '@/lib/utils';

interface ProgressivePanelProps {
  title: string;
  eyebrow?: string;
  summary?: string;
  children: ReactNode;
  accentColor?: string;
  defaultOpen?: boolean;
  className?: string;
}

export default function ProgressivePanel({
  title,
  eyebrow = 'More detail',
  summary,
  children,
  accentColor,
  defaultOpen = false,
  className,
}: ProgressivePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <GlassCard accentColor={accentColor} className={className}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <span>
          <span className="label-text block text-[10px] text-text-dim">{eyebrow}</span>
          <span className="section-title mt-1 block text-white">{title}</span>
          {summary && <span className="mt-1 block text-sm text-text-secondary">{summary}</span>}
        </span>
        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-glass-border bg-white/5 text-text-secondary">
          <ChevronDown size={16} className={cn('transition-transform', open && 'rotate-180')} />
        </span>
      </button>
      {open && (
        <div className="mt-4 border-t border-divider pt-4">
          {children}
        </div>
      )}
    </GlassCard>
  );
}
