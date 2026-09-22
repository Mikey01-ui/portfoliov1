import gsap from "gsap";

export type CardSlot = "center" | "topRight" | "bottomLeft" | "hidden";

const slotProps: Record<
  CardSlot,
  gsap.TweenVars & { width: number; height: number }
> = {
  center: {
    left: "50%",
    top: "50%",
    xPercent: -50,
    yPercent: -50,
    width: 440,
    height: 290,
    rotation: -5,
    zIndex: 40,
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
  },
  topRight: {
    left: "57%",
    top: "11%",
    xPercent: -50,
    yPercent: 0,
    width: 300,
    height: 200,
    rotation: 16,
    zIndex: 30,
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
  },
  bottomLeft: {
    left: "13%",
    top: "66%",
    xPercent: 0,
    yPercent: 0,
    width: 360,
    height: 230,
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
    width: 320,
    height: 210,
    rotation: 0,
    zIndex: 5,
    opacity: 0,
    filter: "blur(6px)",
    scale: 0.85,
  },
};

export function slotForCard(cardIndex: number, activeIndex: number): CardSlot {
  if (cardIndex === activeIndex) return "center";
  if (cardIndex === activeIndex - 1) return "topRight";
  if (cardIndex === activeIndex + 1) return "bottomLeft";
  return "hidden";
}

export function applyCardSlot(el: HTMLElement, slot: CardSlot, immediate = false): void {
  const props = { ...slotProps[slot] };
  const { width, height, ...rest } = props;
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
  const props = { ...slotProps[slot] };
  const { width, height, ...rest } = props;
  tl.to(
    el,
    {
      ...rest,
      duration,
      ease: "power3.inOut",
    },
    position,
  );
  tl.to(
    el,
    {
      width,
      height,
      duration,
      ease: "power3.inOut",
    },
    position,
  );
}
