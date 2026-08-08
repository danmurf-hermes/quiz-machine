// DOM confetti burst — lightweight, no canvas, CSS-animated divs.

const COLORS = ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#b5179e', '#ff9e00'];

function makePiece(container, originX, originY, size, color, angle, speed, gravity, dur, rotSpeed) {
  const piece = document.createElement('div');
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

  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  const start = performance.now();
  (function frame(now) {
    const t = (now - start) / dur;
    if (t >= 1) { piece.remove(); return; }
    const x = vx * t;
    const y = vy * t + 0.5 * gravity * t * t;
    piece.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rot * t * rotSpeed}deg)`;
    piece.style.opacity = String(1 - t);
    requestAnimationFrame(frame);
  })(start);
}

function makeContainer() {
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:999;overflow:hidden;';
  document.body.appendChild(container);
  return container;
}

export function burst(originX = 0.5, originY = 0.4, count = 40) {
  const container = makeContainer();
  for (let i = 0; i < count; i++) {
    const size = 6 + Math.random() * 8;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6; // mostly upward
    const speed = 300 + Math.random() * 500;
    makePiece(container, originX, originY, size, color, angle, speed, 600, 900 + Math.random() * 600, 1);
  }
  setTimeout(() => container.remove(), 2000);
}

// Bigger, longer, sparklier — for milestones
export function bigBurst(originX = 0.5, originY = 0.3, count = 90) {
  const container = makeContainer();
  for (let i = 0; i < count; i++) {
    const size = 7 + Math.random() * 10;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.4; // wider spread
    const speed = 400 + Math.random() * 700;
    makePiece(container, originX, originY, size, color, angle, speed, 500, 1200 + Math.random() * 800, 1.5);
  }
  setTimeout(() => container.remove(), 2500);
}

// Falling streamers from the top of the screen — for milestones
export function streamers(count = 24) {
  const container = makeContainer();
  for (let i = 0; i < count; i++) {
    const size = 8 + Math.random() * 10;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const x = Math.random();
    const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.6; // straight down-ish
    const speed = 120 + Math.random() * 200;
    makePiece(container, x, -0.05, size, color, angle, speed, 300, 1800 + Math.random() * 1200, 2);
  }
  setTimeout(() => container.remove(), 3500);
}
