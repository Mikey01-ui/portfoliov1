import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "../content/projects";
import { site } from "../content/site";
import { getLenis } from "./smoothScroll";
import { centerProjectList, setActiveProject } from "./utils";
import {
  applyCardSlot,
  slotForCard,
  tweenCardToSlot,
} from "./workLayout";

let workGalleryTrigger: ScrollTrigger | null = null;

/** Scroll the page so the gallery lands on a given project index. */
export function scrollToGalleryProject(index: number): void {
  const st = workGalleryTrigger;
  if (!st || projects.length === 0) return;

  const clamped = Math.max(0, Math.min(index, projects.length - 1));
  const progress = projects.length <= 1 ? 0 : clamped / (projects.length - 1);
  const y = st.start + progress * (st.end - st.start);

  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(y, { duration: 1.35, force: true });
  } else {
    window.scrollTo({ top: y, behavior: "smooth" });
  }
}

/** Keep gallery pin/timeline idle until intro scroll finishes (avoids one wheel driving both). */
export function setWorkGalleryActive(active: boolean): void {
  if (!workGalleryTrigger) return;
  if (active) {
    workGalleryTrigger.enable(false, true);
    ScrollTrigger.refresh();
  } else {
    workGalleryTrigger.disable(false, true);
  }
}

/** Gallery scrollytelling. Intro → work handoff is driven in intro.ts. */
export function initWork(reducedMotion: boolean): ScrollTrigger | null {
  const work = document.querySelector<HTMLElement>(".js-work");
  const pin = document.querySelector<HTMLElement>(".js-work-pin");
  const list = document.querySelector<HTMLElement>(".js-project-list");
  const thumb = document.querySelector<HTMLElement>(".js-scroll-thumb");
  const meta = document.querySelector<HTMLElement>(".js-work-meta");

  if (!work || !pin || !list) return null;

  const cards = gsap.utils.toArray<HTMLElement>(".js-card");
  if (cards.length === 0) return null;

  cards.forEach((card, i) => {
    applyCardSlot(card, slotForCard(i, 0), true);
  });

  setActiveProject(0);
  gsap.set(list, { y: centerProjectList(0) });
  gsap.set(pin, { y: 0 });

  if (reducedMotion) {
    setActiveProject(0);
    return null;
  }

  const segment = 1;
  const tl = gsap.timeline({
    scrollTrigger: {
      id: "work-gallery",
      trigger: work,
      start: "top top",
      end: () =>
        `+=${Math.max(projects.length * window.innerHeight * 0.55, window.innerHeight * 4)}`,
      pin: true,
      scrub: 0.55,
      anticipatePin: 1,
      markers: site.DEBUG,
      invalidateOnRefresh: true,
      snap:
        projects.length > 1
          ? {
              snapTo: 1 / (projects.length - 1),
              duration: { min: 0.2, max: 0.45 },
              delay: 0.02,
              ease: "power2.inOut",
            }
          : undefined,
      onUpdate: (self) => {
        const idx = Math.round(self.progress * (projects.length - 1));
        setActiveProject(idx);
        if (thumb) gsap.set(thumb, { y: self.progress * 140 });
      },
    },
  });

  for (let step = 1; step < projects.length; step++) {
    const label = `step-${step}`;
    const pos = (step - 1) * segment;
    tl.addLabel(label, pos);

    const listY = centerProjectList(step);

    cards.forEach((card, cardIndex) => {
      const fromSlot = slotForCard(cardIndex, step - 1);
      const toSlot = slotForCard(cardIndex, step);
      if (fromSlot === toSlot) return;
      tweenCardToSlot(card, toSlot, segment, label, tl);
    });

    tl.to(list, { y: listY, duration: segment, ease: "power3.inOut" }, label);

    tl.to(
      ".js-section-index",
      {
        y: -16 * step,
        scale: 1 + step * 0.02,
        duration: segment,
        ease: "power2.out",
      },
      label,
    );

    if (meta) {
      tl.fromTo(
        meta,
        { opacity: 0.65, y: 8 },
        { opacity: 1, y: 0, duration: segment * 0.6, ease: "power2.out" },
        label,
      );
    }
  }

  workGalleryTrigger = tl.scrollTrigger ?? null;
  setWorkGalleryActive(false);

  return workGalleryTrigger;
}
