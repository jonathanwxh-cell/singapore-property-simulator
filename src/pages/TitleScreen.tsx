import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { VolumeX, Volume2 } from 'lucide-react';
import { useSaveLoad } from '@/hooks/useSaveLoad';

gsap.registerPlugin();

// Particle component for floating dust effect
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      life: number;
      maxLife: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -Math.random() * 0.5 - 0.1,
        opacity: Math.random() * 0.5 + 0.1,
        life: Math.random() * 800,
        maxLife: 800 + Math.random() * 700,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.speedX + Math.sin(p.life * 0.01) * 0.2;
        p.y += p.speedY;
        p.life++;

        const lifeRatio = p.life / p.maxLife;
        let alpha = p.opacity;
        if (lifeRatio < 0.1) alpha = p.opacity * (lifeRatio / 0.1);
        if (lifeRatio > 0.8) alpha = p.opacity * ((1 - lifeRatio) / 0.2);

        if (p.life >= p.maxLife) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 10;
          p.life = 0;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    />
  );
}

export default function TitleScreen() {
  const navigate = useNavigate();
  const { loadAutoSave, hasAutoSave } = useSaveLoad();
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const versionRef = useRef<HTMLDivElement>(null);
  const [soundOn, setSoundOn] = useState(false);

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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 min-h-[100dvh] w-full overflow-hidden"
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
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[100dvh] px-4">
        {/* Logo & Title */}
        <div ref={logoRef} className="flex flex-col items-center mb-8 opacity-0">
          <img
            src="/title-logo.png"
            alt="Property Tycoon: Singapore"
            className="w-[320px] md:w-[450px] lg:w-[500px] h-auto object-contain drop-shadow-[0_0_30px_rgba(0,240,255,0.3)]"
          />
        </div>

        {/* Subtitle */}
        <div
          ref={subtitleRef}
          className="text-center mb-10 opacity-0"
        >
          <span
            className="font-rajdhani text-text-dim text-sm md:text-lg tracking-[6px] uppercase"
          >
            Singapore
          </span>
        </div>

        {/* Main Menu */}
        <div
          ref={menuRef}
          className="w-full max-w-[400px] glass-panel p-8 opacity-0"
        >
          <div className="space-y-3">
            <MenuButton
              label="New Game"
              variant="primary"
              onClick={() => handleTransition('/newgame')}
            />
            <MenuButton
              label="Continue"
              variant="secondary"
              disabled={!hasAutoSave()}
              onClick={() => {
                if (loadAutoSave()) {
                  handleTransition('/dashboard');
                } else {
                  handleTransition('/newgame');
                }
              }}
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
              label="How to Play"
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

/* Menu Button Component */
function MenuButton({
  label,
  variant,
  onClick,
  disabled = false,
}: {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
  disabled?: boolean;
}) {
  const baseClasses = 'menu-btn w-full h-[52px] flex items-center justify-center rounded-button font-rajdhani font-semibold text-[15px] tracking-[0.5px] uppercase transition-all duration-300 relative overflow-hidden group';

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} onClick={onClick} disabled={disabled} style={disabled ? { opacity: 0.3, pointerEvents: 'none' } : undefined}>
      {/* Scanline effect on hover */}
      <span className="absolute inset-0 overflow-hidden pointer-events-none">
        <span className="absolute top-0 left-0 w-0 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:w-full transition-all duration-300" />
      </span>
      {label}
    </button>
  );
}
