/** A small canvas confetti burst. Respects reduced motion. */
export function confetti(n = 150) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.id = 'confetti';
  document.body.appendChild(c);
  const x = c.getContext('2d');
  if (!x) return;
  const dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cols = ['#5B5BF0', '#8C8DFF', '#3B2FC9', '#0E9C9B', '#14A05A', '#F59E0B'];
  const ps = Array.from({ length: n }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.38,
    vx: (Math.random() - 0.5) * 15, vy: Math.random() * -13 - 4, r: Math.random() * 7 + 4,
    c: cols[(Math.random() * cols.length) | 0], a: Math.random() * 6, s: (Math.random() - 0.5) * 0.35,
  }));
  let f = 0;
  const tick = () => {
    x.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of ps) {
      p.vy += 0.34; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.s;
      x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore();
    }
    if (++f < 160) requestAnimationFrame(tick); else c.remove();
  };
  tick();
}
