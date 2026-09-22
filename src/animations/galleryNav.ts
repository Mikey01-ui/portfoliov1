import { projects } from "../content/projects";
import { scrollToGalleryProject } from "./work";

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
  if (!list) return;

  const go = (index: number): void => {
    if (index < 0 || index >= projects.length) return;
    scrollToGalleryProject(index);
  };

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
