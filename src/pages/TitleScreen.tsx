import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { VolumeX, Volume2 } from 'lucide-react';
import { useGameStore } from '@/game/useGameStore';
import { readAutoSave } from '@/game/savePersistence';
import { MenuButton, Particles } from './title/TitleComponents';

gsap.registerPlugin();


export default function TitleScreen() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const versionRef = useRef<HTMLDivElement>(null);
  const [soundOn, setSoundOn] = useState(false);
  const loadGame = useGameStore((state) => state.loadGame);
  const newGame = useGameStore((state) => state.newGame);
  const hasContinueSave = Boolean(readAutoSave());

  useGSAP(() => {
    const tl = gsap.timeline();

    // Logo fade in + scale
    tl.fromTo(
      logoRef.current,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }
    );

    // Subtitle fade in
    tl.fromTo(
      subtitleRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
      '-=0.3'
    );

    // Menu panel slide up
    tl.fromTo(
      menuRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
      '-=0.2'
    );

    // Stagger menu buttons
    tl.fromTo(
      menuRef.current?.querySelectorAll('.menu-btn') || [],
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power3.out' },
      '-=0.3'
    );

    // Version fade in
    tl.fromTo(
      versionRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5 },
      '-=0.2'
    );

    return () => {
      tl.kill();
    };
  }, { scope: containerRef });

  const handleTransition = (path: string) => {
    gsap.to(containerRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        navigate(path);
      },
    });
  };

  const handleContinue = () => {
    const savedState = readAutoSave();
    if (savedState) {
      loadGame(savedState);
      handleTransition('/dashboard');
      return;
    }
  };

  const handleGuidedStart = () => {
    newGame(
      'Rookie Investor',
      'graduate',
      'normal',
      { residencyStatus: 'sc', householdProfile: 'couple-family', age: 30 },
      'bto-upgrader',
      { guidedMode: true },
    );
    handleTransition('/dashboard');
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 min-h-[100dvh] w-full overflow-y-auto overflow-x-hidden"
      style={{ backgroundColor: '#060B14' }}
    >
      {/* Background layers */}
      <div className="absolute inset-0 z-0">
        {/* Animated gradient background (fallback for video) */}
        <div
          className="absolute inset-0 animate-ken-burns"
          style={{
            background: 'radial-gradient(ellipse at 30% 50%, #0B1628 0%, #060B14 50%, #0a0f1a 100%)',
          }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at center, transparent 40%, rgba(6, 11, 20, 0.8) 100%)',
          }}
        />
      </div>

      {/* Particles */}
      <Particles />

      {/* Content Layer */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-4 py-8">
        {/* Logo & Title */}
        <div ref={logoRef} className="flex flex-col items-center mb-8 opacity-0">
          <img
            src="/title-logo.png"
            alt="PropSim Singapore"
            className="w-[320px] md:w-[450px] lg:w-[500px] h-auto object-contain drop-shadow-[0_0_30px_rgba(0,240,255,0.3)]"
          />
        </div>

        {/* Subtitle */}
        <div
          ref={subtitleRef}
          className="text-center mb-10 opacity-0"
        >
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-cyan-glow/25 bg-cyan-glow/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-glow">
              Casual-friendly
            </span>
            <span className="rounded-full border border-success/25 bg-success/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-success">
              Guided first run
            </span>
            <span className="rounded-full border border-warning/25 bg-warning/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-warning">
              Singapore rules explained
            </span>
          </div>
          <span
            className="font-rajdhani text-text-dim text-sm md:text-lg tracking-[4px] uppercase"
          >
            Build wealth across the Lion City
          </span>
          <p className="mx-auto mt-3 max-w-md text-[11px] leading-relaxed text-text-dim/80">
            Fictional property names and prices for learning. Real Singapore districts, MRT context, and policy-inspired rules are simplified for gameplay.
          </p>
          <p className="mx-auto mt-2 max-w-md text-[11px] leading-relaxed text-cyan-glow/80">
            New to ABSD, CPF, HDB, or MOP? No prior property knowledge needed.
          </p>
        </div>

        {/* Main Menu */}
        <div
          ref={menuRef}
          className="w-full max-w-[400px] glass-panel p-8 opacity-0"
        >
          <div className="mb-4 rounded-2xl border border-success/20 bg-success/10 p-4">
            <p className="label-text mb-1 text-[10px] text-success">Best first play</p>
            <p className="text-sm font-semibold text-white">Start Guided Run</p>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">
              The game will suggest a beginner-friendly Singapore Citizen couple route, explain the first acronyms, and keep the first few turns focused.
            </p>
          </div>
          <div className="space-y-3">
            <MenuButton
              label="Start Guided Run"
              variant="primary"
              onClick={handleGuidedStart}
            />
            <MenuButton
              label="How to Play"
              variant="secondary"
              onClick={() => handleTransition('/how-to-play')}
            />
            <MenuButton
              label="Learn the Rules"
              variant="secondary"
              onClick={() => handleTransition('/learn')}
            />
            <MenuButton
              label="New Game"
              variant="secondary"
              onClick={() => handleTransition('/newgame')}
            />
            <MenuButton
              label={hasContinueSave ? 'Continue' : 'No Continue Save'}
              variant="secondary"
              onClick={handleContinue}
              disabled={!hasContinueSave}
            />
            <MenuButton
              label="Load Game"
              variant="secondary"
              onClick={() => handleTransition('/saveload')}
            />
            <MenuButton
              label="Leaderboard"
              variant="secondary"
              onClick={() => handleTransition('/leaderboard')}
            />
            <MenuButton
              label="Settings"
              variant="secondary"
              onClick={() => handleTransition('/settings')}
            />
            <MenuButton
              label="Quit"
              variant="danger"
              onClick={() => {
                if (window.confirm('Are you sure you want to quit?')) {
                  window.close();
                }
              }}
            />
          </div>
        </div>

        {/* Version & Copyright */}
        <div
          ref={versionRef}
          className="absolute bottom-6 text-center opacity-0"
        >
          <p className="font-inter text-[11px] text-text-dim tracking-[0.5px]">
            v1.0.0 | Made with passion for Singapore property enthusiasts
          </p>
        </div>

        {/* Bottom status bar */}
        <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-between px-4 bg-void-navy/50 border-t border-glass-border">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-glow animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-text-dim" />
            </div>
          </div>
          <button
            onClick={() => setSoundOn(!soundOn)}
            className="text-text-dim hover:text-cyan-glow transition-colors"
          >
            {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

