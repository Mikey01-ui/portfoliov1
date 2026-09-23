/**
 * Interactive Multi-Mode Hero Background Engine for "IM MILTON"
 * 
 * Supports 4 Real-Time Modes:
 * 1. "cad"      - The Swiss CAD Workbench (Hairline metric grid, registration crosses, live telemetry, laser drafting projection lines, desk lamp light cone)
 * 2. "silk"     - Aerodynamic Dark Silk Veil (Continuous 3D waving obsidian silk membrane with crimson rim-light sheen and wind physics)
 * 3. "phosphor" - Quantum Phosphor CRT Matrix (Trinitron aperture grille with persistent glowing electron wake decay from mouse movement)
 * 4. "shapes"   - Original geometric shapes canvas
 */

export type HeroBgMode = "cad" | "silk" | "phosphor" | "shapes";

let currentMode: HeroBgMode = "phosphor";

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let host: HTMLElement | null = null;

let raf = 0;
let running = false;
let reduced = false;
let time = 0;
let lastFrame = 0;
let resizeObserver: ResizeObserver | null = null;

const pointer = {
  x: -9999,
  y: -9999,
  tx: -9999,
  ty: -9999,
  vx: 0,
  vy: 0,
  speed: 0,
  inside: false,
};

// Incision trail for CAD mode
type TrailPoint = { x: number; y: number; time: number };
const cadTrail: TrailPoint[] = [];

// Phosphor excitation array
let phosphorCols = 0;
let phosphorRows = 0;
let phosphorGrid: Float32Array = new Float32Array(0);

// Original shapes cells
type ShapeCell = {
  col: number;
  row: number;
  shape: 0 | 1 | 2;
  phase: number;
  charge: number;
};
let shapeCells: ShapeCell[] = [];
let shapeCols = 0;
let shapeRows = 0;
const SHAPE_CFG = {
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

function initPhosphorGrid(w: number, h: number): void {
  const step = 12;
  phosphorCols = Math.max(1, Math.ceil(w / step));
  phosphorRows = Math.max(1, Math.ceil(h / step));
  phosphorGrid = new Float32Array(phosphorCols * phosphorRows);
}

function initShapeGrid(w: number, h: number): void {
  const cellPx = SHAPE_CFG.cellSize;
  shapeCols = Math.max(1, Math.ceil(w / cellPx));
  shapeRows = Math.max(1, Math.ceil(h / cellPx));
  shapeCells = [];
  for (let row = 0; row < shapeRows; row += 1) {
    for (let col = 0; col < shapeCols; col += 1) {
      const seed = row * shapeCols + col;
      shapeCells.push({
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

    initPhosphorGrid(w, h);
    initShapeGrid(w, h);
  }
  return { w, h };
}

/* =========================================================================
   MODE 1: SWISS CAD WORKBENCH
   ========================================================================= */
function drawCadMode(c: CanvasRenderingContext2D, w: number, h: number): void {
  // Base dark obsidian drafting board
  c.fillStyle = "#08090b";
  c.fillRect(0, 0, w, h);

  // Soft articulated desk-lamp ambient glow following pointer
  const lampX = pointer.inside ? pointer.x : w * 0.5 + Math.sin(time * 0.4) * 80;
  const lampY = pointer.inside ? pointer.y : h * 0.45 + Math.cos(time * 0.35) * 60;
  const lampRadius = Math.max(340, w * 0.32);
  const lamp = c.createRadialGradient(lampX, lampY, 0, lampX, lampY, lampRadius);
  lamp.addColorStop(0, pointer.inside ? "rgba(255, 45, 33, 0.08)" : "rgba(255, 45, 33, 0.04)");
  lamp.addColorStop(0.35, "rgba(255, 255, 255, 0.025)");
  lamp.addColorStop(1, "rgba(0, 0, 0, 0)");
  c.fillStyle = lamp;
  c.fillRect(0, 0, w, h);

  // Grid lines
  const majorStep = 72;
  const minorStep = 24;

  // Minor hairlines
  c.strokeStyle = "rgba(255, 255, 255, 0.025)";
  c.lineWidth = 0.5;
  c.beginPath();
  for (let x = 0; x <= w; x += minorStep) {
    if (x % majorStep === 0) continue;
    c.moveTo(x, 0);
    c.lineTo(x, h);
  }
  for (let y = 0; y <= h; y += minorStep) {
    if (y % majorStep === 0) continue;
    c.moveTo(0, y);
    c.lineTo(w, y);
  }
  c.stroke();

  // Major architectural grid lines
  c.strokeStyle = "rgba(255, 255, 255, 0.055)";
  c.lineWidth = 0.75;
  c.beginPath();
  for (let x = 0; x <= w; x += majorStep) {
    c.moveTo(x, 0);
    c.lineTo(x, h);
  }
  for (let y = 0; y <= h; y += majorStep) {
    c.moveTo(0, y);
    c.lineTo(w, y);
  }
  c.stroke();

  // Registration crosshairs (+) at intersections
  c.strokeStyle = "rgba(255, 45, 33, 0.38)";
  c.lineWidth = 1;
  const crossSize = 4;
  c.beginPath();
  for (let x = majorStep; x < w; x += majorStep * 2) {
    for (let y = majorStep; y < h; y += majorStep * 2) {
      c.moveTo(x - crossSize, y);
      c.lineTo(x + crossSize, y);
      c.moveTo(x, y - crossSize);
      c.lineTo(x, y + crossSize);
    }
  }
  c.stroke();

  // Self-healing incision trail
  const now = performance.now();
  if (cadTrail.length > 1) {
    c.lineWidth = 1.25;
    for (let i = 1; i < cadTrail.length; i += 1) {
      const p1 = cadTrail[i - 1]!;
      const p2 = cadTrail[i]!;
      const age = (now - p2.time) / 1000;
      if (age > 1.2) continue;
      const alpha = (1 - age / 1.2) * 0.45;
      c.strokeStyle = `rgba(255, 220, 200, ${alpha})`;
      c.beginPath();
      c.moveTo(p1.x, p1.y);
      c.lineTo(p2.x, p2.y);
      c.stroke();
    }
  }

  // Orthogonal laser drafting lines & projection to landmarks
  if (pointer.inside) {
    // Crosshair through cursor
    c.strokeStyle = "rgba(255, 45, 33, 0.32)";
    c.lineWidth = 0.75;
    c.setLineDash([4, 6]);
    c.beginPath();
    c.moveTo(pointer.x, 0);
    c.lineTo(pointer.x, h);
    c.moveTo(0, pointer.y);
    c.lineTo(w, pointer.y);
    c.stroke();
    c.setLineDash([]);

    // Central cursor coordinate reticle
    c.strokeStyle = "#ff2d21";
    c.lineWidth = 1;
    c.strokeRect(pointer.x - 7, pointer.y - 7, 14, 14);

    // Dimension readouts near cursor
    c.font = '600 9px "Inter", monospace';
    c.fillStyle = "rgba(255, 255, 255, 0.65)";
    c.fillText(
      `X: ${Math.round(pointer.x)}  Y: ${Math.round(pointer.y)}`,
      pointer.x + 12,
      pointer.y - 10,
    );
  }

  // Live Monospace Telemetry in corners
  c.font = '600 9px "Inter", monospace';
  c.fillStyle = "rgba(255, 255, 255, 0.35)";
  const pxMm = pointer.inside ? (pointer.x * 0.264).toFixed(1) : "000.0";
  const pyMm = pointer.inside ? (pointer.y * 0.264).toFixed(1) : "000.0";
  c.fillText(`[POS_X: ${pxMm}mm · POS_Y: ${pyMm}mm]`, 28, 36);
  c.fillText(`[SYSTEM: 60FPS · ENGINE: SWISS_CAD_v4]`, w - 240, 36);
  c.fillText(`[MAT NO. 04 · METRIC CALIBRATION · KAPITEIN LABS]`, 28, h - 28);
  c.fillText(`[SCALE 1:1 · ARCHITECTURAL SPEC · 2026]`, w - 245, h - 28);
}

/* =========================================================================
   MODE 2: AERODYNAMIC DARK SILK VEIL
   ========================================================================= */
function drawSilkMode(c: CanvasRenderingContext2D, w: number, h: number): void {
  c.fillStyle = "#07080a";
  c.fillRect(0, 0, w, h);

  const nx = 36;
  const ny = 22;
  const dx = w / (nx - 1);
  const dy = h / (ny - 1);

  // Compute 2.5D height matrix with Gerstner-style waves + mouse wind wake
  const heights: number[][] = [];
  const mouseInfluenceRadius = 240;

  for (let j = 0; j < ny; j += 1) {
    heights[j] = [];
    const py = j * dy;
    for (let i = 0; i < nx; i += 1) {
      const px = i * dx;

      // Layered continuous harmonics
      let z =
        Math.sin(px * 0.0035 + time * 1.25 + py * 0.0025) * 22 +
        Math.cos(px * 0.0055 - time * 0.95 - py * 0.0045) * 16 +
        Math.sin((px + py) * 0.003 + time * 0.6) * 10;

      // Pointer wind ripple
      if (pointer.inside) {
        const d = Math.hypot(px - pointer.x, py - pointer.y);
        if (d < mouseInfluenceRadius) {
          const factor = (1 - d / mouseInfluenceRadius) * Math.min(1.5, pointer.speed * 0.035);
          z += Math.sin(d * 0.06 - time * 4.0) * factor * 26;
        }
      }

      heights[j]![i] = z;
    }
  }

  // Render shaded silk quads with anisotropic rim-sheen
  for (let j = 0; j < ny - 1; j += 1) {
    const y0 = j * dy;
    const y1 = (j + 1) * dy;
    for (let i = 0; i < nx - 1; i += 1) {
      const x0 = i * dx;
      const x1 = (i + 1) * dx;

      const z00 = heights[j]![i]!;
      const z10 = heights[j]![i + 1]!;
      const z01 = heights[j + 1]![i]!;

      // Normal slope approximation
      const dzx = (z10 - z00) / dx;
      const dzy = (z01 - z00) / dy;

      // Diffuse & Grazing specular lighting
      const light = Math.max(0, Math.min(1, 0.45 + dzx * 0.35 + dzy * 0.25));
      const grazing = Math.pow(Math.max(0, Math.hypot(dzx, dzy) * 0.5), 1.6);

      // Deep charcoal base with rich crimson fold rim-light
      const baseVal = Math.round(8 + light * 24);
      const rimAlpha = Math.min(0.48, grazing * 0.55);

      c.fillStyle = `rgb(${baseVal}, ${baseVal + 1}, ${baseVal + 3})`;
      c.beginPath();
      c.moveTo(x0, y0 + z00 * 0.3);
      c.lineTo(x1, y0 + z10 * 0.3);
      c.lineTo(x1, y1 + heights[j + 1]![i + 1]! * 0.3);
      c.lineTo(x0, y1 + z01 * 0.3);
      c.closePath();
      c.fill();

      // Anisotropic crimson sheen on crests
      if (rimAlpha > 0.04) {
        c.fillStyle = `rgba(255, 45, 33, ${rimAlpha})`;
        c.fill();
      }
    }
  }

  // Topographic tension contours
  c.strokeStyle = "rgba(255, 255, 255, 0.035)";
  c.lineWidth = 0.5;
  for (let j = 0; j < ny; j += 2) {
    c.beginPath();
    for (let i = 0; i < nx; i += 1) {
      const px = i * dx;
      const py = j * dy + heights[j]![i]! * 0.3;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.stroke();
  }
}

/* =========================================================================
   MODE 3: QUANTUM PHOSPHOR CRT MATRIX (PERMANENT SELECTION)
   ========================================================================= */
function drawPhosphorMode(c: CanvasRenderingContext2D, w: number, h: number): void {
  // Deep cathode void
  c.fillStyle = "#040406";
  c.fillRect(0, 0, w, h);

  const step = 12;
  const cols = phosphorCols;
  const rows = phosphorRows;
  if (!cols || !rows || phosphorGrid.length !== cols * rows) {
    initPhosphorGrid(w, h);
    return;
  }

  // Pointer excitation: inject electron energy into phosphor grid
  if (pointer.inside) {
    const pcx = pointer.x / step;
    const pcy = pointer.y / step;
    const radiusCells = 12;
    const r2 = radiusCells * radiusCells;
    const impulse = 0.55 + Math.min(1.4, pointer.speed * 0.045);

    const minCol = Math.max(0, Math.floor(pcx - radiusCells));
    const maxCol = Math.min(cols - 1, Math.ceil(pcx + radiusCells));
    const minRow = Math.max(0, Math.floor(pcy - radiusCells));
    const maxRow = Math.min(rows - 1, Math.ceil(pcy + radiusCells));

    for (let r = minRow; r <= maxRow; r += 1) {
      for (let cl = minCol; cl <= maxCol; cl += 1) {
        const d2 = (cl - pcx) * (cl - pcx) + (r - pcy) * (r - pcy);
        if (d2 < r2) {
          const boost = Math.exp(-d2 / (r2 * 0.38)) * impulse;
          const idx = r * cols + cl;
          phosphorGrid[idx] = Math.min(2.0, (phosphorGrid[idx] || 0) + boost);
        }
      }
    }
  }

  // Soft cursor halo glow
  if (pointer.inside) {
    const halo = c.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 180);
    halo.addColorStop(0, "rgba(255, 45, 33, 0.12)");
    halo.addColorStop(0.5, "rgba(255, 45, 33, 0.03)");
    halo.addColorStop(1, "rgba(0, 0, 0, 0)");
    c.fillStyle = halo;
    c.fillRect(0, 0, w, h);
  }

  // Ambient cathode scanline wave traveling down
  const scanlineY = (time * 110) % h;
  const scanlineRow = Math.floor(scanlineY / step);

  // Group phosphors for ultra-high FPS batch rendering
  const idlePath = new Path2D();
  const beamPath = new Path2D();

  for (let r = 0; r < rows; r += 1) {
    const py = r * step + step * 0.5;
    const isCathodeRow = Math.abs(r - scanlineRow) < 2;

    for (let cl = 0; cl < cols; cl += 1) {
      const idx = r * cols + cl;
      let charge = phosphorGrid[idx] || 0;

      // Exponential half-life decay
      charge *= 0.938;
      if (charge < 0.015) charge = 0;
      phosphorGrid[idx] = charge;

      const px = cl * step + step * 0.5;

      if (charge > 0.05) {
        // High excitation: Blazing crimson core with white-hot centroid
        const rVal = 255;
        const gVal = Math.round(45 + Math.min(1, charge - 0.45) * 190);
        const bVal = Math.round(33 + Math.min(1, charge - 0.45) * 190);
        const dotSize = Math.min(step * 0.48, 2.2 + charge * 2.8);

        c.fillStyle = `rgba(${rVal}, ${gVal}, ${bVal}, ${Math.min(1, charge * 0.92)})`;
        c.beginPath();
        c.arc(px, py, dotSize, 0, Math.PI * 2);
        c.fill();
      } else if (isCathodeRow) {
        beamPath.rect(px - 1, py - 1, 2, 2);
      } else {
        idlePath.rect(px - 1, py - 1, 1.5, 1.5);
      }
    }
  }

  // Draw batched idle and beam phosphors
  c.fillStyle = "rgba(180, 200, 230, 0.045)";
  c.fill(idlePath);

  c.fillStyle = "rgba(255, 100, 80, 0.22)";
  c.fill(beamPath);

  // Subtle registration crosshairs (+) at architectural intervals
  c.strokeStyle = "rgba(255, 45, 33, 0.22)";
  c.lineWidth = 1;
  const crossSize = 3;
  c.beginPath();
  for (let x = 120; x < w; x += 240) {
    for (let y = 120; y < h; y += 240) {
      c.moveTo(x - crossSize, y);
      c.lineTo(x + crossSize, y);
      c.moveTo(x, y - crossSize);
      c.lineTo(x, y + crossSize);
    }
  }
  c.stroke();

  // Horizontal CRT scanline overlay
  c.fillStyle = "rgba(0, 0, 0, 0.15)";
  for (let y = 0; y < h; y += 4) {
    c.fillRect(0, y, w, 1.5);
  }

  // Precision Technical Monospace HUD Telemetry
  c.font = '600 9px "Inter", monospace';
  c.fillStyle = "rgba(255, 255, 255, 0.28)";
  const pxMm = pointer.inside ? (pointer.x * 0.264).toFixed(1) : "000.0";
  const pyMm = pointer.inside ? (pointer.y * 0.264).toFixed(1) : "000.0";
  c.fillText(`[CRT_BEAM // POS_X: ${pxMm}mm · POS_Y: ${pyMm}mm]`, 28, 36);
  c.fillText(`[REFRESH: 120Hz · PHOSPHOR_MATRIX_v3]`, w - 240, 36);
  c.fillText(`[KAPITEIN LABS · TRINITRON RETRO-FUTURE]`, 28, h - 28);
  c.fillText(`[ELECTRON FLUX: ${pointer.inside ? "ENGAGED" : "STANDBY"}]`, w - 215, h - 28);
}

/* =========================================================================
   MODE 4: ORIGINAL GEOMETRIC SHAPES
   ========================================================================= */
function drawShapesMode(c: CanvasRenderingContext2D, w: number, h: number): void {
  const span = Math.max(w, h);
  const pulse = Math.sin(time * 0.55) * 0.5 + 0.5;

  const base = c.createLinearGradient(0, 0, w, h);
  base.addColorStop(0, `rgb(${6 + pulse * 8}, ${5}, ${8 + pulse * 6})`);
  base.addColorStop(0.55, `rgb(${4}, ${4 + pulse * 5}, ${6})`);
  base.addColorStop(1, `rgb(${8 + pulse * 4}, ${6}, ${10})`);
  c.fillStyle = base;
  c.fillRect(0, 0, w, h);

  const orbs = [
    { ax: 0.88, ay: 0.1, r: span * 0.58, phase: 0, rgb: [255, 45, 33], a: 0.26 },
    { ax: 0.12, ay: 0.78, r: span * 0.48, phase: 2.4, rgb: [255, 255, 255], a: 0.07 },
    { ax: 0.52, ay: 0.48, r: span * 0.38, phase: 4.8, rgb: [255, 90, 55], a: 0.1 },
  ] as const;

  for (const orb of orbs) {
    const x = w * (orb.ax + 0.07 * Math.sin(time * 0.38 + orb.phase));
    const y = h * (orb.ay + 0.06 * Math.cos(time * 0.31 + orb.phase * 1.1));
    const radius = orb.r * (0.92 + 0.08 * Math.sin(time * 0.6 + orb.phase));
    const g = c.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(${orb.rgb[0]}, ${orb.rgb[1]}, ${orb.rgb[2]}, ${orb.a})`);
    g.addColorStop(0.55, `rgba(${orb.rgb[0]}, ${orb.rgb[1]}, ${orb.rgb[2]}, ${orb.a * 0.35})`);
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }

  // Decay charges
  for (const cell of shapeCells) {
    cell.charge *= 0.9;
    if (cell.charge < 0.02) cell.charge = 0;
  }

  const inf2 = SHAPE_CFG.influence * SHAPE_CFG.influence;
  const flowX = Math.sin(time * SHAPE_CFG.waveSpeed) * 3;
  const flowY = Math.cos(time * SHAPE_CFG.waveSpeed * 0.85) * 2.5;

  for (const cell of shapeCells) {
    const cx = cell.col * SHAPE_CFG.cellSize + SHAPE_CFG.cellSize * 0.5;
    const cy = cell.row * SHAPE_CFG.cellSize + SHAPE_CFG.cellSize * 0.5;
    const waveA =
      Math.sin(time * SHAPE_CFG.driftSpeed + cell.phase + cx * 0.014 + cy * 0.011) * 0.5 + 0.5;
    const waveB =
      Math.sin(time * SHAPE_CFG.driftSpeed * 1.35 - cell.phase + cx * 0.008 - cy * 0.013) * 0.5 + 0.5;
    let boost = waveA * 0.16 + waveB * 0.14 + cell.charge * 0.85;

    if (pointer.inside) {
      const dx = cx - pointer.x;
      const dy = cy - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < inf2) {
        const t = 1 - Math.sqrt(d2) / SHAPE_CFG.influence;
        boost += t * t * 0.75;
      }
    }

    const gray = SHAPE_CFG.baseGray + boost * 145;
    const mix = Math.min(1, boost * 1.15);
    const r = Math.round(gray + (SHAPE_CFG.accent.r - gray) * mix * 0.38);
    const g = Math.round(gray + (SHAPE_CFG.accent.g - gray) * mix * 0.38);
    const b = Math.round(gray + (SHAPE_CFG.accent.b - gray) * mix * 0.38);
    c.fillStyle = `rgb(${r},${g},${b})`;

    const size = Math.max(2, SHAPE_CFG.cellSize * (0.2 + boost * 0.16));
    const px = cx + flowX;
    const py = cy + flowY;

    if (cell.shape === 1) {
      c.fillRect(px - size, py - size, size * 2, size * 2);
    } else if (cell.shape === 2) {
      c.beginPath();
      c.moveTo(px, py - size * 1.15);
      c.lineTo(px + size, py + size * 0.85);
      c.lineTo(px - size, py + size * 0.85);
      c.closePath();
      c.fill();
    } else {
      c.beginPath();
      c.arc(px, py, size, 0, Math.PI * 2);
      c.fill();
    }
  }
}

/* =========================================================================
   FRAME DISPATCHER
   ========================================================================= */
function drawFrame(w: number, h: number, dt: number): void {
  if (!ctx) return;
  time += dt;

  // Pointer smoothing
  const oldX = pointer.x;
  const oldY = pointer.y;
  pointer.x += (pointer.tx - pointer.x) * 0.16;
  pointer.y += (pointer.ty - pointer.y) * 0.16;
  pointer.vx = pointer.x - oldX;
  pointer.vy = pointer.y - oldY;
  pointer.speed = Math.hypot(pointer.vx, pointer.vy);

  // Add to CAD cut trail
  if (currentMode === "cad" && pointer.inside && pointer.speed > 1.2) {
    cadTrail.push({ x: pointer.x, y: pointer.y, time: performance.now() });
    if (cadTrail.length > 32) cadTrail.shift();
  }

  // Dispatch current mode
  switch (currentMode) {
    case "cad":
      drawCadMode(ctx, w, h);
      break;
    case "silk":
      drawSilkMode(ctx, w, h);
      break;
    case "phosphor":
      drawPhosphorMode(ctx, w, h);
      break;
    case "shapes":
    default:
      drawShapesMode(ctx, w, h);
      break;
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

  pointer.tx = x;
  pointer.ty = y;

  if (currentMode === "shapes") {
    const cx = x / SHAPE_CFG.cellSize;
    const cy = y / SHAPE_CFG.cellSize;
    const reach = SHAPE_CFG.rippleRadius / SHAPE_CFG.cellSize;
    for (const cell of shapeCells) {
      const dx = cell.col - cx;
      const dy = cell.row - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 > reach * reach) continue;
      const bump = SHAPE_CFG.rippleStrength * Math.exp(-d2 / (reach * reach * 0.35));
      cell.charge = Math.min(1.2, cell.charge + bump);
    }
  }

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

/* =========================================================================
   PUBLIC API & MODE SWITCHER
   ========================================================================= */
export function setHeroBgMode(mode: HeroBgMode, updateUrl = true): void {
  currentMode = mode;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("hero_bg_mode", mode);
    } catch {
      /* ignore */
    }
  }

  if (updateUrl && typeof window !== "undefined" && window.history?.replaceState) {
    const url = new URL(window.location.href);
    url.searchParams.set("bg", mode);
    window.history.replaceState(null, "", url.toString());
  }

  // Update switcher UI buttons
  const btns = document.querySelectorAll<HTMLElement>(".js-hero-bg-btn");
  btns.forEach((btn) => {
    if (btn.dataset.mode === mode) {
      btn.classList.add("is-active");
    } else {
      btn.classList.remove("is-active");
    }
  });

  paintNow();
  wake();
}

export function getHeroBgMode(): HeroBgMode {
  return currentMode;
}

function initSwitcherUI(): void {
  const btns = document.querySelectorAll<HTMLButtonElement>(".js-hero-bg-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const mode = btn.dataset.mode as HeroBgMode;
      if (mode) setHeroBgMode(mode);
    });
  });
}

export function initIntroHeroBg(isReducedMotion: boolean): void {
  reduced = isReducedMotion;
  host = document.querySelector<HTMLElement>(".js-intro-hero-bg");
  canvas = document.querySelector<HTMLCanvasElement>(".js-intro-hero-bg-canvas");
  if (!host || !canvas) return;

  ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Resolve initial mode from URL search param or default to phosphor
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const paramMode = params.get("bg") as HeroBgMode | null;
    if (paramMode && ["cad", "silk", "phosphor", "shapes"].includes(paramMode)) {
      currentMode = paramMode;
    } else {
      currentMode = "phosphor"; // Default permanent choice
    }
    try {
      localStorage.setItem("hero_bg_mode", currentMode);
    } catch {
      /* ignore */
    }
  }

  fitCanvas();
  updateHostRect();
  initSwitcherUI();
  setHeroBgMode(currentMode, false);
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
