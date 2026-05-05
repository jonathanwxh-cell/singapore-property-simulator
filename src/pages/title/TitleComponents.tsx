// Pure presentational components for TitleScreen.tsx. No game state, no
// router — these accept callbacks and primitive props.
import { useEffect, useRef } from 'react';

// Floating-dust particle effect rendered onto a fullscreen canvas.
// Self-contained: owns its animation frame loop and resize handler.
export function Particles() {
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

export function MenuButton({
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
  const baseClasses = 'menu-btn w-full h-[52px] flex items-center justify-center rounded-button font-rajdhani font-semibold text-[15px] tracking-[0.5px] uppercase transition-all duration-300 relative overflow-hidden group disabled:cursor-not-allowed disabled:opacity-45';

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} onClick={onClick} disabled={disabled}>
      {/* Scanline effect on hover */}
      <span className="absolute inset-0 overflow-hidden pointer-events-none">
        <span className="absolute top-0 left-0 w-0 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:w-full transition-all duration-300" />
      </span>
      {label}
    </button>
  );
}
