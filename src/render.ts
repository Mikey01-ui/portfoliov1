import { about } from "./content/about";
import { escapeAttr, escapeHtml } from "./content/escape";
import { projects } from "./content/projects";
import { introHero } from "./content/introHero";
import { site } from "./content/site";

function padIndex(n: number): string {
  return String(n + 1).padStart(2, "0");
}

export function sanitizeUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

function renderIntroHeroPanel(): string {
  return `
      <div class="intro-mask js-intro-mask intro-hero js-intro-hero">
        <div class="intro-hero__bg js-intro-hero-bg" aria-hidden="true">
          <canvas class="intro-hero__bg-canvas js-intro-hero-bg-canvas" aria-hidden="true"></canvas>
        </div>
        <div class="intro-hero__inner">
          <nav class="hero-bg-switcher js-hero-bg-switcher" aria-label="Hero background style">
            <span class="hero-bg-switcher__label">STYLE:</span>
            <button type="button" class="hero-bg-switcher__btn js-hero-bg-btn" data-mode="cad">1 · SWISS CAD</button>
            <button type="button" class="hero-bg-switcher__btn js-hero-bg-btn" data-mode="silk">2 · DARK SILK</button>
            <button type="button" class="hero-bg-switcher__btn js-hero-bg-btn" data-mode="phosphor">3 · PHOSPHOR</button>
            <button type="button" class="hero-bg-switcher__btn js-hero-bg-btn" data-mode="shapes">ORIGINAL</button>
          </nav>
          <div class="intro-hero__main">
            <div class="intro-hero__name-row">
              <span class="intro-hero__im js-intro-hero-im">${escapeHtml(introHero.lineIm)}</span>
              <span class="intro-hero__milton js-intro-hero-milton">${escapeHtml(introHero.lineName)}</span>
              <div class="intro-hero__portrait-block">
                <p class="intro-hero__tagline js-intro-hero-tagline">
                  <span class="intro-hero__tagline-arrow" aria-hidden="true">
                    <svg class="intro-hero__tagline-arrow-svg" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M28 5C22.5 10 14 17 6.5 26" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M5.5 15C6.5 20.5 6.8 24 6.5 26C8.8 25 12.8 23.5 17 22.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <span class="intro-hero__tagline-text">${escapeHtml(introHero.tagline)}</span>
                </p>
                <figure class="intro-hero__portrait js-intro-hero-portrait">
                  <img class="js-intro-hero-portrait-img" src="${escapeAttr(introHero.portraitSrc)}" alt="${escapeAttr(introHero.portraitAlt)}" width="512" height="682" decoding="async" />
                </figure>
              </div>
            </div>
          </div>
          <footer class="intro-hero__foot">
            <div class="intro-hero__scratch-line" aria-hidden="true"></div>
            <p class="intro-hero__scroll-cue js-intro-hero-cue">${escapeHtml(introHero.scrollCue)}</p>
          </footer>
        </div>
      </div>`;
}

export function renderApp(): string {
  const listItems = projects
    .map(
      (p, i) => `
    <li class="project-list__item js-project-item" data-index="${i}" data-project-id="${escapeAttr(p.id)}" role="button" tabindex="0" aria-label="Go to ${escapeAttr(p.title)}">
      <span class="project-list__title">${escapeHtml(p.title)}</span>
      <span class="project-list__meta">${escapeHtml(p.category)}</span>
      <p class="project-list__desc">${escapeHtml(p.description)}</p>
    </li>`,
    )
    .join("");

  const cards = projects
    .map(
      (p, i) => `
    <article class="project-card js-card" data-index="${i}" data-project-index="${i}" data-project-id="${escapeAttr(p.id)}">
      <img class="project-card__img js-card-img" src="${escapeAttr(p.image)}" alt="${escapeAttr(p.title)}" loading="eager" decoding="async" />
    </article>`,
    )
    .join("");

  const ctaWords = about.cta.lead
    .split(/\s+/)
    .map((word) => `<span class="about__cta-word js-about-cta-word">${escapeHtml(word)}</span>`)
    .join(" ");

  const first = projects[0];
  if (!first) {
    return `<p class="content-error">No projects in gallery.json — add at least one entry.</p>`;
  }
  const showRecognition = first.recognition.length > 0;
  const safeFirstUrl = sanitizeUrl(first.url);
  const showLink = Boolean(safeFirstUrl);
  const linkHref = safeFirstUrl ? escapeAttr(safeFirstUrl) : "#";

  return `
<header class="site-header js-site-header">
  <div class="site-header__brand">
    <span class="site-header__logo">${escapeHtml(site.brand)} ®</span>
    <span class="site-header__meta">${escapeHtml(site.copyright)}</span>
  </div>
</header>

<section class="intro js-intro" aria-label="Intro">
  <div class="intro__pin">
    <div class="intro-stage js-intro-stage">
      <div class="intro-sheet js-intro-sheet">
        <h1 class="intro-title js-intro-title" aria-label="${escapeAttr(`${site.displayName.line1} ${site.displayName.line2}`)}">
          <span class="intro-title__line1 js-intro-line1">${escapeHtml(site.displayName.line1)}</span>
          <span class="intro-title__line2 js-intro-line2">${escapeHtml(site.displayName.line2)}</span>
        </h1>
      </div>
      ${renderIntroHeroPanel()}
      <div class="intro-pixel-yo js-intro-pixel-yo">
        <canvas class="intro-pixel-yo__canvas js-intro-pixel-canvas" aria-hidden="true"></canvas>
        <span class="visually-hidden">${escapeHtml(site.introYo.text)}</span>
      </div>
    </div>
  </div>
</section>

<section class="work js-work" id="work" aria-label="Selected work">
  <div class="work-pin js-work-pin">
    <div class="work-stage">
      <div class="work-bg-index js-section-index">${padIndex(0)}</div>
      <aside class="work-meta js-work-meta">
        <div class="work-meta__block">
          <h3>${escapeHtml(site.galleryMeta.roleLabel)}</h3>
          <ul class="js-meta-role">${first.role.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
        </div>
        <div class="work-meta__block">
          <h3>${escapeHtml(site.galleryMeta.launchLabel)}</h3>
          <p class="js-meta-launch">${escapeHtml(first.launch)}</p>
        </div>
        <div class="work-meta__block js-meta-recognition-block"${showRecognition ? "" : ' hidden'}>
          <h3>${escapeHtml(site.galleryMeta.recognitionLabel)}</h3>
          <ul class="js-meta-recognition">${first.recognition.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
        </div>
        <div class="work-meta__block js-meta-link-block"${showLink ? "" : ' hidden'}>
          <h3>${escapeHtml(site.galleryMeta.projectLabel)}</h3>
          <a class="work-meta__link js-meta-link" href="${linkHref}" target="_blank" rel="noopener noreferrer"${showLink ? "" : ' tabindex="-1" aria-hidden="true"'}>${escapeHtml(site.galleryMeta.viewSiteLabel)}</a>
        </div>
      </aside>
      <div class="work-canvas js-card-stack">${cards}</div>
      <aside class="project-list" aria-label="Project index">
        <ul class="project-list__inner js-project-list">${listItems}</ul>
        <div class="project-list__scrollbar" aria-hidden="true"><span class="js-scroll-thumb"></span></div>
      </aside>
      <div class="work-theme-swatches" aria-hidden="true"><span></span><span></span></div>
      <footer class="work-counter">
        <div class="work-counter__nums">
          <span class="work-counter__current js-counter-current" style="background-image:url('${escapeAttr(first.image)}')">${padIndex(0)}</span>
          <span class="work-counter__sep">/</span>
          <span class="work-counter__total">${String(projects.length).padStart(2, "0")}</span>
        </div>
      </footer>
    </div>
  </div>
</section>

<section class="about js-about" id="about" aria-label="About">
  <div class="about__stage">
    <div class="about__copy">
      <div class="about__cta js-about-cta">
        <div class="about__flip js-about-flip">
          <div class="about__flip-inner js-about-flip-inner">
            <div class="about__flip-front js-about-flip-front">
              <p class="about__cta-lead" aria-label="${escapeAttr(about.cta.lead)}">${ctaWords}</p>
              <button
                type="button"
                class="about__hire js-hire-me"
                aria-expanded="false"
                aria-controls="about-contact-form"
              >
                <span class="about__hire-text js-hire-me-text">${escapeHtml(about.cta.hireLabel)}</span>
                <span class="about__hire-line js-hire-me-line" aria-hidden="true"></span>
                <span class="about__flip-hint">${escapeHtml(about.cta.flipHint)}</span>
              </button>
            </div>
            <div class="about__flip-back js-about-flip-back" inert>
              <div class="about__hire-panel">
                <div class="about__hire-panel-bar">
                  <span class="about__hire-tag">${escapeHtml(about.cta.formTopLabel)}</span>
                  <span class="about__hire-brand">${escapeHtml(about.cta.formBrand)}</span>
                  <button type="button" class="about__form-back js-flip-close" aria-label="Close contact form">${escapeHtml(about.cta.formBackLabel)}</button>
                </div>
                <h2 class="about__hire-headline">${escapeHtml(about.cta.formHeadline)}</h2>
                <form
                  id="about-contact-form"
                  class="about__hire-form js-about-contact-form"
                  action="${escapeAttr(site.contactEndpoint || `mailto:${site.contactEmail}`)}"
                  method="post"
                >
                  <div class="about__hire-fields">
                    <input
                      class="about__hire-field about__hire-field--name js-contact-form-name"
                      type="text"
                      name="name"
                      required
                      autocomplete="name"
                      placeholder="${escapeAttr(about.cta.formNamePlaceholder)}"
                      aria-label="${escapeAttr(about.cta.formNamePlaceholder)}"
                    />
                    <input
                      class="about__hire-field about__hire-field--email js-contact-form-email"
                      type="email"
                      name="email"
                      required
                      autocomplete="email"
                      placeholder="${escapeAttr(about.cta.formEmailPlaceholder)}"
                      aria-label="${escapeAttr(about.cta.formEmailPlaceholder)}"
                    />
                    <textarea
                      class="about__hire-field about__hire-field--message js-contact-form-message"
                      name="message"
                      required
                      rows="4"
                      placeholder="${escapeAttr(about.cta.formMessagePlaceholder)}"
                      aria-label="${escapeAttr(about.cta.formMessagePlaceholder)}"
                    ></textarea>
                    <input
                      class="about__hire-field about__hire-field--hear js-contact-form-hear"
                      type="text"
                      name="referral"
                      autocomplete="off"
                      placeholder="${escapeAttr(about.cta.formHearPlaceholder)}"
                      aria-label="${escapeAttr(about.cta.formHearPlaceholder)}"
                    />
                  </div>
                  <button class="about__hire-submit" type="submit">${escapeHtml(about.cta.formSubmitLabel)}</button>
                  <div class="about__hire-status js-contact-form-status" aria-live="polite"></div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
`;
}
