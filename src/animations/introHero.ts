import gsap from "gsap";
import { initIntroHeroBg, setIntroHeroBgActive } from "./introHeroBg";

let enterTween: gsap.core.Timeline | null = null;
let sheenTween: gsap.core.Tween | null = null;
let sheenTrackerInitialized = false;

function initMiltonSheenTracker(): void {
  if (sheenTrackerInitialized) return;
  sheenTrackerInitialized = true;

  const handlePointerMove = (e: PointerEvent): void => {
    const milton = document.querySelector<HTMLElement>(".js-intro-hero-milton");
    if (!milton) return;
    const rect = milton.getBoundingClientRect();
    if (rect.width <= 0) return;

    // Relinquish intro tween if user moves mouse so tracking takes immediate effect
    if (sheenTween) {
      sheenTween.kill();
      sheenTween = null;
    }

    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedPct = Math.max(-30, Math.min(130, xPct));
    milton.style.setProperty("--sheen-x", `${clampedPct.toFixed(1)}%`);
  };

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
}

export function initIntroHero(reducedMotion: boolean): void {
  initIntroHeroBg(reducedMotion);
  initMiltonSheenTracker();
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
  sheenTween?.kill();
  sheenTween = null;

  root.classList.add("is-active");
  setIntroHeroBgActive(true);

  if (reducedMotion) {
    gsap.set(pixel, { autoAlpha: 0 });
    gsap.set([im, milton, tagline, portrait, cue], { autoAlpha: 1, clearProps: "transform" });
    return;
  }

  gsap.set(im, { autoAlpha: 0, y: 40 });
  gsap.set(milton, { autoAlpha: 0, y: 48 });
  gsap.set(tagline, { autoAlpha: 0, y: -16, rotation: -9, transformOrigin: "100% 100%" });
  gsap.set(portrait, { autoAlpha: 0, y: 32, scale: 0.94, transformOrigin: "50% 100%" });
  gsap.set(cue, { autoAlpha: 0, y: 16 });

  // Specular light sweep intro across MILTON text
  sheenTween = gsap.fromTo(
    milton,
    { "--sheen-x": "-35%" },
    {
      "--sheen-x": "135%",
      duration: 1.25,
      ease: "power2.inOut",
      delay: 0.35,
      onComplete: () => {
        sheenTween = null;
      },
    },
  );

  enterTween = gsap.timeline({
    defaults: { ease: "power3.out" },
    onStart: () => {
      gsap.to(pixel, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut" });
    },
  });

  enterTween
    .to(im, { autoAlpha: 1, y: 0, duration: 0.75 }, 0.12)
    .to(milton, { autoAlpha: 1, y: 0, duration: 0.75 }, 0.22)
    .to(tagline, { autoAlpha: 1, y: 0, rotation: -5, duration: 0.65, transformOrigin: "100% 100%" }, 0.26)
    .to(portrait, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7 }, 0.3)
    .to(cue, { autoAlpha: 1, y: 0, duration: 0.55 }, 0.46);
}

export function resetIntroHero(): void {
  const root = document.querySelector<HTMLElement>(".js-intro-hero");
  if (!root) return;

  enterTween?.kill();
  sheenTween?.kill();
  sheenTween = null;

  setIntroHeroBgActive(true);
  root.classList.remove("is-active");

  const milton = document.querySelector<HTMLElement>(".js-intro-hero-milton");
  if (milton) {
    milton.style.setProperty("--sheen-x", "-50%");
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
