import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { site } from "../content/site";

let lenis: Lenis | null = null;
let introScrollEnd = 0;

export function setIntroScrollEnd(endPx: number): void {
  introScrollEnd = endPx;
}

export function clearIntroScrollEnd(): void {
  introScrollEnd = 0;
}

export function initSmoothScroll(): Lenis | null {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

  lenis = new Lenis({
    duration: 1.45,
    smoothWheel: true,
    wheelMultiplier: 0.55,
    virtualScroll: (data) => {
      if (introScrollEnd <= 0) return true;
      const y = lenis?.scroll ?? 0;
      if (y < introScrollEnd) {
        data.deltaY *= site.introWheelDampen;
      }
      return true;
    },
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function getLenis(): Lenis | null {
  return lenis;
}

export function scrollToYImmediate(y: number): void {
  if (lenis) {
    lenis.scrollTo(y, { immediate: true });
  } else {
    window.scrollTo({ top: y, behavior: "auto" });
  }
}
