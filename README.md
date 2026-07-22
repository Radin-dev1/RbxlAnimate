# rbxlAnimate

AI Roblox animation maker — **red & black** web studio. The live site *is* the maker (no separate marketing app).

**Repo:** https://github.com/Radin-dev1/RbxlAnimate  
**Live (GitHub Pages):** https://radin-dev1.github.io/RbxlAnimate/

## Deploy (GitHub Pages)

Primary host is **GitHub Pages** via Actions (static Next.js export).

1. Push to `main` (workflow: `.github/workflows/deploy-pages.yml`).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. After the first successful run, open:  
   **https://radin-dev1.github.io/RbxlAnimate/**

Local builds use no `basePath`. CI sets `GITHUB_PAGES=true` so assets resolve under `/RbxlAnimate`.

## What's working

- **Homepage = maker** — prompt → R15-style 3D preview → export
- **No watermarks** on exports (`.rbxlAnimate.json` KeyframeSequence package)
- **Auth:** demo email sign-in (browser localStorage). OAuth needs a backend later.
- **Usage:** Free 10/mo · Pro 150/mo (demo upgrade / packs on Pages)
- **Library · Pro · Settings** in the nav
- Plugin folder stub for Phase 2 (Studio apply + backgrounds)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you land in the maker. Sign in with any email to generate.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Local development |
| `npm run build` | Static export → `out/` |
| `npm start` | Not used for Pages (static). For local preview of `out/`, use any static server. |

## Static hosting notes

GitHub Pages serves **static files only**. This project uses `output: 'export'`.

| Feature | On Pages |
|---|---|
| Animation generation | Client-side (`generateAnimationFromPrompt`) |
| Sign-in | Demo email in localStorage |
| Pro / usage packs | Demo upgrade (local) |
| Stripe / NextAuth API | Not available on static Pages |

To charge real money later, add a small backend (or serverless) for Stripe Checkout and optionally OAuth — the UI is already shaped for that.

## Monetization

| | Free | Pro |
|---|---|---|
| Price | $0 | $15.99/mo or $179.99/yr |
| Generations | 10/mo | 150/mo |
| Text → anim | Yes | Yes |
| Video → anim | No | Yes |
| Quality | Standard | High |
| Watermark | Never | Never |
| Top-up packs | Yes | Yes |

## Phase 2 — Studio plugin

See [`plugin/README.md`](plugin/README.md): Roblox-only login, apply animations in Studio, generate backgrounds.

## License

Private / all rights reserved unless otherwise noted.
