import gsap from "gsap";
import { initIntroHeroBg, setIntroHeroBgActive } from "./introHeroBg";

let enterTween: gsap.core.Timeline | null = null;

export function initIntroHero(reducedMotion: boolean): void {
  initIntroHeroBg(reducedMotion);
  if (!reducedMotion) setIntroHeroBgActive(true);
  const root = document.querySelector<HTMLElement>(".js-intro-hero");
  const im = document.querySelector<HTMLElement>(".js-intro-hero-im");
  const milton = document.querySelector<HTMLElement>(".js-intro-hero-milton");
  const tagline = document.querySelector<HTMLElement>(".js-intro-hero-tagline");
  const portrait = document.querySelector<HTMLElement>(".js-intro-hero-portrait");
  const cue = document.querySelector<HTMLElement>(".js-intro-hero-cue");

  if (!root || !im || !milton || !tagline || !portrait || !cue) return;

  gsap.set([im, milton, tagline, portrait, cue], { autoAlpha: 0 });

  if (reducedMotion) {
    gsap.set([im, milton, tagline, portrait, cue], { autoAlpha: 1, clearProps: "transform" });
    root.classList.add("is-active");
  }
}

const FONT_CYCLE = [
  { family: '"Space Mono", monospace', letterSpacing: "0.06em" },
  { family: '"Cinzel", serif', letterSpacing: "0.02em" },
  { family: '"Playfair Display", Georgia, serif', letterSpacing: "0.01em" },
  { family: '"Permanent Marker", cursive', letterSpacing: "0.02em" },
  { family: '"Syne", sans-serif', letterSpacing: "-0.01em" },
  { family: 'var(--font-hero-display, "Bebas Neue", sans-serif)', letterSpacing: "0.005em" },
];

export function enterIntroHero(reducedMotion: boolean): void {
  const root = document.querySelector<HTMLElement>(".js-intro-hero");
  const im = document.querySelector<HTMLElement>(".js-intro-hero-im");
  const milton = document.querySelector<HTMLElement>(".js-intro-hero-milton");
  const tagline = document.querySelector<HTMLElement>(".js-intro-hero-tagline");
  const portrait = document.querySelector<HTMLElement>(".js-intro-hero-portrait");
  const cue = document.querySelector<HTMLElement>(".js-intro-hero-cue");
  const pixel = document.querySelector<HTMLElement>(".js-intro-pixel-yo");

  if (!root || !im || !milton || !tagline || !portrait || !cue) return;

  enterTween?.kill();
  root.classList.add("is-active");
  setIntroHeroBgActive(true);

  if (reducedMotion) {
    gsap.set(pixel, { autoAlpha: 0 });
    milton.style.fontFamily = "";
    milton.style.letterSpacing = "";
    milton.style.width = "";
    gsap.set([im, milton, tagline, portrait, cue], { autoAlpha: 1, clearProps: "transform" });
    return;
  }

  // Measure natural Bebas Neue width so layout remains rock-solid while fonts cycle
  const naturalWidth = milton.getBoundingClientRect().width;
  if (naturalWidth > 0) {
    milton.style.width = `${Math.ceil(naturalWidth)}px`;
  }

  gsap.set(im, { autoAlpha: 0, y: 36 });
  gsap.set(milton, {
    autoAlpha: 0,
    scaleY: 0.15,
    y: 0,
    transformOrigin: "50% 100%",
  });
  gsap.set(tagline, { autoAlpha: 0, scale: 0.5, rotation: -16, y: 15, transformOrigin: "100% 100%" });
  gsap.set(portrait, { autoAlpha: 0, y: 32, scale: 0.92, transformOrigin: "50% 100%" });
  gsap.set(cue, { autoAlpha: 0, y: 16 });

  enterTween = gsap.timeline({
    defaults: { ease: "power3.out" },
    onStart: () => {
      gsap.to(pixel, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" });
    },
  });

  // 1. "IM" lands first
  enterTween.to(im, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.1);

  // 2. "MILTON" starts from compressed height at baseline and expands upward
  enterTween.set(milton, { autoAlpha: 1 }, 0.2);

  // Smoothly stretch height from 0.15 up to 1.05 and snap settle to 1.0
  enterTween.to(milton, {
    scaleY: 1.04,
    duration: 0.68,
    ease: "power2.out",
    transformOrigin: "50% 100%",
  }, 0.2);

  enterTween.to(milton, {
    scaleY: 1.0,
    duration: 0.14,
    ease: "power1.inOut",
  }, 0.88);

  // Step through contrasting fonts as height rises
  const stepTime = 0.66 / (FONT_CYCLE.length - 1);
  FONT_CYCLE.forEach((font, idx) => {
    const at = 0.2 + idx * stepTime;
    enterTween?.call(() => {
      milton.style.fontFamily = font.family;
      milton.style.letterSpacing = font.letterSpacing;
    }, [], at);
  });

  // 3. Once MILTON stops and locks at full height (~0.92s), animate portrait & tagline
  enterTween.to(portrait, {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    duration: 0.65,
    ease: "back.out(1.2)",
  }, 0.92);

  enterTween.to(tagline, {
    autoAlpha: 1,
    scale: 1,
    rotation: -5,
    y: 0,
    duration: 0.6,
    ease: "back.out(2.2)",
    onComplete: () => {
      // Clean up explicit width after intro completes for perfect responsiveness
      milton.style.width = "";
    },
  }, 1.02);

  // 4. Scroll cue fades in
  enterTween.to(cue, { autoAlpha: 1, y: 0, duration: 0.55 }, 1.25);
}

export function resetIntroHero(): void {
  const root = document.querySelector<HTMLElement>(".js-intro-hero");
  if (!root) return;

  enterTween?.kill();
  setIntroHeroBgActive(true);
  root.classList.remove("is-active");
  const milton = root.querySelector<HTMLElement>(".js-intro-hero-milton");
  if (milton) {
    milton.style.fontFamily = "";
    milton.style.letterSpacing = "";
    milton.style.width = "";
  }
  gsap.set(
    root.querySelectorAll(
      ".js-intro-hero-im, .js-intro-hero-milton, .js-intro-hero-tagline, .js-intro-hero-portrait, .js-intro-hero-cue",
    ),
    { autoAlpha: 0, clearProps: "transform" },
  );
}

export function getIntroHeroElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".js-intro-hero");
}
