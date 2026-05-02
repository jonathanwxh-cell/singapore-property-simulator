import { cn } from '@/lib/utils';

type GameLogoVariant = 'title' | 'hud';

interface GameLogoProps {
  variant?: GameLogoVariant;
  className?: string;
}

function SkylineMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 180"
      className={className}
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-frame" x1="30" y1="24" x2="148" y2="156" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0B1A31" />
          <stop offset="1" stopColor="#102948" />
        </linearGradient>
        <linearGradient id="logo-halo" x1="116" y1="24" x2="132" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00F0FF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#00F0FF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="logo-line" x1="52" y1="110" x2="122" y2="94" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00F0FF" />
          <stop offset="1" stopColor="#FFD740" />
        </linearGradient>
        <linearGradient id="logo-base" x1="56" y1="118" x2="130" y2="118" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06111E" />
          <stop offset="1" stopColor="#0A1829" />
        </linearGradient>
      </defs>

      <circle cx="122" cy="42" r="30" fill="url(#logo-halo)" />
      <rect x="22" y="22" width="136" height="136" rx="34" fill="url(#logo-frame)" stroke="rgba(255,255,255,0.08)" />
      <path
        d="M22 110C42 104 64 100 90 100C116 100 140 104 158 110V158H22V110Z"
        fill="#0A1423"
        fillOpacity="0.78"
      />
      <path
        d="M30 126H150"
        stroke="#182D46"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect x="42" y="88" width="96" height="34" rx="11" fill="url(#logo-base)" />
      <rect x="84" y="50" width="18" height="46" rx="7" fill="#14304F" />
      <rect x="106" y="42" width="22" height="54" rx="8" fill="#183A61" />
      <rect x="132" y="60" width="14" height="36" rx="6" fill="#112947" />
      <rect x="114" y="54" width="4" height="18" rx="2" fill="#00F0FF" fillOpacity="0.9" />
      <rect x="120" y="62" width="4" height="26" rx="2" fill="#00F0FF" fillOpacity="0.42" />
      <rect x="56" y="96" width="32" height="6" rx="3" fill="#18314C" />
      <rect x="56" y="106" width="20" height="5" rx="2.5" fill="#14273D" />
      <rect x="74" y="78" width="44" height="30" rx="8" fill="#08131E" stroke="#1FD8F4" strokeOpacity="0.45" strokeWidth="2.5" />
      <path
        d="M82 98L96 90L108 94L118 80L130 86"
        stroke="url(#logo-line)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="118" cy="80" r="4.5" fill="#00F0FF" />
      <path
        d="M58 138H124"
        stroke="#244A6C"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M132 138H142"
        stroke="#FFD740"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TitleLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex flex-col items-center text-center', className)}
      role="img"
      aria-label="Singapore Property Tycoon"
    >
      <div className="relative">
        <div className="absolute inset-4 rounded-full bg-cyan-glow/16 blur-[44px]" />
        <div className="absolute inset-x-10 -bottom-1 h-10 bg-warning/12 blur-2xl" />
        <SkylineMark className="relative w-32 md:w-40 lg:w-44 h-auto" />
      </div>

      <div className="mt-4 md:mt-5">
        <p className="font-rajdhani uppercase tracking-[0.65em] text-cyan-glow text-[11px] md:text-xs">
          Singapore Property
        </p>
        <p className="mt-1 font-orbitron font-black uppercase tracking-[0.14em] text-white text-5xl md:text-7xl leading-none">
          Tycoon
        </p>
        <div className="mt-3 h-px w-40 md:w-56 bg-gradient-to-r from-transparent via-warning/80 to-transparent opacity-80" />
      </div>
    </div>
  );
}

function HudLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex items-center gap-2.5', className)}
      role="img"
      aria-label="Singapore Property Tycoon"
    >
      <div className="relative shrink-0">
        <div className="absolute inset-1 rounded-full bg-cyan-glow/15 blur-xl" />
        <SkylineMark className="relative w-9 h-9 sm:w-10 sm:h-10" />
      </div>

      <div className="hidden sm:flex flex-col justify-center leading-none">
        <span className="font-rajdhani uppercase tracking-[0.22em] text-[8px] text-cyan-glow/95">
          Singapore Property
        </span>
        <span className="mt-0.5 font-orbitron uppercase tracking-[0.14em] text-[13px] lg:text-[14px] text-white font-bold">
          Tycoon
        </span>
      </div>
    </div>
  );
}

export default function GameLogo({ variant = 'title', className }: GameLogoProps) {
  if (variant === 'hud') {
    return <HudLogo className={className} />;
  }

  return <TitleLogo className={className} />;
}
