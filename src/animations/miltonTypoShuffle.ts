import gsap from "gsap";

/**
 * Milton Hero Typographic Decryption Shuffle & Interactive Specular Engine
 * 
 * Features:
 * 1. Zero-Reflow Guarantee: Each character cell is rigidly dimensioned to Bebas Neue.
 * 2. Staggered Decryption Cascade: Monospace Hex -> Playfair Serif -> Inter 900 -> Marker -> Bebas Neue Slam Lock.
 * 3. Incandescent Phosphor Bloom & Elastic Settle on Lock.
 * 4. Interactive Specular Sheen: Cursor X tracks metallic light reflection across the letters.
 * 5. Interactive Reroll: Hover / Click triggers a playful slot-machine spin with Web Audio micro-ticks.
 */

type CharMapItem = {
  finalChar: string;
  hex: string;
  serif: string;
  grotesk: string;
  cipher: string;
};

const CHAR_DATA: CharMapItem[] = [
  { finalChar: "M", hex: "0x4D", serif: "M", grotesk: "M", cipher: "//" },
  { finalChar: "I", hex: "0x49", serif: "I", grotesk: "I", cipher: "!" },
  { finalChar: "L", hex: "0x4C", serif: "L", grotesk: "L", cipher: "_" },
  { finalChar: "T", hex: "0x54", serif: "T", grotesk: "T", cipher: "+" },
  { finalChar: "O", hex: "0x4F", serif: "O", grotesk: "O", cipher: "Ø" },
  { finalChar: "N", hex: "0x4E", serif: "N", grotesk: "N", cipher: "&" },
];

let isInitialized = false;
let isShuffling = false;
let audioCtx: AudioContext | null = null;

function playMechanicalTick(freq = 1800, duration = 0.007): void {
  try {
    const AudioCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    if (!audioCtx) audioCtx = new AudioCtor();
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    if (audioCtx.state !== "running") return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, audioCtx.currentTime + duration);

    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    /* Silent ignore */
  }
}

/** Measures natural Bebas Neue glyph widths and locks each cell to prevent any layout shift */
export function lockMiltonCharWidths(): void {
  const root = document.querySelector<HTMLElement>(".js-intro-hero-milton");
  if (!root) return;

  const cells = root.querySelectorAll<HTMLElement>(".js-hero-char");
  const glyphs = root.querySelectorAll<HTMLElement>(".js-hero-glyph");

  // Reset to Bebas to measure pure canonical metrics
  glyphs.forEach((glyph, i) => {
    glyph.setAttribute("data-font", "bebas");
    glyph.textContent = CHAR_DATA[i]?.finalChar ?? "M";
    glyph.style.transform = "";
  });

  cells.forEach((cell) => {
    cell.style.width = "";
    cell.style.flexShrink = "0";
  });

  // Lock each cell's width to its exact natural computed width
  cells.forEach((cell) => {
    const w = cell.getBoundingClientRect().width;
    if (w > 0) {
      cell.style.width = `${w}px`;
    }
  });
}

/**
 * Runs the staggered decryption shuffle across M-I-L-T-O-N
 */
export function playMiltonDecryptionShuffle(reducedMotion = false): Promise<void> {
  return new Promise((resolve) => {
    const root = document.querySelector<HTMLElement>(".js-intro-hero-milton");
    if (!root) {
      resolve();
      return;
    }

    if (reducedMotion) {
      lockMiltonCharWidths();
      resolve();
      return;
    }

    isShuffling = true;
    lockMiltonCharWidths();

    const cells = Array.from(root.querySelectorAll<HTMLElement>(".js-hero-char"));
    let completedCount = 0;

    cells.forEach((cell, idx) => {
      const glyph = cell.querySelector<HTMLElement>(".js-hero-glyph");
      const data = CHAR_DATA[idx];
      if (!glyph || !data) {
        completedCount += 1;
        if (completedCount === cells.length) {
          isShuffling = false;
          resolve();
        }
        return;
      }

      const startDelay = idx * 55; // 55ms stagger per letter

      // Step 1: Terminal Cipher / Hex
      setTimeout(() => {
        glyph.setAttribute("data-font", "mono");
        glyph.textContent = data.hex;
        playMechanicalTick(1100 + idx * 80);
      }, startDelay);

      // Step 2: Editorial Serif Italic
      setTimeout(() => {
        glyph.setAttribute("data-font", "serif");
        glyph.textContent = data.serif;
        playMechanicalTick(1350 + idx * 90);
      }, startDelay + 90);

      // Step 3: Modernist Brutalist Sans
      setTimeout(() => {
        glyph.setAttribute("data-font", "sans");
        glyph.textContent = data.grotesk;
        playMechanicalTick(1550 + idx * 100);
      }, startDelay + 175);

      // Step 4: Final Monumental Bebas Slam Lock
      setTimeout(() => {
        glyph.setAttribute("data-font", "bebas");
        glyph.textContent = data.finalChar;
        glyph.classList.add("is-flashing");

        playMechanicalTick(1950 + idx * 120, 0.015);

        // Elastic slam-lock squash & settle
        gsap.fromTo(
          glyph,
          { scaleY: 1.22, scaleX: 0.86, y: -4 },
          {
            scaleY: 1,
            scaleX: 1,
            y: 0,
            duration: 0.5,
            ease: "elastic.out(1.25, 0.45)",
            onComplete: () => {
              glyph.classList.remove("is-flashing");
            },
          },
        );

        completedCount += 1;
        if (completedCount === cells.length) {
          isShuffling = false;
          resolve();
        }
      }, startDelay + 250);
    });
  });
}

/**
 * Triggers a playful slot-machine reroll on hover / click
 */
export function triggerMiltonReroll(): void {
  if (isShuffling) return;
  void playMiltonDecryptionShuffle(false);
}

/**
 * Initializes the typographic module, listeners, and specular cursor tracker
 */
export function initMiltonTypoShuffle(): void {
  if (isInitialized) return;
  isInitialized = true;

  const root = document.querySelector<HTMLElement>(".js-intro-hero-milton");
  if (!root) return;

  // Initial metric lock
  lockMiltonCharWidths();

  // Re-lock on window resize
  window.addEventListener(
    "resize",
    () => {
      lockMiltonCharWidths();
    },
    { passive: true },
  );

  // Interactive Specular Sheen tracking mouse X position
  window.addEventListener(
    "pointermove",
    (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      if (rect.width > 0) {
        const xPct = Math.max(-20, Math.min(120, ((e.clientX - rect.left) / rect.width) * 100));
        root.style.setProperty("--sheen-x", `${xPct.toFixed(1)}%`);
      }
    },
    { passive: true },
  );

  // Interactive Click / Tap reroller
  root.addEventListener("click", () => {
    triggerMiltonReroll();
  });
}
