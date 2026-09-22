# portfoliov1

Vite + TypeScript + GSAP ScrollTrigger portfolio: pixel **YO** intro, **IM / MILTON** hero, curtain reveal (**SEE WHAT I DO**), work gallery, and about section.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (often `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

Static output is in `dist/` — suitable for GitHub Pages, Netlify, Vercel, or any static host.

## Edit content

- **Intro & site chrome:** `src/content/site.ts`
- **Hero copy & portrait:** `src/content/introHero.ts`
- **Gallery:** `src/content/gallery.json` (schema: `gallery.schema.json`)
- **About:** `src/content/about.ts`

Set `DEBUG: true` in `site.ts` for ScrollTrigger markers.
