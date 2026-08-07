// DOM confetti burst — lightweight, no canvas, CSS-animated divs.

const COLORS = ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#b5179e', '#ff9e00'];

export function burst(originX = 0.5, originY = 0.4, count = 40) {
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:999;overflow:hidden;';
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    const size = 6 + Math.random() * 8;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6; // mostly upward
    const speed = 300 + Math.random() * 500;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const rot = Math.random() * 720 - 360;
    piece.style.cssText = `
      position:absolute;
      left:${originX * 100}%; top:${originY * 100}%;
      width:${size}px; height:${size * 0.6}px;
      background:${color};
      border-radius:2px;
      transform:translate(-50%,-50%) rotate(0deg);
      will-change:transform,opacity;
    `;
    container.appendChild(piece);

    const start = performance.now();
    const dur = 900 + Math.random() * 600;
    (function frame(now) {
      const t = (now - start) / dur;
      if (t >= 1) { piece.remove(); return; }
      const x = vx * t;
      const y = vy * t + 0.5 * 600 * t * t; // gravity
      piece.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rot * t}deg)`;
      piece.style.opacity = String(1 - t);
      requestAnimationFrame(frame);
    })(start);
  }

  setTimeout(() => container.remove(), 2000);
}
