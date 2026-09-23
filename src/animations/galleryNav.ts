import { projects } from "../content/projects";
import { getCurrentActiveProjectIndex, scrollToGalleryProject } from "./work";

function projectIndexFromTarget(target: EventTarget | null): number | null {
  const item = (target as HTMLElement | null)?.closest<HTMLElement>(".js-project-item");
  if (!item) return null;
  const raw = item.dataset.index;
  if (raw === undefined) return null;
  const index = Number.parseInt(raw, 10);
  return Number.isFinite(index) ? index : null;
}

/** Click or keyboard on the list jumps to that project in the scroll gallery. */
export function initGalleryNavigation(): void {
  const list = document.querySelector(".js-project-list");

  const go = (index: number): void => {
    if (index < 0 || index >= projects.length) return;
    scrollToGalleryProject(index);
  };

  if (list) {
    list.addEventListener("click", (event) => {
      const index = projectIndexFromTarget(event.target);
      if (index === null) return;
      event.preventDefault();
      go(index);
    });

    list.addEventListener("keydown", (event) => {
      if (!(event instanceof KeyboardEvent)) return;
      if (!(event.target instanceof HTMLElement)) return;
      if (!event.target.classList.contains("js-project-item")) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      const index = projectIndexFromTarget(event.target);
      if (index !== null) go(index);
    });
  }

  // Allow clicking on visible cards directly to jump to that project
  document.querySelectorAll<HTMLElement>(".js-card").forEach((card) => {
    card.style.pointerEvents = "auto";
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      const raw = card.dataset.projectIndex;
      if (raw !== undefined) {
        const idx = Number.parseInt(raw, 10);
        if (Number.isFinite(idx)) go(idx);
      }
    });
  });

  // Mobile & tablet touch swipe gesture detection on the work section
  const workStage = document.querySelector<HTMLElement>(".work-stage");
  if (workStage) {
    let startX = 0;
    let startY = 0;
    let isTracking = false;

    workStage.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length === 1) {
          startX = e.touches[0]!.clientX;
          startY = e.touches[0]!.clientY;
          isTracking = true;
        }
      },
      { passive: true },
    );

    workStage.addEventListener(
      "touchend",
      (e) => {
        if (!isTracking || e.changedTouches.length === 0) return;
        isTracking = false;
        const dx = e.changedTouches[0]!.clientX - startX;
        const dy = e.changedTouches[0]!.clientY - startY;

        // Ensure horizontal intent (more horizontal than vertical, min 45px distance)
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
          const current = getCurrentActiveProjectIndex();
          if (dx < 0) {
            // Swipe left -> advance to next project
            go(current + 1);
          } else {
            // Swipe right -> return to previous project
            go(current - 1);
          }
        }
      },
      { passive: true },
    );

    workStage.addEventListener(
      "touchcancel",
      () => {
        isTracking = false;
      },
      { passive: true },
    );
  }
}
