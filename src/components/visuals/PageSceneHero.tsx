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
      <div className="relative grid gap-5 p-5 lg:grid-cols-[1fr,20rem] lg:p-6">
        <div>
          <p className="label-text mb-2 text-[10px] text-cyan-glow">{eyebrow}</p>
          <h1 className="font-display text-3xl leading-none text-white md:text-5xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary md:text-base">{subtitle}</p>
          {actions && <div className="mt-5 flex flex-wrap gap-3">{actions}</div>}
          <HeroPostcard variant={variant} className="mt-5 lg:hidden" />
        </div>
        <div className="grid content-end gap-2">
          <HeroPostcard variant={variant} className="hidden lg:block" />
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

function HeroPostcard({
  variant,
  className,
}: {
  variant: HeroVariant;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={postcardLabels[variant]}
      className={cn('relative h-40 overflow-hidden rounded-3xl border border-white/15 bg-black/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]', className)}
    >
      <div className={cn('absolute inset-0 opacity-95', variantBackdrop[variant])} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_24%,rgba(0,0,0,0.32))]" />
      <PostcardArt variant={variant} />
      <div className="absolute left-3 top-3 rounded-full border border-cyan-glow/30 bg-black/35 px-3 py-1 text-[9px] font-mono uppercase tracking-[0.18em] text-cyan-glow backdrop-blur">
        {postcardLabels[variant]}
      </div>
    </div>
  );
}

const postcardLabels = {
  dashboard: 'Life board scene',
  portfolio: 'Living home',
  property: 'Flat interior',
  market: 'District map',
  buy: 'Viewing route',
  life: 'Monthly life board',
  learn: 'Rule map',
  newgame: 'Run origin',
} satisfies Record<HeroVariant, string>;

function PostcardArt({ variant }: { variant: HeroVariant }) {
  if (variant === 'market') return <PostcardMap />;
  if (variant === 'portfolio' || variant === 'property') return <PostcardHome />;
  if (variant === 'life' || variant === 'learn' || variant === 'newgame') return <PostcardBoard />;
  return <PostcardCity />;
}

function PostcardCity() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-x-0 bottom-0 h-14 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.5))]" />
      <div className="absolute bottom-0 left-6 h-20 w-10 rounded-t-xl bg-cyan-glow/25 shadow-[52px_-30px_0_8px_rgba(255,255,255,0.1),116px_-8px_0_2px_rgba(255,215,64,0.22),188px_-40px_0_10px_rgba(0,230,118,0.16)]" />
      <div className="absolute bottom-8 left-0 right-0 h-1 rotate-[-4deg] bg-cyan-glow/50 shadow-[0_0_18px_rgba(0,240,255,0.4)]" />
      <div className="absolute bottom-12 left-10 h-8 w-20 rounded-full border border-white/20 bg-white/10" />
      <div className="absolute bottom-11 left-16 h-1.5 w-1.5 rounded-full bg-warning shadow-[18px_0_0_#D7B95B,36px_0_0_#D7B95B]" />
    </div>
  );
}

function PostcardMap() {
  return (
    <div className="absolute inset-0">
      <div className="absolute left-8 top-12 h-16 w-16 rounded-[1.4rem] border border-cyan-glow/35 bg-cyan-glow/15" />
      <div className="absolute bottom-9 right-10 h-20 w-20 rounded-[1.7rem] border border-success/35 bg-success/15" />
      <div className="absolute right-28 top-9 h-12 w-12 rounded-2xl border border-warning/35 bg-warning/15" />
      <div className="absolute left-16 top-24 h-1 w-52 rotate-[-18deg] rounded-full bg-cyan-glow/50" />
      <div className="absolute right-14 top-20 h-1 w-40 rotate-[28deg] rounded-full bg-success/45" />
      <div className="absolute left-24 bottom-8 h-4 w-4 rounded-full border-4 border-white bg-[linear-gradient(135deg,#00F0FF,#2979FF)] shadow-[92px_-28px_0_-1px_#D7B95B,154px_12px_0_-2px_#00E676]" />
    </div>
  );
}

function PostcardHome() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-x-5 bottom-5 h-20 -skew-y-6 rounded-3xl border-2 border-white/20 bg-[linear-gradient(135deg,#c99a6d,#7c563d)] shadow-2xl" />
      <div className="absolute bottom-16 left-12 h-8 w-24 rounded-t-2xl rounded-b-lg bg-cyan-glow shadow-[90px_-18px_0_-5px_#D7B95B]" />
      <div className="absolute bottom-14 right-12 h-10 w-7 rounded-lg bg-danger/75 shadow-[18px_6px_0_-2px_rgba(255,255,255,0.22)]" />
      <div className="absolute left-10 top-10 h-11 w-16 rounded-xl border border-white/15 bg-black/30">
        <div className="m-2 h-2 rounded-full bg-cyan-glow/70" />
        <div className="mx-2 mt-2 h-2 rounded-full bg-white/30" />
      </div>
    </div>
  );
}

function PostcardBoard() {
  return (
    <div className="absolute inset-0">
      <div className="absolute bottom-10 left-5 right-5 grid grid-cols-5 gap-2">
        {['Work', 'Cash', 'Keys', 'MOP', 'Move'].map((label, index) => (
          <div
            key={label}
            className={cn(
              'h-16 rounded-2xl border p-2 text-center font-rajdhani text-[9px] font-bold uppercase tracking-[0.12em] text-white',
              index === 2 ? 'border-cyan-glow/55 bg-cyan-glow/25 shadow-[0_0_18px_rgba(0,240,255,0.18)]' : 'border-white/10 bg-black/25',
            )}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="absolute bottom-24 left-[45%] h-11 w-11 rounded-full border-4 border-white bg-[radial-gradient(circle_at_35%_28%,#FFFFFF_0_16%,#00F0FF_34%,#2979FF_78%)] shadow-[0_12px_30px_rgba(0,240,255,0.22)]" />
      <div className="absolute bottom-8 left-8 right-8 h-1 rounded-full bg-white/15" />
    </div>
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
      <div className="absolute bottom-28 right-44 h-12 w-12 rounded-full border-4 border-white bg-[radial-gradient(circle_at_35%_28%,#FFFFFF_0_16%,#00F0FF_34%,#2979FF_78%)]" />
    </div>
  );
}
