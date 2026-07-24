# rbxlAnimate

AI Roblox animation maker — the live site *is* the maker.

**Repo:** https://github.com/Radin-dev1/RbxlAnimate  
**Live (GitHub Pages):** https://radin-dev1.github.io/RbxlAnimate/

## Deploy (GitHub Pages)

Primary host is **GitHub Pages** via Actions (static Next.js export).

1. Push to `main` (workflow: `.github/workflows/deploy-pages.yml`).
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. Open: **https://radin-dev1.github.io/RbxlAnimate/**

Local builds use no `basePath`. CI sets `GITHUB_PAGES=true` so assets resolve under `/RbxlAnimate`.

## What's working

- **Homepage = maker** — prompt → R15 3D preview → export / copy for Studio
- **Guest generate** — no forced sign-in; sessions stay local
- **Motion grammar** — verbs, sequences (`then`), anticipation → action → follow → settle
- **Solo | Duel fight** — two R15s with mirrored counter moves
- **Timeline scrubber** — scrub, speed, loop / reverse / mirror
- **YouTube → idea** — oEmbed title inferred into a prompt (not pose-from-video ML)
- **Studio plugin** — `plugin/RbxlAnimate.plugin.luau` imports JSON into `AnimSaves` as a real KeyframeSequence
- **No watermarks** on exports (`.rbxlAnimate.json`)
- **Themes** — Classic Red/Black + extra palettes in Settings

## Quick start (web)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Type a move (e.g. `backflip`), generate, **Copy for Studio**.

## Studio plugin

See [plugin/README.md](plugin/README.md). Short version: drop `plugin/RbxlAnimate.plugin.luau` into Studio’s Plugins Folder, select an R15, paste JSON, Apply.

## Rig credits

- **R15:** MrXen0 — `MrXen0_R15RIG_v1.2` (`public/rigs/r15.glb`)

Re-export scripts live in `scripts/` for Blender 4+/5+.

## Roblox OAuth

On **GitHub Pages** the site is static — secrets cannot run in the browser. Guest / email demo login works without keys.

When you add a backend, put credentials in **`.env.local`** (never commit). See [`.env.example`](.env.example).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Local development |
| `npm run build` | Static export → `out/` |

## Static hosting notes

| Feature | On Pages |
|---|---|
| Animation generation | Client-side procedural grammar |
| Sign-in | Local guest / demo email |
| Payments | Demo / Stripe wiring for later |
| Studio import | Local Luau plugin + JSON paste |
