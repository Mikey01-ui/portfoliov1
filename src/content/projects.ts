import gallery from "./gallery.json";

export const PROJECT_IMAGE_PLACEHOLDER = "./assets/projects/placeholder.svg";

export type Project = {
  id: string;
  title: string;
  category: string;
  description: string;
  role: string[];
  launch: string;
  recognition: string[];
  image: string;
  url?: string;
};

type GalleryEntry = {
  id?: string;
  title: string;
  category: string;
  description: string;
  image: string;
  launch: string;
  role?: string[];
  recognition?: string[];
  url?: string;
};

const DEFAULT_ROLE = ["Design Direction", "Website Design"] as const;
const DEFAULT_RECOGNITION = [
  "Awwwards Site of the Day",
  "CSSDA Website of the Day",
  "FWA of the Day",
] as const;

const PROJECTS_DIR = "./assets/projects/";

/** Turn a gallery.json `image` value into a URL the site can load. */
export function resolveProjectImage(image: string): string {
  const trimmed = image.trim();
  if (!trimmed) return PROJECT_IMAGE_PLACEHOLDER;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("./")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `.${trimmed}`;
  }
  return `${PROJECTS_DIR}${trimmed}`;
}

function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toProject(entry: GalleryEntry, index: number): Project {
  const title = typeof entry?.title === "string" ? entry.title.trim() : `Project ${index + 1}`;
  const category = typeof entry?.category === "string" ? entry.category.trim() : "";
  const description = typeof entry?.description === "string" ? entry.description.trim() : "";
  const launch = entry?.launch != null ? String(entry.launch).trim() : "";
  const rawRoles = Array.isArray(entry?.role) ? entry.role : [];
  const role = rawRoles.map(String).map((r) => r.trim()).filter(Boolean);
  const rawRec = Array.isArray(entry?.recognition) ? entry.recognition : null;
  const recognition =
    rawRec !== null
      ? rawRec.map(String).map((r) => r.trim()).filter(Boolean)
      : [...DEFAULT_RECOGNITION];

  return {
    id:
      typeof entry?.id === "string" && entry.id.trim()
        ? entry.id.trim()
        : slugFromTitle(title) || `project-${index + 1}`,
    title,
    category,
    description,
    launch,
    role: role.length ? role : [...DEFAULT_ROLE],
    recognition,
    image: resolveProjectImage(typeof entry?.image === "string" ? entry.image : ""),
    url:
      typeof entry?.url === "string" && /^https?:\/\//i.test(entry.url.trim())
        ? entry.url.trim()
        : undefined,
  };
}

function validateGallery(entries: GalleryEntry[]): void {
  if (!import.meta.env.DEV || !Array.isArray(entries)) return;

  entries.forEach((entry, index) => {
    const label = entry?.title || `index ${index}`;
    for (const key of ["title", "category", "description", "image", "launch"] as const) {
      if (!entry?.[key]?.trim()) {
        console.warn(`[gallery.json] "${label}" is missing ${key}.`);
      }
    }
  });
}

const rawGallery = Array.isArray(gallery) ? (gallery as GalleryEntry[]) : [];
validateGallery(rawGallery);

/** Gallery items — edit copy and images in `src/content/gallery.json`. */
export const projects: Project[] = rawGallery.map(toProject);

/** Warm the browser cache so scroll transitions stay smooth. */
export function preloadProjectImages(): void {
  const seen = new Set<string>();
  for (const p of projects) {
    if (seen.has(p.image)) continue;
    seen.add(p.image);
    const img = new Image();
    img.src = p.image;
  }
}
