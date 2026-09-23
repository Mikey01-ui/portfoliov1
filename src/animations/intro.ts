import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "../content/site";
import {
  clearIntroScrollEnd,
  setIntroScrollEnd,
  startSmoothScroll,
  stopSmoothScroll,
} from "./smoothScroll";
import {
  enterIntroHero,
  initIntroHero,
  resetIntroHero,
} from "./introHero";
import { setIntroHeroBgActive } from "./introHeroBg";
import {
  initIntroPixelYo,
  isIntroYoRevealComplete,
  onIntroYoRevealComplete,
  resetIntroPixelYo,
} from "./introPixelYo";
import { reloadProjectCardImages } from "./projectMedia";
import { setWorkGalleryActive } from "./work";

/** YO (time) → hero on mask (time) → push curtain reveals SEE WHAT I DO → gallery rises from below to the top. */
export function initIntro(reducedMotion: boolean): ScrollTrigger | null {
  const stage = document.querySelector<HTMLElement>(".js-intro-stage");
  const mask = document.querySelector<HTMLElement>(".js-intro-mask");
  const sheet = document.querySelector<HTMLElement>(".js-intro-sheet");
  const intro = document.querySelector<HTMLElement>(".js-intro");
  const title = document.querySelector<HTMLElement>(".js-intro-title");
  const header = document.querySelector<HTMLElement>(".js-site-header");
  const work = document.querySelector<HTMLElement>(".js-work");

  if (!stage || !mask || !intro || !sheet || !title) return null;

  const showHeader = (): void => {
    if (!header) return;
    header.classList.add("is-visible");
    header.removeAttribute("aria-hidden");
  };

  const hideHeader = (): void => {
    if (!header) return;
    header.classList.remove("is-visible");
    header.setAttribute("aria-hidden", "true");
  };

  const cue = document.querySelector<HTMLElement>(".js-intro-hero-cue");
  const heroInner = document.querySelector<HTMLElement>(".intro-hero__inner");

  const slideDistance = () => window.innerWidth + 60;
  const blankHold = site.introHeroScrollHold;
  const curtainDuration = 6.2;
  const holdAfterTitle = 4.8;
  const galleryRiseDuration = 5.6;

  const curtainAt = blankHold;
  const titleHoldAt = curtainAt + curtainDuration;
  const galleryRiseAt = titleHoldAt + holdAfterTitle;

  gsap.set(mask, { x: 0, autoAlpha: 1 });
  gsap.set(sheet, { autoAlpha: 0 });
  gsap.set(stage, { autoAlpha: 1 });
  if (heroInner) gsap.set(heroInner, { x: 0, opacity: 1 });
  if (work) {
    gsap.set(work, { autoAlpha: 1 });
    work.classList.remove("is-locked");
  }

  initIntroHero(reducedMotion);

  if (!isIntroYoRevealComplete() && !reducedMotion) {
    stopSmoothScroll();
  }

  void initIntroPixelYo(reducedMotion);
  onIntroYoRevealComplete(() => {
    enterIntroHero(reducedMotion);
    startSmoothScroll();
    reloadProjectCardImages();
  });

  if (reducedMotion) {
    gsap.set(mask, { x: slideDistance() });
    gsap.set(sheet, { autoAlpha: 1 });
    enterIntroHero(true);
    if (work) gsap.set(work, { autoAlpha: 1 });
    showHeader();
    ScrollTrigger.refresh(true);
    return null;
  }

  let introHandoffComplete = false;

  const finishIntroHandoff = (): void => {
    if (introHandoffComplete) return;
    introHandoffComplete = true;
    clearIntroScrollEnd();
  };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: intro,
      start: "top top",
      end: "bottom top",
      pin: stage,
      pinSpacing: false,
      scrub: 1.2,
      markers: site.DEBUG,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onEnter: () => {
        stage.classList.add("is-pinned");
        setIntroHeroBgActive(true);
        setWorkGalleryActive(true);
      },
      onUpdate(self) {
        if (self.progress < 0.02 && introHandoffComplete) {
          introHandoffComplete = false;
        }
      },
      onEnterBack(self) {
        stage.classList.add("is-pinned");
        setIntroHeroBgActive(true);
        if (self.progress > 0.05) return;
        introHandoffComplete = false;
        gsap.set(stage, { autoAlpha: 1 });
        gsap.set(mask, { x: 0, autoAlpha: 1 });
        gsap.set(sheet, { autoAlpha: 0 });
        if (heroInner) gsap.set(heroInner, { x: 0, opacity: 1, clearProps: "transform,opacity" });
        if (cue) gsap.set(cue, { autoAlpha: 1, y: 0, clearProps: "transform,opacity" });
        hideHeader();
        resetIntroHero();
        resetIntroPixelYo();
      },
      onLeave: () => {
        finishIntroHandoff();
        setIntroHeroBgActive(false);
        stage.classList.remove("is-pinned");
        showHeader();
      },
      onLeaveBack: () => {
        stage.classList.add("is-pinned");
        introHandoffComplete = false;
        setIntroHeroBgActive(true);
      },
    },
  });

  tl.fromTo(sheet, { autoAlpha: 0 }, { autoAlpha: 0, duration: blankHold, ease: "none" }, 0);

  // Fade out the scroll cue during the initial hold so it smoothly departs as you scroll
  if (cue) {
    tl.to(cue, { autoAlpha: 0, y: 14, duration: blankHold * 0.75, ease: "power2.out" }, 0);
  }

  tl.to(sheet, { autoAlpha: 1, duration: 0.001, ease: "none" }, curtainAt)
    .to(
      mask,
      {
        x: () => slideDistance(),
        ease: "power2.inOut",
        duration: curtainDuration,
      },
      curtainAt,
    );

  // Subtle cinematic counter-parallax on the hero contents as the curtain peels away:
  if (heroInner) {
    tl.to(
      heroInner,
      {
        x: -120,
        opacity: 0.8,
        ease: "power1.inOut",
        duration: curtainDuration,
      },
      curtainAt,
    );
  }

  // Smooth editorial reveal on "SEE WHAT I DO" title
  tl.fromTo(
    title,
    { scale: 1.04, opacity: 0.85 },
    { scale: 1, opacity: 1, duration: curtainDuration * 0.75, ease: "power2.out" },
    curtainAt + curtainDuration * 0.25,
  );

  tl.to({}, { duration: holdAfterTitle }, titleHoldAt)
    // As the gallery rises from below over the stage, title has subtle upward parallax drift and fade:
    .to(
      title,
      {
        y: -130,
        opacity: 0,
        scale: 0.92,
        duration: galleryRiseDuration,
        ease: "power2.in",
      },
      galleryRiseAt,
    )
    .add(() => {
      finishIntroHandoff();
      showHeader();
    }, galleryRiseAt + galleryRiseDuration * 0.4);

  ScrollTrigger.create({
    trigger: work ?? intro,
    start: "top 90%",
    onEnter: () => showHeader(),
    onLeaveBack: () => {
      if (intro.getBoundingClientRect().bottom > window.innerHeight * 0.1) {
        hideHeader();
      }
    },
  });

  const syncIntroScrollEnd = (): void => {
    const st = tl.scrollTrigger;
    if (st) setIntroScrollEnd(st.end);
  };

  ScrollTrigger.addEventListener("refresh", syncIntroScrollEnd);
  syncIntroScrollEnd();

  return tl.scrollTrigger ?? null;
}
