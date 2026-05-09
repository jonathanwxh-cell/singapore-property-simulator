import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type HeroVariant = 'dashboard' | 'portfolio' | 'property' | 'market' | 'buy' | 'life' | 'learn' | 'newgame';

export default function PageSceneHero({
  variant,
  eyebrow,
  title,
  subtitle,
  stats = [],
  actions,
  className,
}: {
  variant: HeroVariant;
  eyebrow: string;
  title: string;
  subtitle: string;
  stats?: Array<{ label: string; value: string; tone?: 'good' | 'warn' | 'bad' | 'neutral' }>;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#06111f] shadow-[0_24px_70px_rgba(0,0,0,0.28)]', className)}>
      <div className={cn('absolute inset-0', variantBackdrop[variant])} />
      <HeroIllustration variant={variant} />
      <div className="relative grid gap-5 p-5 lg:grid-cols-[1fr,18rem] lg:p-6">
        <div>
          <p className="label-text mb-2 text-[10px] text-cyan-glow">{eyebrow}</p>
          <h1 className="font-display text-3xl leading-none text-white md:text-5xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">{subtitle}</p>
          {actions && <div className="mt-5 flex flex-wrap gap-3">{actions}</div>}
        </div>
        <div className="grid content-end gap-2">
          {stats.slice(0, 4).map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/30 p-3 backdrop-blur">
              <p className="label-text text-[9px] text-text-dim">{stat.label}</p>
              <p className={cn(
                'mt-1 font-mono text-lg',
                stat.tone === 'good' ? 'text-success' : stat.tone === 'warn' ? 'text-warning' : stat.tone === 'bad' ? 'text-danger' : 'text-white',
              )}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HeroAction({
  children,
  onClick,
  secondary = false,
}: {
  children: ReactNode;
  onClick: () => void;
  secondary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={secondary ? 'btn-secondary inline-flex items-center gap-2 px-4 py-3 text-sm' : 'btn-primary inline-flex items-center gap-2 px-4 py-3 text-sm'}
    >
      {children}
      <ArrowRight size={15} />
    </button>
  );
}

const variantBackdrop = {
  dashboard: 'bg-[radial-gradient(circle_at_16%_14%,rgba(255,215,64,0.28),transparent_24%),radial-gradient(circle_at_86%_5%,rgba(0,240,255,0.2),transparent_28%),linear-gradient(180deg,#17456b,#06111f)]',
  portfolio: 'bg-[radial-gradient(circle_at_80%_12%,rgba(0,230,118,0.24),transparent_25%),linear-gradient(135deg,#123255,#06111f_64%)]',
  property: 'bg-[radial-gradient(circle_at_78%_20%,rgba(255,215,64,0.24),transparent_25%),linear-gradient(135deg,#26384c,#06111f_66%)]',
  market: 'bg-[radial-gradient(circle_at_18%_14%,rgba(0,240,255,0.2),transparent_26%),linear-gradient(135deg,#073322,#06111f_62%)]',
  buy: 'bg-[radial-gradient(circle_at_84%_18%,rgba(255,215,64,0.25),transparent_24%),linear-gradient(135deg,#17375f,#06111f_64%)]',
  life: 'bg-[radial-gradient(circle_at_20%_12%,rgba(255,23,68,0.2),transparent_26%),linear-gradient(135deg,#30264a,#06111f_68%)]',
  learn: 'bg-[radial-gradient(circle_at_76%_18%,rgba(0,240,255,0.18),transparent_26%),linear-gradient(135deg,#163244,#06111f_66%)]',
  newgame: 'bg-[radial-gradient(circle_at_18%_18%,rgba(255,215,64,0.24),transparent_25%),linear-gradient(135deg,#24264a,#06111f_68%)]',
} satisfies Record<HeroVariant, string>;

function HeroIllustration({ variant }: { variant: HeroVariant }) {
  if (variant === 'market') return <MapIllustration />;
  if (variant === 'life' || variant === 'learn' || variant === 'newgame') return <LifeIllustration />;
  if (variant === 'portfolio' || variant === 'property') return <HomeIllustration />;
  return <CityIllustration />;
}

function CityIllustration() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[28rem] opacity-75 md:block">
      <div className="absolute bottom-0 right-10 h-28 w-12 rounded-t bg-cyan-glow/15" />
      <div className="absolute bottom-0 right-28 h-44 w-16 rounded-t bg-white/10" />
      <div className="absolute bottom-0 right-48 h-36 w-14 rounded-t bg-warning/15" />
      <div className="absolute bottom-0 right-64 h-24 w-12 rounded-t bg-success/15" />
    </div>
  );
}

function MapIllustration() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[30rem] opacity-70 md:block">
      <div className="absolute right-10 top-14 h-20 w-20 rounded-3xl border border-cyan-glow/30 bg-cyan-glow/15" />
      <div className="absolute bottom-14 right-28 h-24 w-24 rounded-3xl border border-success/30 bg-success/15" />
      <div className="absolute right-56 top-28 h-16 w-16 rounded-2xl border border-warning/30 bg-warning/15" />
      <div className="absolute right-20 top-36 h-1 w-60 rotate-[-18deg] rounded-full bg-cyan-glow/40" />
      <div className="absolute right-28 top-44 h-1 w-48 rotate-[30deg] rounded-full bg-success/35" />
    </div>
  );
}

function HomeIllustration() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[28rem] opacity-75 md:block">
      <div className="absolute bottom-10 right-16 h-32 w-64 -skew-y-6 rounded-3xl border-2 border-white/15 bg-[linear-gradient(135deg,#c99a6d,#74513d)] shadow-2xl" />
      <div className="absolute bottom-24 right-44 h-9 w-24 rounded-t-2xl rounded-b-lg bg-cyan-glow/70" />
      <div className="absolute bottom-28 right-24 h-12 w-8 rounded-lg bg-warning/70" />
    </div>
  );
}

function LifeIllustration() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[30rem] opacity-75 md:block">
      <div className="absolute bottom-10 right-12 grid w-80 grid-cols-5 gap-2">
        {['Work', 'Keys', 'MOP', 'Move', 'End'].map((label, index) => (
          <div key={label} className={cn('rounded-2xl border p-3 text-center font-rajdhani text-xs font-bold uppercase tracking-[0.12em] text-white', index === 2 ? 'border-cyan-glow/50 bg-cyan-glow/20' : 'border-white/10 bg-black/25')}>
            {label}
          </div>
        ))}
      </div>
      <div className="absolute bottom-28 right-44 h-12 w-12 rounded-full border-4 border-white bg-[linear-gradient(135deg,#FFD740,#FF1744)]" />
    </div>
  );
}
