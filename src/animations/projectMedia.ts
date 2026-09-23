import { PROJECT_IMAGE_PLACEHOLDER } from "../content/projects";

export const PORTRAIT_PLACEHOLDER = "./assets/portrait-placeholder.svg";

/** Ensure gallery card images are eager-loaded when unlocked. */
export function reloadProjectCardImages(): void {
  document.querySelectorAll<HTMLImageElement>(".js-card-img").forEach((img) => {
    img.loading = "eager";
  });
}

/** Show placeholder if a gallery or hero image path is wrong or missing. */
export function bindProjectImageFallbacks(): void {
  document.querySelectorAll<HTMLImageElement>(".js-card-img").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        if (img.dataset.fallbackApplied === "1") return;
        img.dataset.fallbackApplied = "1";
        img.src = PROJECT_IMAGE_PLACEHOLDER;
      },
      { once: true },
    );
  });

  const heroImg = document.querySelector<HTMLImageElement>(".js-intro-hero-portrait-img");
  heroImg?.addEventListener(
    "error",
    () => {
      heroImg.src = PORTRAIT_PLACEHOLDER;
    },
    { once: true },
  );
}
