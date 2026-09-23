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

  const slideDistance = () => window.innerWidth + 60;
  const blankHold = site.introHeroScrollHold;
  const curtainDuration = 4.4;
  const holdAfterTitle = 8.0;
  const galleryRiseDuration = 5.0;

  const curtainAt = blankHold;
  const titleHoldAt = curtainAt + curtainDuration;
  const galleryRiseAt = titleHoldAt + holdAfterTitle;

  gsap.set(mask, { x: 0, autoAlpha: 1 });
  gsap.set(sheet, { autoAlpha: 0 });
  gsap.set(stage, { autoAlpha: 1 });
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
      scrub: true,
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

  tl.fromTo(sheet, { autoAlpha: 0 }, { autoAlpha: 0, duration: blankHold, ease: "none" }, 0)
    .to(sheet, { autoAlpha: 1, duration: 0.001, ease: "none" }, curtainAt)
    .to(
      mask,
      {
        x: () => slideDistance(),
        ease: "power1.inOut",
        duration: curtainDuration,
      },
      curtainAt,
    )
    .to({}, { duration: holdAfterTitle }, titleHoldAt)
    // As the gallery rises from below over the stage, title has subtle upward parallax drift:
    .to(
      title,
      {
        y: -110,
        opacity: 0.15,
        scale: 0.93,
        duration: galleryRiseDuration,
        ease: "none",
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
