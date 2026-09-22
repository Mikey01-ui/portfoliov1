import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { site } from "../content/site";
import { clearIntroScrollEnd, setIntroScrollEnd } from "./smoothScroll";
import {
  enterIntroHero,
  getIntroHeroElement,
  initIntroHero,
  resetIntroHero,
} from "./introHero";
import {
  getIntroPixelYoLayer,
  initIntroPixelYo,
  isIntroYoRevealComplete,
  onIntroYoRevealComplete,
  resetIntroPixelYo,
} from "./introPixelYo";
import { scrollToYImmediate } from "./smoothScroll";
import { reloadProjectCardImages } from "./projectMedia";
import { setWorkGalleryActive } from "./work";

function lockWork(work: HTMLElement | null, locked: boolean): void {
  work?.classList.toggle("is-locked", locked);
  if (!locked) reloadProjectCardImages();
}

/** YO (time) → hero on mask (time) → same push curtain reveals SEE WHAT I DO. */
export function initIntro(reducedMotion: boolean): ScrollTrigger | null {
  const stage = document.querySelector<HTMLElement>(".js-intro-stage");
  const mask = document.querySelector<HTMLElement>(".js-intro-mask");
  const sheet = document.querySelector<HTMLElement>(".js-intro-sheet");
  const intro = document.querySelector<HTMLElement>(".js-intro");
  const title = document.querySelector<HTMLElement>(".js-intro-title");
  const header = document.querySelector<HTMLElement>(".js-site-header");
  const work = document.querySelector<HTMLElement>(".js-work");
  const hero = getIntroHeroElement();

  if (!stage || !mask || !intro || !sheet || !title) return null;

  const pixelYo = getIntroPixelYoLayer();

  const edge = site.introCurtainStart;
  const slideDistance = () => window.innerWidth * (1 - edge);
  const blankHold = site.introHeroScrollHold;
  const curtainDuration = 8;
  const holdAfterTitle = 2.5;
  const fadeDuration = 1.2;

  gsap.set(mask, { left: 0, right: 0, x: 0, autoAlpha: 1 });
  gsap.set(sheet, { autoAlpha: 0 });
  gsap.set(stage, { autoAlpha: 1 });
  gsap.set(pixelYo, { autoAlpha: 1 });
  if (work) gsap.set(work, { autoAlpha: 0 });

  lockWork(work, true);
  initIntroHero(reducedMotion);

  void initIntroPixelYo(reducedMotion);
  onIntroYoRevealComplete(() => {
    enterIntroHero(reducedMotion);
  });

  if (reducedMotion) {
    gsap.set(mask, { left: `${edge * 100}%`, x: slideDistance() });
    gsap.set(sheet, { autoAlpha: 1 });
    enterIntroHero(true);
    lockWork(work, false);
    gsap.set(work, { autoAlpha: 1 });
    header?.classList.add("is-visible");
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
      end: `+=${site.introScrollLength}vh`,
      pin: stage,
      pinSpacing: true,
      scrub: 1,
      markers: site.DEBUG,
      anticipatePin: 1,
      onEnter: () => {
        stage.classList.add("is-pinned");
        setWorkGalleryActive(false);
      },
      onUpdate(self) {
        if (introHandoffComplete) return;
        if (!isIntroYoRevealComplete() && self.progress > 0.0005) {
          self.scroll(self.start);
          scrollToYImmediate(self.start);
        }
      },
      onEnterBack(self) {
        stage.classList.add("is-pinned");
        if (introHandoffComplete) return;
        if (self.progress > 0.04) return;
        lockWork(work, true);
        setWorkGalleryActive(false);
        gsap.set(stage, { autoAlpha: 1 });
        gsap.set(work, { autoAlpha: 0 });
        gsap.set(mask, { left: 0, right: 0, x: 0, autoAlpha: 1 });
        gsap.set(sheet, { autoAlpha: 0 });
        header?.classList.remove("is-visible");
        resetIntroHero();
        resetIntroPixelYo();
      },
      onLeave: () => {
        finishIntroHandoff();
        stage.classList.remove("is-pinned");
        gsap.set(stage, { clearProps: "transform,opacity,autoAlpha,backgroundColor" });
        gsap.set(sheet, { clearProps: "autoAlpha,transform" });
        gsap.set(mask, { clearProps: "all" });
        gsap.set(title, { clearProps: "opacity,transform,scale" });
        gsap.set(hero, { clearProps: "autoAlpha,transform,visibility" });
        lockWork(work, false);
        gsap.set(work, { autoAlpha: 1 });
        header?.classList.add("is-visible");
        setWorkGalleryActive(true);
        ScrollTrigger.refresh(true);
      },
      onLeaveBack: () => {
        stage.classList.add("is-pinned");
        lockWork(work, true);
        setWorkGalleryActive(false);
      },
    },
  });

  const curtainAt = blankHold;
  const fadeAt = blankHold + curtainDuration + holdAfterTitle;

  tl.fromTo(sheet, { autoAlpha: 0 }, { autoAlpha: 0, duration: blankHold, ease: "none" }, 0)
    .to(sheet, { autoAlpha: 1, duration: 0.001, ease: "none" }, curtainAt)
    .to(pixelYo, { autoAlpha: 0, duration: 0.001, ease: "none" }, curtainAt)
    .to(
      mask,
      {
        left: `${edge * 100}%`,
        x: () => slideDistance(),
        ease: "none",
        duration: curtainDuration,
      },
      curtainAt,
    )
    .to({}, { duration: holdAfterTitle }, curtainAt + curtainDuration)
    .add(() => {
      finishIntroHandoff();
      lockWork(work, false);
    }, fadeAt)
    .to(
      title,
      { scale: 0.92, opacity: 0, y: -48, duration: fadeDuration, ease: "power2.in" },
      fadeAt,
    )
    .to(stage, { autoAlpha: 0, duration: fadeDuration, ease: "power2.inOut" }, fadeAt)
    .to(work, { autoAlpha: 1, duration: fadeDuration, ease: "power2.inOut" }, fadeAt)
    .add(() => header?.classList.add("is-visible"), fadeAt + fadeDuration * 0.5);

  ScrollTrigger.create({
    trigger: work ?? intro,
    start: "top 90%",
    onEnter: () => header?.classList.add("is-visible"),
    onLeaveBack: () => {
      if (intro.getBoundingClientRect().bottom > window.innerHeight * 0.1) {
        header?.classList.remove("is-visible");
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
