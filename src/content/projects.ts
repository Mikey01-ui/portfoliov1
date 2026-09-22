import gallery from "./gallery.json";

export const PROJECT_IMAGE_PLACEHOLDER = "/assets/projects/placeholder.svg";

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

const PROJECTS_DIR = "/assets/projects/";

/** Turn a gallery.json `image` value into a URL the site can load. */
export function resolveProjectImage(image: string): string {
  const trimmed = image.trim();
  if (!trimmed) return PROJECT_IMAGE_PLACEHOLDER;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
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
  const hasRecognition = entry.recognition !== undefined;
  return {
    id: entry.id ?? (slugFromTitle(entry.title) || `project-${index + 1}`),
    title: entry.title.trim(),
    category: entry.category.trim(),
    description: entry.description.trim(),
    launch: entry.launch.trim(),
    role: entry.role?.length ? entry.role.map((r) => r.trim()).filter(Boolean) : [...DEFAULT_ROLE],
    recognition: hasRecognition
      ? entry.recognition!.map((r) => r.trim()).filter(Boolean)
      : [...DEFAULT_RECOGNITION],
    image: resolveProjectImage(entry.image),
    url: entry.url?.trim() || undefined,
  };
}

function validateGallery(entries: GalleryEntry[]): void {
  if (!import.meta.env.DEV) return;

  entries.forEach((entry, index) => {
    const label = entry.title || `index ${index}`;
    for (const key of ["title", "category", "description", "image", "launch"] as const) {
      if (!entry[key]?.trim()) {
        console.warn(`[gallery.json] "${label}" is missing ${key}.`);
      }
    }
  });
}

validateGallery(gallery as GalleryEntry[]);

/** Gallery items — edit copy and images in `src/content/gallery.json`. */
export const projects: Project[] = (gallery as GalleryEntry[]).map(toProject);

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
