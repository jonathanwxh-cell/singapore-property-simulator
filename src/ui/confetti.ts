// Lightweight, dependency-free confetti burst. Appends a transient full-screen
// canvas, animates particles under gravity, then removes itself. Respects
// prefers-reduced-motion (no-op).

const COLORS = ['#FF5B5B', '#F4A93B', '#15A65B', '#7C5CFF', '#3B9EFF', '#10B4AC', '#FFC93C'];

interface ConfettiOpts {
  /** origin in viewport fraction (0..1). Defaults to center-top. */
  x?: number;
  y?: number;
  count?: number;
  power?: number;
}

export function fireConfetti(opts: ConfettiOpts = {}) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const { x = 0.5, y = 0.32, count = 90, power = 1 } = opts;
  const canvas = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '9999',
  } as CSSStyleDeclaration);
  document.body.appendChild(canvas);
  const c = canvas.getContext('2d');
  if (!c) { canvas.remove(); return; }
  c.scale(dpr, dpr);

  const ox = x * W;
  const oy = y * H;
  const particles = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = (4 + Math.random() * 9) * power;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6 * power,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      size: 6 + Math.random() * 7,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      life: 0,
      ttl: 70 + Math.random() * 40,
    };
  });

  let raf = 0;
  function frame() {
    c!.clearRect(0, 0, W, H);
    let alive = false;
    for (const p of particles) {
      p.life += 1;
      if (p.life > p.ttl) continue;
      alive = true;
      p.vy += 0.32; // gravity
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      const fade = Math.max(0, 1 - p.life / p.ttl);
      c!.save();
      c!.translate(p.x, p.y);
      c!.rotate(p.rot);
      c!.globalAlpha = fade;
      c!.fillStyle = p.color;
      c!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      c!.restore();
    }
    if (alive) {
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
      canvas.remove();
    }
  }
  raf = requestAnimationFrame(frame);
}
