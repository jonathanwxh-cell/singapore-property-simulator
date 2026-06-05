import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { playPop } from './sound';

type Tone = 'coral' | 'gold' | 'money' | 'ink' | 'ghost' | 'soft';

const toneClass: Record<Tone, string> = {
  coral: 'bg-coral text-white shadow-pop',
  gold: 'bg-gold text-ink shadow-[0_10px_26px_rgba(244,169,59,0.32)]',
  money: 'bg-money text-white shadow-[0_10px_26px_rgba(21,166,91,0.30)]',
  ink: 'bg-ink text-white shadow-card',
  ghost: 'bg-transparent text-ink border border-line-2',
  soft: 'bg-paper-2 text-ink border border-line-2',
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  full?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  silent?: boolean;
}

const sizeClass = {
  sm: 'px-4 py-2 text-sm rounded-button',
  md: 'px-5 py-3 text-[15px] rounded-button',
  lg: 'px-6 py-4 text-base rounded-button',
};

export function Btn({
  tone = 'soft',
  full,
  size = 'md',
  icon,
  silent,
  className,
  children,
  onClick,
  ...rest
}: BtnProps) {
  return (
    <button
      {...rest}
      onClick={(e) => {
        if (!silent) playPop();
        onClick?.(e);
      }}
      className={cn(
        'pl-press inline-flex items-center justify-center gap-2 font-jakarta font-bold',
        'disabled:opacity-45 disabled:pointer-events-none select-none',
        sizeClass[size],
        toneClass[tone],
        full && 'w-full',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/** The hero "Next Month" / primary CTA — big, with optional subtitle line. */
export function BigButton({
  children,
  sub,
  tone = 'coral',
  icon,
  pulse,
  className,
  onClick,
  disabled,
  silent,
}: {
  children: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  pulse?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  silent?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={() => {
        if (!silent) playPop();
        onClick?.();
      }}
      className={cn(
        'pl-press relative w-full overflow-hidden rounded-[20px] px-6 py-4',
        'flex items-center justify-center gap-3 font-jakarta font-extrabold',
        'disabled:opacity-45 disabled:pointer-events-none select-none',
        toneClass[tone],
        pulse && !disabled && 'animate-pulse-soft',
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/35 to-transparent" />
      {icon}
      <span className="flex flex-col items-center leading-tight">
        <span className="text-[17px]">{children}</span>
        {sub && <span className="text-[12px] font-semibold opacity-85">{sub}</span>}
      </span>
    </button>
  );
}

export function Chip({
  children,
  className,
  tone,
}: {
  children: ReactNode;
  className?: string;
  tone?: string;
}) {
  return <span className={cn('pl-chip', tone, className)}>{children}</span>;
}

export function IconButton({
  children,
  onClick,
  label,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      aria-label={label}
      onClick={() => { playPop(); onClick?.(); }}
      className={cn(
        'pl-press grid h-10 w-10 place-items-center rounded-full bg-white/70 backdrop-blur',
        'border border-line text-ink-soft shadow-soft',
        className,
      )}
    >
      {children}
    </button>
  );
}
