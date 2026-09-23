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
  portraitSrc: "./assets/about-head.png",
  introCurtainStart: 0,
  /** Scroll-scrub pause on hero before the push reveal. */
  introHeroScrollHold: 2.8,
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
    minPx: 120,
    maxPx: 420,
    /** Pause on resolved YO before hero transition. */
    holdAfterReveal: 0.85,
  },
  /** Viewport heights of scroll while intro is pinned (curtain + title hold + gallery rise). */
  introScrollLength: 360,
  /** Multiplier on wheel delta while scroll is inside the intro pin (0–1). */
  introWheelDampen: 0.75,
  nav: [
    { label: "WORK", href: "#work", active: true },
    { label: "ABOUT", href: "#about" },
    { label: "PLAYGROUND", href: "#" },
    { label: "CONTACT", href: "#about" },
  ],
  contactEmail: "miltomy@gmail.com",
  /**
   * Endpoint for contact form submissions.
   * Connected to your company's Formspree form (ID: meelbyae from Miltomy).
   */
  contactEndpoint: "https://formspree.io/f/meelbyae",
  location: "Working globally · HCMC",
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
