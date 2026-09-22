export const site = {
  DEBUG: false,
  brand: "Milton",
  displayName: {
    line1: "SEE",
    line2: "WHAT I DO",
  },
  colors: {
    red: "#ee2c38",
    bioAccent: "#e84a5f",
    workBg: "#e8e8e8",
    text: "#111111",
    muted: "#888888",
  },
  serifFont: "Playfair Display",
  sansFont: "Inter",
  portraitSrc: "/assets/about-head.png",
  introCurtainStart: 0.07,
  /** Scroll-scrub pause on hero before the push reveal (same slot as old black hold). */
  introHeroScrollHold: 2.5,
  introYo: {
    text: "YO",
    /** Dot pitch across the full viewport (smaller = denser, like the reference). */
    cellSize: 7,
    /** Dot size relative to cell (gap between dots). */
    dotScale: 0.5,
    color: "#ffffff",
    /** Full-page pixel scan before YO resolves. */
    revealDuration: 2.2,
    /** Brief brightness when the scan hits non-letter cells. */
    scanFlash: 0.55,
    /** Idle grid brightness between scan flashes (0 = only YO stays lit). */
    pageGridDim: 0,
    minWidthRatio: 0.5,
    minPx: 200,
    maxPx: 420,
    /** Pause on resolved YO before hero transition. */
    holdAfterReveal: 0.85,
  },
  /** Viewport heights of scroll while intro is pinned (curtain + title + fade). */
  introScrollLength: 1000,
  /** Multiplier on wheel delta while scroll is inside the intro pin (0–1). */
  introWheelDampen: 0.32,
  nav: [
    { label: "WORK", href: "#work", active: true },
    { label: "ABOUT", href: "#about" },
    { label: "PLAYGROUND", href: "#" },
    { label: "CONTACT", href: "#about" },
  ],
  contactEmail: "hello@huyml.co",
  location: "Working globally · HCMC",
  showreelLabel: "'25 showreel",
  copyright: "© copyright 2026",
  galleryMeta: {
    selectedWorkLabel: "Selected work",
    roleLabel: "Role",
    launchLabel: "Launch",
    recognitionLabel: "Recognition",
    projectLabel: "Project",
    viewSiteLabel: "View site →",
  },
} as const;

export type SiteConfig = typeof site;
