/** Cursor-reactive shape field for the IM / MILTON hero (canvas 2D, no React/WebGPU). */

type Cell = {
  col: number;
  row: number;
  shape: 0 | 1 | 2;
  phase: number;
  charge: number;
};

let cells: Cell[] = [];
let cols = 0;
let rows = 0;
let cellPx = 16;
let raf = 0;
let running = false;
let reduced = false;
let time = 0;
let lastFrame = 0;

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let host: HTMLElement | null = null;

const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, inside: false };
let resizeObserver: ResizeObserver | null = null;

const CFG = {
  cellSize: 14,
  influence: 140,
  rippleRadius: 52,
  rippleStrength: 0.55,
  driftSpeed: 0.55,
  waveSpeed: 0.42,
  baseGray: 68,
  accent: { r: 255, g: 45, b: 33 },
};

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function buildGrid(w: number, h: number): void {
  cellPx = CFG.cellSize;
  cols = Math.max(1, Math.ceil(w / cellPx));
  rows = Math.max(1, Math.ceil(h / cellPx));
  cells = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const seed = row * cols + col;
      cells.push({
        col,
        row,
        shape: (Math.floor(hash(seed * 1.7) * 3) as 0 | 1 | 2),
        phase: hash(seed * 3.1) * Math.PI * 2,
        charge: 0,
      });
    }
  }
}

function fitCanvas(): { w: number; h: number } {
  if (!canvas || !host || !ctx) return { w: 0, h: 0 };
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetW = Math.round(w * dpr);
  const targetH = Math.round(h * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildGrid(w, h);
  }
  return { w, h };
}

function splashRipple(x: number, y: number, strength: number): void {
  const cx = x / cellPx;
  const cy = y / cellPx;
  const reach = CFG.rippleRadius / cellPx;
  for (const cell of cells) {
    const dx = cell.col - cx;
    const dy = cell.row - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 > reach * reach) continue;
    const bump = strength * Math.exp(-d2 / (reach * reach * 0.35));
    cell.charge = Math.min(1.2, cell.charge + bump);
  }
}

function decayCharges(): void {
  for (const cell of cells) {
    cell.charge *= 0.9;
    if (cell.charge < 0.02) cell.charge = 0;
  }
}

function drawShape(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: 0 | 1 | 2,
): void {
  if (shape === 1) {
    c.fillRect(x - size, y - size, size * 2, size * 2);
    return;
  }
  if (shape === 2) {
    c.beginPath();
    c.moveTo(x, y - size * 1.15);
    c.lineTo(x + size, y + size * 0.85);
    c.lineTo(x - size, y + size * 0.85);
    c.closePath();
    c.fill();
    return;
  }
  c.beginPath();
  c.arc(x, y, size, 0, Math.PI * 2);
  c.fill();
}

function drawAnimatedBackdrop(w: number, h: number): void {
  if (!ctx) return;
  const span = Math.max(w, h);
  const pulse = Math.sin(time * 0.55) * 0.5 + 0.5;

  const base = ctx.createLinearGradient(0, 0, w, h);
  base.addColorStop(0, `rgb(${6 + pulse * 8}, ${5}, ${8 + pulse * 6})`);
  base.addColorStop(0.55, `rgb(${4}, ${4 + pulse * 5}, ${6})`);
  base.addColorStop(1, `rgb(${8 + pulse * 4}, ${6}, ${10})`);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  const orbs = [
    { ax: 0.88, ay: 0.1, r: span * 0.58, phase: 0, rgb: [255, 45, 33], a: 0.26 },
    { ax: 0.12, ay: 0.78, r: span * 0.48, phase: 2.4, rgb: [255, 255, 255], a: 0.07 },
    { ax: 0.52, ay: 0.48, r: span * 0.38, phase: 4.8, rgb: [255, 90, 55], a: 0.1 },
  ] as const;

  for (const orb of orbs) {
    const x = w * (orb.ax + 0.07 * Math.sin(time * 0.38 + orb.phase));
    const y = h * (orb.ay + 0.06 * Math.cos(time * 0.31 + orb.phase * 1.1));
    const radius = orb.r * (0.92 + 0.08 * Math.sin(time * 0.6 + orb.phase));
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(${orb.rgb[0]}, ${orb.rgb[1]}, ${orb.rgb[2]}, ${orb.a})`);
    g.addColorStop(0.55, `rgba(${orb.rgb[0]}, ${orb.rgb[1]}, ${orb.rgb[2]}, ${orb.a * 0.35})`);
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  const sweepX = w * (0.2 + 0.6 * ((Math.sin(time * 0.22) + 1) * 0.5));
  const sweep = ctx.createLinearGradient(sweepX - span * 0.35, 0, sweepX + span * 0.35, h);
  sweep.addColorStop(0, "rgba(0, 0, 0, 0)");
  sweep.addColorStop(0.5, "rgba(255, 255, 255, 0.025)");
  sweep.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = sweep;
  ctx.fillRect(0, 0, w, h);
}

function drawFrame(w: number, h: number, dt: number): void {
  if (!ctx) return;
  time += dt;

  pointer.x += (pointer.tx - pointer.x) * 0.14;
  pointer.y += (pointer.ty - pointer.y) * 0.14;
  decayCharges();

  drawAnimatedBackdrop(w, h);

  const glowX = pointer.inside ? pointer.x : w * (0.5 + 0.12 * Math.sin(time * 0.28));
  const glowY = pointer.inside ? pointer.y : h * (0.45 + 0.1 * Math.cos(time * 0.24));
  const glowR = CFG.influence * (pointer.inside ? 1.45 : 1.1);
  const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowR);
  glow.addColorStop(0, pointer.inside ? "rgba(255, 45, 33, 0.16)" : "rgba(255, 45, 33, 0.08)");
  glow.addColorStop(0.45, "rgba(255, 255, 255, 0.035)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const inf2 = CFG.influence * CFG.influence;
  const flowX = Math.sin(time * CFG.waveSpeed) * 3;
  const flowY = Math.cos(time * CFG.waveSpeed * 0.85) * 2.5;

  for (const cell of cells) {
    const cx = cell.col * cellPx + cellPx * 0.5;
    const cy = cell.row * cellPx + cellPx * 0.5;
    const waveA =
      Math.sin(time * CFG.driftSpeed + cell.phase + cx * 0.014 + cy * 0.011) * 0.5 + 0.5;
    const waveB =
      Math.sin(time * CFG.driftSpeed * 1.35 - cell.phase + cx * 0.008 - cy * 0.013) * 0.5 + 0.5;
    let boost = waveA * 0.16 + waveB * 0.14 + cell.charge * 0.85;

    if (pointer.inside) {
      const dx = cx - pointer.x;
      const dy = cy - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < inf2) {
        const t = 1 - Math.sqrt(d2) / CFG.influence;
        boost += t * t * 0.75;
      }
    }

    const gray = CFG.baseGray + boost * 145;
    const mix = Math.min(1, boost * 1.15);
    const r = Math.round(gray + (CFG.accent.r - gray) * mix * 0.38);
    const g = Math.round(gray + (CFG.accent.g - gray) * mix * 0.38);
    const b = Math.round(gray + (CFG.accent.b - gray) * mix * 0.38);
    ctx.fillStyle = `rgb(${r},${g},${b})`;

    const wobble =
      Math.sin(time * 1.1 + cell.phase) * cellPx * 0.06 + Math.cos(time * 0.7 + cx * 0.03) * cellPx * 0.04;
    const size = cellPx * (0.2 + boost * 0.16 + wobble * 0.015);
    const px = cx + flowX + Math.sin(time * 0.9 + cy * 0.02) * 1.5;
    const py = cy + flowY + Math.cos(time * 0.8 + cx * 0.02) * 1.5;
    drawShape(ctx, px, py, Math.max(cellPx * 0.12, size), cell.shape);
  }
}

function tick(now: number): void {
  raf = 0;
  if (!running || reduced) return;

  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w < 1 || h < 1) {
    raf = requestAnimationFrame(tick);
    return;
  }

  const dt = Math.min(0.05, lastFrame ? (now - lastFrame) / 1000 : 0.016);
  lastFrame = now;

  drawFrame(w, h, dt);
  raf = requestAnimationFrame(tick);
}

function wake(): void {
  if (!running || raf || reduced) return;
  raf = requestAnimationFrame(tick);
}

function paintNow(): void {
  if (!ctx || !host || reduced) return;
  const { w, h } = fitCanvas();
  if (w < 1 || h < 1) return;
  lastFrame = 0;
  drawFrame(w, h, 0);
}

let cachedHostRect: DOMRect | null = null;
function updateHostRect(): void {
  if (host) cachedHostRect = host.getBoundingClientRect();
}

function onPointerMove(e: PointerEvent): void {
  if (!host || reduced) return;
  if (!cachedHostRect) updateHostRect();
  const rect = cachedHostRect;
  if (!rect) return;
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
  pointer.inside = inside;
  if (!inside) return;

  const dx = x - pointer.tx;
  const dy = y - pointer.ty;
  const speed = Math.hypot(dx, dy);
  pointer.tx = x;
  pointer.ty = y;
  splashRipple(x, y, CFG.rippleStrength * (0.35 + Math.min(1, speed * 0.04)));
  wake();
}

function onPointerEnd(e: PointerEvent): void {
  if (e.pointerType === "touch") {
    pointer.inside = false;
  }
}

function onPointerLeave(): void {
  pointer.inside = false;
}

export function initIntroHeroBg(isReducedMotion: boolean): void {
  reduced = isReducedMotion;
  host = document.querySelector<HTMLElement>(".js-intro-hero-bg");
  canvas = document.querySelector<HTMLCanvasElement>(".js-intro-hero-bg-canvas");
  if (!host || !canvas) return;

  ctx = canvas.getContext("2d");
  if (!ctx) return;

  fitCanvas();
  updateHostRect();
  paintNow();

  if (reduced) return;

  resizeObserver = new ResizeObserver(() => {
    fitCanvas();
    updateHostRect();
    wake();
  });
  resizeObserver.observe(document.body);

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerEnd, { passive: true });
  window.addEventListener("pointercancel", onPointerEnd, { passive: true });
  window.addEventListener("scroll", updateHostRect, { passive: true });
  host.addEventListener("pointerleave", onPointerLeave);
}

export function setIntroHeroBgActive(active: boolean): void {
  running = active && !reduced;
  if (running) {
    paintNow();
    wake();
  } else {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }
}

export function destroyIntroHeroBg(): void {
  setIntroHeroBgActive(false);
  resizeObserver?.disconnect();
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerdown", onPointerMove);
  window.removeEventListener("pointerup", onPointerEnd);
  window.removeEventListener("pointercancel", onPointerEnd);
  window.removeEventListener("scroll", updateHostRect);
  host?.removeEventListener("pointerleave", onPointerLeave);
  resizeObserver = null;
  canvas = null;
  ctx = null;
  host = null;
  cachedHostRect = null;
}
