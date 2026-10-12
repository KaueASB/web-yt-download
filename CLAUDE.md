# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm**.

```bash
pnpm install
pnpm dev          # next dev --turbopack on http://localhost:3000
pnpm build        # production build (also the main type-check)
pnpm start
npx biome check --write .   # format + lint (Biome is the real formatter/linter)
```

`pnpm lint` runs `next lint`, but there is no ESLint config — Biome (`biome.json`) is the source of truth. There is no test suite.

Code style (enforced by Biome): tabs, single quotes, no semicolons, ES5 trailing commas, arrow parens only when needed, 80-col lines.

## Environment

Copy `env-example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the backend base URL. Because it is `NEXT_PUBLIC_`, it is inlined into the client bundle and the browser calls the backend directly.

## Architecture

This is a thin Next.js 15 (App Router, React 19, Tailwind v4, shadcn/ui "new-york") frontend for a video downloader. The actual downloading (yt-dlp-style format listing, processing, file serving) is done by a separate Express backend in the sibling directory `../api` (`node src/server.js`, port/config in its own `.env`).

Download flow, all driven client-side from `src/app/page.tsx` (a single large `'use client'` component) via `src/services/videoService.ts`:

1. `getVideoFormats(url)` → `GET {API}/formats?url=` returns `{ formats: [{ code, extension, resolution, filesize }] }`.
2. `startVideoDownload(url, code)` → `GET {API}/download-with-code?url=&code=` returns `{ jobId }`.
3. The page polls `getDownloadProgress(jobId)` → `GET {API}/progress?jobId=` with `setInterval` until progress reaches 100.
4. `downloadFile(jobId)` triggers the browser download by injecting a hidden iframe pointing at `{API}/file?jobId=` (avoids navigation/new tabs).

`src/app/api/file/route.ts` is a Next.js proxy for `{API}/file?jobId=` that forwards `content-type`/`content-disposition`/`content-length`. The client currently hits the backend directly, so this route is not on the main path.

Path alias `@/*` → `src/*`. UI primitives live in `src/components/ui` (shadcn); `cn()` is in `src/lib/utils.ts`. Animations use `framer-motion`, icons `lucide-react`. Code comments and README are in Portuguese.
