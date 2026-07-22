# rbxlAnimate

AI Roblox animation maker — themed web studio. The live site *is* the maker (no separate marketing app).

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

- **Homepage = maker** — prompt → real **R15 / R6** 3D preview (GLB from Blender) → export
- **Rigs** — `public/rigs/r15.glb` (MrXen0 R15) and `public/rigs/r6.glb` (classic blocky R6 from Blender R6)
- **Rig toggle** — R15 | R6 in the maker; exports tag `rig: "r15" | "r6"`
- **Style themes** — Classic Red/Black + Aqua Slate, Volt Mint, Rose Noir, Coral Smoke, Neon Grove, Teal Punch (Settings + header swatches)
- **Procedural AI** — motion grammar, anticipation → action → follow-through → settle
- **No watermarks** on exports (`.rbxlAnimate.json`)
- **Auth:** demo email sign-in (localStorage)
- Plugin folder stub for Phase 2

## Rig credits

- **R15:** MrXen0 — `MrXen0_R15RIG_v1.2`
- **R6:** Blender R6 community rig (blocky body meshes + InternalArmature hierarchy)

Re-export scripts live in `scripts/` (`export_r15_clean.py`, `export_r6_v2.py`) for Blender 4+/5+.

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

Private / all rights reserved unless otherwise noted. Rig authors retain rights to their original Blender assets; shipped GLBs are optimized web previews for this app.
