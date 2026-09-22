import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initAbout } from "./animations/about";
import { initGalleryNavigation } from "./animations/galleryNav";
import { initIntro } from "./animations/intro";
import { bindProjectImageFallbacks } from "./animations/projectMedia";
import { initSmoothScroll } from "./animations/smoothScroll";
import { initWork } from "./animations/work";
import { preloadProjectImages } from "./content/projects";
import { debounceRefresh, refreshScroll, waitForImages } from "./animations/utils";
import { site } from "./content/site";
import { renderApp } from "./render";
import "./styles/base.css";
import "./styles/intro.css";
import "./styles/intro-hero.css";
import "./styles/work.css";
import "./styles/about.css";

gsap.registerPlugin(ScrollTrigger);

document.documentElement.style.setProperty("--color-red", site.colors.red);
document.documentElement.style.setProperty("--color-bio", site.colors.bioAccent);
document.documentElement.style.setProperty("--color-work-bg", site.colors.workBg);

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
  app.innerHTML = renderApp();
  bindProjectImageFallbacks();
  preloadProjectImages();
}

if (initSmoothScroll()) {
  document.documentElement.classList.add("lenis");
}

const mm = gsap.matchMedia();

function boot(reducedMotion: boolean): void {
  initWork(reducedMotion);
  initIntro(reducedMotion);
  initAbout(reducedMotion);
  if (!reducedMotion) initGalleryNavigation();
  waitForImages(app ?? document).then(() => refreshScroll());
  window.addEventListener("load", () => refreshScroll());
  if (!reducedMotion) {
    window.addEventListener("resize", debounceRefresh());
  }
}

mm.add("(prefers-reduced-motion: reduce)", () => {
  boot(true);
});

mm.add("(prefers-reduced-motion: no-preference)", () => {
  boot(false);
});
