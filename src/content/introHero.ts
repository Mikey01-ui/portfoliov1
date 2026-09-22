import { site } from "./site";

export const introHero = {
  lineIm: "IM",
  lineName: site.brand.toUpperCase(),
  tagline: "I MAKE COOL STUFFS",
  scrollCue: "KEEP DIGGING",
  portraitSrc: "/assets/hero-portrait.png",
  portraitAlt: `${site.brand} portrait`,
} as const;
