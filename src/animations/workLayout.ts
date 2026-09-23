import gsap from "gsap";

export type CardSlot = "center" | "topRight" | "bottomLeft" | "hidden";

export function getSlotProps(): Record<
  CardSlot,
  gsap.TweenVars & { width: number; height: number }
> {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const isMobile = vw <= 640;
  const isTablet = vw > 640 && vw <= 1024;

  const baseW = isMobile ? Math.min(vw * 0.84, 340) : isTablet ? Math.min(vw * 0.44, 400) : 440;
  const baseH = Math.round(baseW * (290 / 440));

  const trW = Math.round(baseW * (300 / 440));
  const trH = Math.round(baseH * (200 / 290));

  const blW = Math.round(baseW * (360 / 440));
  const blH = Math.round(baseH * (230 / 290));

  return {
    center: {
      left: "50%",
      top: "50%",
      xPercent: -50,
      yPercent: -50,
      width: baseW,
      height: baseH,
      rotation: -5,
      zIndex: 40,
      opacity: 1,
      filter: "blur(0px)",
      scale: 1,
    },
    topRight: {
      left: isTablet ? "50%" : isMobile ? "50%" : "57%",
      top: isMobile ? "8%" : "11%",
      xPercent: -50,
      yPercent: 0,
      width: trW,
      height: trH,
      rotation: 16,
      zIndex: 30,
      opacity: isMobile ? 0.4 : 1,
      filter: "blur(0px)",
      scale: 1,
    },
    bottomLeft: {
      left: isMobile ? "6%" : "13%",
      top: isMobile ? "68%" : "66%",
      xPercent: 0,
      yPercent: 0,
      width: blW,
      height: blH,
      rotation: -16,
      zIndex: 25,
      opacity: 0.95,
      filter: "blur(0px)",
      scale: 1,
    },
    hidden: {
      left: "50%",
      top: "115%",
      xPercent: -50,
      yPercent: 0,
      width: trW,
      height: trH,
      rotation: 0,
      zIndex: 5,
      opacity: 0,
      filter: "blur(6px)",
      scale: 0.85,
    },
  };
}

export function slotForCard(cardIndex: number, activeIndex: number): CardSlot {
  if (cardIndex === activeIndex) return "center";
  if (cardIndex === activeIndex - 1) return "topRight";
  if (cardIndex === activeIndex + 1) return "bottomLeft";
  return "hidden";
}

export function applyCardSlot(el: HTMLElement, slot: CardSlot, immediate = false): void {
  const slots = getSlotProps();
  const { width, height, ...rest } = slots[slot];
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;
  if (immediate) {
    gsap.set(el, rest);
  } else {
    gsap.to(el, { ...rest, duration: 0.01 });
  }
}

export function tweenCardToSlot(
  el: HTMLElement,
  slot: CardSlot,
  duration: number,
  position: string | number,
  tl: gsap.core.Timeline,
): void {
  const slots = getSlotProps();
  const { width, height, ...rest } = slots[slot];
  tl.to(
    el,
    {
      ...rest,
      width,
      height,
      duration,
      ease: "power3.inOut",
    },
    position,
  );
}
