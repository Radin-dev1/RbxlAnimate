# rbxlAnimate

AI Roblox animation maker — **red & black** web studio + upcoming Studio plugin.

**Repo:** https://github.com/Radin-dev1/RbxlAnimate

## What's working (Phase 1)

- Landing + **Studio** editor (prompt → R15-style 3D preview → export)
- **No watermarks** on exports (`.rbxlAnimate.json` KeyframeSequence package)
- **Auth:** email (demo), GitHub / Google / Roblox when env keys are set
- **Usage:** Free 10/mo · Pro 150/mo
- **Pro:** $15.99/mo or $179.99/yr — video→anim, high quality, more usage
- **Buy more usage** packs when you run out
- **Settings** hub (account, prefs, AI, billing, library, notifications, developer)
- Plugin folder stub for Phase 2 (Studio apply + full backgrounds)

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Sign in** with email → **Studio**.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm start` | Run production server |

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

Stripe Checkout activates when `STRIPE_SECRET_KEY` is set; otherwise Pro/packs upgrade in demo mode.

## Phase 2 — Studio plugin

See [`plugin/README.md`](plugin/README.md): Roblox-only login, apply animations in Studio, generate backgrounds (environment + scene kit + stage set).

## License

Private / all rights reserved unless otherwise noted.
