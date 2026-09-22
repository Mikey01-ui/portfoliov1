import { ScrollTrigger } from "gsap/ScrollTrigger";
import { escapeAttr, escapeHtml } from "../content/escape";
import { projects } from "../content/projects";

function padIndex(n: number): string {
  return String(n + 1).padStart(2, "0");
}

export function refreshScroll(): void {
  ScrollTrigger.refresh();
}

export function debounceRefresh(ms = 150): () => void {
  let t: ReturnType<typeof setTimeout>;
  return () => {
    clearTimeout(t);
    t = setTimeout(() => refreshScroll(), ms);
  };
}

export function setActiveProject(index: number): void {
  const project = projects[index];
  if (!project) return;

  document.querySelectorAll(".js-project-item").forEach((el, i) => {
    el.classList.toggle("is-active", i === index);
    if (i === index) el.setAttribute("aria-current", "true");
    else el.removeAttribute("aria-current");
  });

  const roleEl = document.querySelector(".js-meta-role");
  const launchEl = document.querySelector(".js-meta-launch");
  const recEl = document.querySelector(".js-meta-recognition");
  const recBlock = document.querySelector(".js-meta-recognition-block");
  const linkBlock = document.querySelector(".js-meta-link-block");
  const linkEl = document.querySelector<HTMLAnchorElement>(".js-meta-link");
  const indexEl = document.querySelector(".js-section-index");
  const counterEl = document.querySelector(".js-counter-current");

  if (roleEl) roleEl.innerHTML = project.role.map((r) => `<li>${escapeHtml(r)}</li>`).join("");
  if (launchEl) launchEl.textContent = project.launch;

  if (recBlock && recEl) {
    const show = project.recognition.length > 0;
    recBlock.toggleAttribute("hidden", !show);
    if (show) {
      recEl.innerHTML = project.recognition.map((r) => `<li>${escapeHtml(r)}</li>`).join("");
    }
  }

  if (linkBlock && linkEl) {
    const show = Boolean(project.url);
    linkBlock.toggleAttribute("hidden", !show);
    if (show && project.url) {
      linkEl.href = project.url;
    }
  }

  if (indexEl) indexEl.textContent = padIndex(index);
  if (counterEl) {
    counterEl.textContent = padIndex(index);
    counterEl.setAttribute("style", `background-image:url('${escapeAttr(project.image)}')`);
  }
}

export function centerProjectList(index: number): number {
  const list = document.querySelector<HTMLElement>(".js-project-list");
  const item = document.querySelector<HTMLElement>(`.js-project-item[data-index="${index}"]`);
  if (!list || !item) return 0;

  const listParent = list.parentElement;
  if (!listParent) return 0;

  const listCenter = listParent.clientHeight / 2;
  const itemCenter = item.offsetTop + item.offsetHeight / 2;
  return listCenter - itemCenter;
}

export function waitForImages(root: ParentNode = document): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  const pending = imgs.filter((img) => !img.complete).map(
    (img) =>
      new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      }),
  );
  return Promise.all(pending).then(() => undefined);
}
