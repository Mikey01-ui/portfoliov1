import gsap from "gsap";
import { site } from "../content/site";

type PixelYoApi = {
  layer: HTMLElement;
  resetReveal: () => void;
};

let activeApi: PixelYoApi | null = null;
let yoRevealComplete = false;
const yoCompleteHandlers = new Set<() => void>();

export function isIntroYoRevealComplete(): boolean {
  return yoRevealComplete;
}

export function onIntroYoRevealComplete(handler: () => void): () => void {
  yoCompleteHandlers.add(handler);
  return () => yoCompleteHandlers.delete(handler);
}

function emitYoRevealComplete(): void {
  if (yoRevealComplete) return;
  yoRevealComplete = true;
  yoCompleteHandlers.forEach((handler) => handler());
}

export function resetIntroPixelYo(): void {
  yoRevealComplete = false;
  activeApi?.resetReveal();
}

export function getIntroPixelYoLayer(): HTMLElement | null {
  return activeApi?.layer ?? document.querySelector<HTMLElement>(".js-intro-pixel-yo");
}

function viewSize(): { w: number; h: number } {
  return {
    w: document.documentElement.clientWidth || window.innerWidth,
    h: window.innerHeight,
  };
}

async function ensureFonts(fontSize: number): Promise<void> {
  if (!document.fonts?.load) return;
  await Promise.all([
    document.fonts.load(`800 ${fontSize}px "${site.serifFont}"`),
    document.fonts.load(`800 ${fontSize}px "${site.sansFont}"`),
  ]);
  await document.fonts.ready;
}

function fontSizeForViewport(w: number, h: number): number {
  const { minWidthRatio, minPx, maxPx } = site.introYo;
  const scaled = Math.min(w * minWidthRatio, h * 0.45, maxPx);
  return Math.max(minPx, scaled);
}

/** Rasterise text into a small cell grid (only the glyph area). */
function rasterizeText(
  text: string,
  cellSize: number,
  fontSize: number,
): { cols: number; rows: number; filled: Uint8Array } {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const empty = { cols: 0, rows: 0, filled: new Uint8Array(0) };
  if (!ctx) return empty;

  const font = `800 ${fontSize}px "${site.serifFont}", "${site.sansFont}", Georgia, serif`;
  ctx.font = font;
  const metrics = ctx.measureText(text);
  const pad = cellSize * 3;
  const canvasW = Math.ceil(metrics.width + pad * 2);
  const canvasH = Math.ceil(fontSize * 1.35 + pad * 2);

  canvas.width = canvasW;
  canvas.height = canvasH;

  ctx.font = font;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(text, pad, pad);

  const cols = Math.ceil(canvasW / cellSize);
  const rows = Math.ceil(canvasH / cellSize);
  const filled = new Uint8Array(cols * rows);
  const { data } = ctx.getImageData(0, 0, canvasW, canvasH);

  const isWhiteInk = (px: number, py: number): boolean => {
    const i = (py * canvasW + px) * 4;
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const a = data[i + 3]!;
    return a > 32 && r + g + b > 420;
  };

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x0 = col * cellSize;
      const y0 = row * cellSize;
      let hits = 0;
      let n = 0;
      for (let py = y0; py < y0 + cellSize && py < canvasH; py += 2) {
        for (let px = x0; px < x0 + cellSize && px < canvasW; px += 2) {
          if (isWhiteInk(px, py)) hits += 1;
          n += 1;
        }
      }
      if (n > 0 && hits / n > 0.28) {
        filled[row * cols + col] = 1;
      }
    }
  }

  return trimGlyphGrid(cols, rows, filled);
}

/** Drop empty padding so only the letter shapes are centered on screen. */
function trimGlyphGrid(
  cols: number,
  rows: number,
  filled: Uint8Array,
): { cols: number; rows: number; filled: Uint8Array } {
  let minCol = cols;
  let maxCol = -1;
  let minRow = rows;
  let maxRow = -1;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!filled[row * cols + col]) continue;
      minCol = Math.min(minCol, col);
      maxCol = Math.max(maxCol, col);
      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);
    }
  }

  if (maxCol < minCol || maxRow < minRow) {
    return { cols: 0, rows: 0, filled: new Uint8Array(0) };
  }

  const outCols = maxCol - minCol + 1;
  const outRows = maxRow - minRow + 1;
  const out = new Uint8Array(outCols * outRows);
  for (let row = minRow; row <= maxRow; row += 1) {
    for (let col = minCol; col <= maxCol; col += 1) {
      if (filled[row * cols + col]) {
        out[(row - minRow) * outCols + (col - minCol)] = 1;
      }
    }
  }

  return { cols: outCols, rows: outRows, filled: out };
}

/** Place glyph grid dead centre on the full-screen cell grid. */
function buildViewportMask(
  viewW: number,
  viewH: number,
  cellSize: number,
  fontSize: number,
): { cols: number; rows: number; yoMask: Uint8Array } {
  const cols = Math.ceil(viewW / cellSize);
  const rows = Math.ceil(viewH / cellSize);
  const yoMask = new Uint8Array(cols * rows);

  const glyph = rasterizeText(site.introYo.text, cellSize, fontSize);
  if (glyph.cols === 0 || glyph.rows === 0) return { cols, rows, yoMask };

  const startCol = Math.floor((cols - glyph.cols) / 2);
  const startRow = Math.floor((rows - glyph.rows) / 2);

  for (let row = 0; row < glyph.rows; row += 1) {
    for (let col = 0; col < glyph.cols; col += 1) {
      if (!glyph.filled[row * glyph.cols + col]) continue;
      const vc = startCol + col;
      const vr = startRow + row;
      if (vc < 0 || vr < 0 || vc >= cols || vr >= rows) continue;
      yoMask[vr * cols + vc] = 1;
    }
  }

  return { cols, rows, yoMask };
}

function shuffle(n: number): Uint32Array {
  const a = new Uint32Array(n);
  for (let i = 0; i < n; i += 1) a[i] = i;
  for (let i = n - 1; i > 0; i -= 1) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

type Grid = {
  cols: number;
  rows: number;
  cellSize: number;
  yoMask: Uint8Array;
  cellAlpha: Float32Array;
  cellFlash: Float32Array;
};

function draw(ctx: CanvasRenderingContext2D, grid: Grid, w: number, h: number): void {
  const { cols, rows, cellSize, yoMask, cellAlpha, cellFlash } = grid;
  const { color, dotScale, pageGridDim } = site.introYo;
  const dot = cellSize * dotScale;
  const offset = (cellSize - dot) * 0.5;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  // Group into 4 discrete alpha buckets to reduce GPU state changes from 170k to 4 per frame
  const p1 = new Path2D(); // dim flash / idle
  const p2 = new Path2D(); // mid flash
  const p3 = new Path2D(); // high flash
  const p4 = new Path2D(); // resolved YO letters

  let c1 = 0;
  let c2 = 0;
  let c3 = 0;
  let c4 = 0;

  for (let row = 0; row < rows; row += 1) {
    const y = row * cellSize + offset;
    const rowOffset = row * cols;
    for (let col = 0; col < cols; col += 1) {
      const i = rowOffset + col;
      let a = 0;
      if (yoMask[i]) a = cellAlpha[i]!;
      else a = Math.max(cellFlash[i]!, pageGridDim);
      if (a < 0.05) continue;

      const x = col * cellSize + offset;
      if (a > 0.85) {
        p4.rect(x, y, dot, dot);
        c4 += 1;
      } else if (a > 0.55) {
        p3.rect(x, y, dot, dot);
        c3 += 1;
      } else if (a > 0.25) {
        p2.rect(x, y, dot, dot);
        c2 += 1;
      } else {
        p1.rect(x, y, dot, dot);
        c1 += 1;
      }
    }
  }

  ctx.fillStyle = color;
  if (c1 > 0) {
    ctx.globalAlpha = 0.18;
    ctx.fill(p1);
  }
  if (c2 > 0) {
    ctx.globalAlpha = 0.42;
    ctx.fill(p2);
  }
  if (c3 > 0) {
    ctx.globalAlpha = 0.7;
    ctx.fill(p3);
  }
  if (c4 > 0) {
    ctx.globalAlpha = 1.0;
    ctx.fill(p4);
  }
  ctx.globalAlpha = 1;
}

export async function initIntroPixelYo(reducedMotion: boolean): Promise<PixelYoApi | null> {
  const layer = document.querySelector<HTMLElement>(".js-intro-pixel-yo");
  const canvas = document.querySelector<HTMLCanvasElement>(".js-intro-pixel-canvas");
  if (!layer || !canvas) return null;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;

  let grid: Grid | null = null;
  let scanTween: gsap.core.Tween | null = null;
  let finishDelayedCall: gsap.core.Tween | null = null;
  let fadeRaf = 0;
  let scanIdx = 0;
  let scanOrder: Uint32Array<ArrayBufferLike> = new Uint32Array(0);

  const fitCanvas = (): { w: number; h: number } => {
    const { w, h } = viewSize();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w, h };
  };

  const buildGrid = async (): Promise<Grid> => {
    const { w, h } = fitCanvas();
    const cellSize = site.introYo.cellSize;
    const fontSize = fontSizeForViewport(w, h);
    await ensureFonts(fontSize);
    const { cols, rows, yoMask } = buildViewportMask(w, h, cellSize, fontSize);
    return {
      cols,
      rows,
      cellSize,
      yoMask,
      cellAlpha: new Float32Array(cols * rows),
      cellFlash: new Float32Array(cols * rows),
    };
  };

  const tickFlashes = (): void => {
    if (!grid) return;
    let dirty = false;
    for (let i = 0; i < grid.cellFlash.length; i += 1) {
      if (grid.cellFlash[i]! > 0.015) {
        grid.cellFlash[i]! *= 0.8;
        dirty = true;
      } else grid.cellFlash[i] = 0;
    }
    if (dirty) {
      const { w, h } = viewSize();
      draw(ctx, grid, w, h);
      fadeRaf = requestAnimationFrame(tickFlashes);
    } else fadeRaf = 0;
  };

  const runScan = (): void => {
    if (!grid) return;
    scanTween?.kill();
    if (fadeRaf) cancelAnimationFrame(fadeRaf);

    grid.cellAlpha.fill(0);
    grid.cellFlash.fill(0);
    scanIdx = 0;
    scanOrder = shuffle(grid.cols * grid.rows);

    const { w, h } = viewSize();
    draw(ctx, grid, w, h);

    let yoCount = 0;
    for (let i = 0; i < grid.yoMask.length; i += 1) if (grid.yoMask[i]) yoCount += 1;
    const finishYo = (): void => {
      finishDelayedCall?.kill();
      finishDelayedCall = gsap.delayedCall(site.introYo.holdAfterReveal, emitYoRevealComplete);
    };

    if (yoCount < 8) {
      for (let i = 0; i < grid.yoMask.length; i += 1) {
        if (grid.yoMask[i]) grid.cellAlpha[i] = 1;
      }
      draw(ctx, grid, w, h);
      finishYo();
      return;
    }

    if (reducedMotion) {
      for (let i = 0; i < grid.yoMask.length; i += 1) {
        if (grid.yoMask[i]) grid.cellAlpha[i] = 1;
      }
      draw(ctx, grid, w, h);
      finishYo();
      return;
    }

    const { revealDuration, scanFlash } = site.introYo;
    const prog = { n: 0 };

    scanTween = gsap.to(prog, {
      n: scanOrder.length,
      duration: revealDuration,
      ease: "none",
      onUpdate: () => {
        if (!grid) return;
        const target = Math.floor(prog.n);
        while (scanIdx < target && scanIdx < scanOrder.length) {
          const cell = scanOrder[scanIdx]!;
          scanIdx += 1;
          if (grid.yoMask[cell]) grid.cellAlpha[cell] = 1;
          else grid.cellFlash[cell] = scanFlash;
        }
        const { w: vw, h: vh } = viewSize();
        draw(ctx, grid, vw, vh);
      },
      onComplete: () => {
        if (!fadeRaf) fadeRaf = requestAnimationFrame(tickFlashes);
        finishYo();
      },
    });
  };

  const resetReveal = (): void => {
    finishDelayedCall?.kill();
    scanTween?.kill();
    if (fadeRaf) cancelAnimationFrame(fadeRaf);
    gsap.set(layer, { autoAlpha: 1 });
    void (async () => {
      grid = await buildGrid();
      runScan();
    })();
  };

  const boot = async (): Promise<void> => {
    const { w, h } = viewSize();
    await ensureFonts(fontSizeForViewport(w, h));
    grid = await buildGrid();
    runScan();
  };

  if (document.readyState === "complete") {
    await boot();
  } else {
    window.addEventListener("load", () => void boot(), { once: true });
  }

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => resetReveal(), 180);
  });

  const api: PixelYoApi = { layer, resetReveal };
  activeApi = api;
  return api;
}
