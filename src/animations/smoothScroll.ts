import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

let lenis: Lenis | null = null;

export function setIntroScrollEnd(_endPx: number): void {}

export function clearIntroScrollEnd(): void {}

export function initSmoothScroll(): Lenis | null {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.5,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function stopSmoothScroll(): void {
  lenis?.stop();
}

export function startSmoothScroll(): void {
  lenis?.start();
}

export function destroySmoothScroll(): void {
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
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
