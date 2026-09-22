import { PROJECT_IMAGE_PLACEHOLDER } from "../content/projects";

/** Force gallery `<img>` tags to load (needed while work section was hidden during intro). */
export function reloadProjectCardImages(): void {
  document.querySelectorAll<HTMLImageElement>(".js-card-img").forEach((img) => {
    const src = img.getAttribute("src");
    if (!src || src.includes("placeholder.svg")) return;
    delete img.dataset.fallbackApplied;
    img.loading = "eager";
    img.src = src;
  });
}

/** Show placeholder only after a retry if a gallery image path is wrong or missing. */
export function bindProjectImageFallbacks(): void {
  document.querySelectorAll<HTMLImageElement>(".js-card-img").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        if (img.dataset.fallbackApplied === "1") return;

        const src = img.getAttribute("src");
        if (src && !img.dataset.retried) {
          img.dataset.retried = "1";
          img.src = `${src.split("?")[0]}?v=${Date.now()}`;
          return;
        }

        img.dataset.fallbackApplied = "1";
        img.src = PROJECT_IMAGE_PLACEHOLDER;
      },
      { once: false },
    );
  });
}
