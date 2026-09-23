import gsap from "gsap";
import { site } from "../content/site";

const FLIP_DEG = -180;
const TILT_PEEK = -12;

export function initAbout(reducedMotion: boolean): void {
  const about = document.querySelector<HTMLElement>(".js-about");
  if (!about) return;

  const ctaWords = gsap.utils.toArray<HTMLElement>(".js-about-cta-word");
  const flip = document.querySelector<HTMLElement>(".js-about-flip");
  const flipInner = document.querySelector<HTMLElement>(".js-about-flip-inner");
  const flipFront = document.querySelector<HTMLElement>(".js-about-flip-front");
  const hireBtn = document.querySelector<HTMLElement>(".js-hire-me");
  const hireText = document.querySelector<HTMLElement>(".js-hire-me-text");
  const hireLine = document.querySelector<HTMLElement>(".js-hire-me-line");
  const flipBack = document.querySelector<HTMLElement>(".js-about-flip-back");
  const flipClose = document.querySelector<HTMLElement>(".js-flip-close");
  const contactForm = document.querySelector<HTMLFormElement>(".js-about-contact-form");

  let flipped = false;

  const setFlippedState = (open: boolean): void => {
    flipped = open;
    hireBtn?.setAttribute("aria-expanded", open ? "true" : "false");
    if (flipBack) {
      if (open) flipBack.removeAttribute("inert");
      else flipBack.setAttribute("inert", "");
    }
    if (flipFront) {
      if (open) flipFront.setAttribute("inert", "");
      else flipFront.removeAttribute("inert");
    }
  };

  const setFlippedLayout = (open: boolean): void => {
    about.classList.toggle("is-flipped", open);
  };

  const openFlip = (): void => {
    if (!flipInner || flipped) return;
    setFlippedState(true);
    setFlippedLayout(true);
    if (reducedMotion) {
      const nameInput = contactForm?.querySelector<HTMLInputElement>(".js-contact-form-name");
      nameInput?.focus({ preventScroll: true });
      return;
    }
    gsap.to(about, {
      backgroundColor: "#000000",
      duration: 0.65,
      ease: "power2.out",
    });
    gsap.to(flipInner, {
      rotateX: FLIP_DEG,
      duration: 0.95,
      ease: "power3.inOut",
      onComplete: () => {
        const nameInput = contactForm?.querySelector<HTMLInputElement>(".js-contact-form-name");
        nameInput?.focus({ preventScroll: true });
      },
    });
  };

  const closeFlip = (): void => {
    if (!flipInner || !flipped) return;
    if (reducedMotion) {
      setFlippedLayout(false);
      setFlippedState(false);
      hireBtn?.focus({ preventScroll: true });
      return;
    }
    gsap.to(flipInner, {
      rotateX: 0,
      duration: 0.85,
      ease: "power3.inOut",
      onComplete: () => {
        setFlippedLayout(false);
        setFlippedState(false);
        hireBtn?.focus({ preventScroll: true });
      },
    });
    gsap.to(about, {
      backgroundColor: site.colors.workBg,
      duration: 0.55,
      ease: "power2.inOut",
    });
  };

  if (flipInner && !reducedMotion) {
    gsap.set(flipInner, { transformPerspective: 1200, transformOrigin: "50% 50%" });
  }

  if (reducedMotion) {
    gsap.set([...ctaWords, hireBtn, contactForm].filter(Boolean), {
      opacity: 1,
      y: 0,
      rotateX: 0,
      filter: "blur(0px)",
    });
    if (hireLine) gsap.set(hireLine, { scaleX: 1 });
    flipFront?.addEventListener("click", openFlip);
    flipClose?.addEventListener("click", closeFlip);
    hireBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      openFlip();
    });
  } else {
    const ctaTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".js-about-cta",
        start: "top 78%",
        toggleActions: "play none none reverse",
        markers: site.DEBUG,
      },
    });

    ctaTl.from(ctaWords, {
      y: 56,
      opacity: 0,
      rotateX: -28,
      transformOrigin: "50% 100%",
      stagger: 0.09,
      duration: 0.85,
      ease: "power3.out",
    });

    if (hireBtn && hireText && hireLine) {
      ctaTl.from(
        hireText,
        { y: 24, opacity: 0, duration: 0.65, ease: "power3.out" },
        "-=0.35",
      );
      ctaTl.from(hireLine, { scaleX: 0, duration: 0.75, ease: "power3.inOut" }, "-=0.45");
    }

    flipFront?.addEventListener("click", (event) => {
      if ((event.target as HTMLElement).closest(".js-about-contact-form")) return;
      openFlip();
    });

    hireBtn?.addEventListener("click", (event) => {
      event.stopPropagation();
      openFlip();
    });

    flipClose?.addEventListener("click", closeFlip);

    if (flip && flipInner && flipFront && window.matchMedia("(hover: hover)").matches) {
      flipFront.addEventListener("mouseenter", () => {
        if (flipped) return;
        gsap.to(flipInner, {
          rotateX: TILT_PEEK,
          duration: 0.45,
          ease: "power2.out",
        });
      });
      flipFront.addEventListener("mouseleave", () => {
        if (flipped) return;
        gsap.to(flipInner, {
          rotateX: 0,
          duration: 0.5,
          ease: "power2.inOut",
        });
      });
    }
  }

  contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nameInput = contactForm.querySelector<HTMLInputElement>(".js-contact-form-name");
    const emailInput = contactForm.querySelector<HTMLInputElement>(".js-contact-form-email");
    const messageInput = contactForm.querySelector<HTMLTextAreaElement>(".js-contact-form-message");
    const hearInput = contactForm.querySelector<HTMLInputElement>(".js-contact-form-hear");
    const submitBtn = contactForm.querySelector<HTMLButtonElement>(".about__hire-submit");
    const statusEl = contactForm.querySelector<HTMLElement>(".js-contact-form-status");

    const name = nameInput?.value.trim() ?? "";
    const from = emailInput?.value.trim() ?? "";
    const message = messageInput?.value.trim() ?? "";
    const hear = hearInput?.value.trim() ?? "";

    const endpoint = (site.contactEndpoint || contactForm.getAttribute("action") || "").trim();

    if (endpoint && !endpoint.startsWith("mailto:")) {
      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "SENDING...";
        }
        if (statusEl) {
          statusEl.textContent = "";
          statusEl.className = "about__hire-status js-contact-form-status";
        }

        const formData = new FormData(contactForm);

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formData,
        });

        const data = await res.json().catch(() => null);

        if (res.ok) {
          contactForm.reset();
          if (submitBtn) {
            submitBtn.textContent = "MESSAGE SENT!";
          }
          if (statusEl) {
            statusEl.textContent = "Your message was received. I'll be in touch soon.";
            statusEl.className = "about__hire-status js-contact-form-status is-success";
          }
          setTimeout(() => {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = "LET'S DO THIS";
            }
          }, 4000);
        } else {
          const errors = (data as { errors?: Array<{ message?: string }> } | null)?.errors;
          const errorMsg =
            errors?.map((err) => err.message).filter(Boolean).join(", ") ||
            "Submission failed. Please check your information.";
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "LET'S DO THIS";
          }
          if (statusEl) {
            statusEl.textContent = errorMsg;
            statusEl.className = "about__hire-status js-contact-form-status is-error";
          }
        }
      } catch {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "LET'S DO THIS";
        }
        if (statusEl) {
          statusEl.textContent = "Could not send directly. Opening email...";
          statusEl.classList.add("is-error");
        }
        setTimeout(() => {
          const subject = encodeURIComponent("Project inquiry — Milton portfolio");
          const body = encodeURIComponent(
            `Name: ${name}\nEmail: ${from}\nHow they heard about me: ${hear || "—"}\n\n${message}`,
          );
          window.location.href = `mailto:${site.contactEmail}?subject=${subject}&body=${body}`;
        }, 1200);
      }
      return;
    }

    const subject = encodeURIComponent("Project inquiry — Milton portfolio");
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${from}\nHow they heard about me: ${hear || "—"}\n\n${message}`,
    );
    window.location.href = `mailto:${site.contactEmail}?subject=${subject}&body=${body}`;
  });
}
