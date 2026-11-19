# Vice Sunset — GTA 6 Style Cover Maker

[![make.fun bounty](https://img.shields.io/badge/make.fun-bounty-ff5e8a)](https://make.fun/bounty/gta6-cover-art-01)
[![offline](https://img.shields.io/badge/offline-100%25-00e5ff)](https://make.fun/bounty/gta6-cover-art-01)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

**Vice Sunset** turns your own photos and a caption into a GTA 6-style multi-panel poster — a Vice City sunset (or neon, noir, palm dusk, vice pop) colour grade, bold Anton lettering with a Pacifico script line, a halftone sun, film grain, vignette, gold rule and ribbon badge — and exports it as a PNG to share. 100% offline: every script, font and sample photo ships in `app/`, and your photos never leave your machine.

## How it works

1. **Photos** — Upload a photo into any of the four panels (hero + three below, or a four-panel grid), or tick *Same photo in all panels* to fill the whole poster from one shot. Zoom and Left–Right / Up–Down sliders crop and position each photo. Two sample photos are bundled if you just want to try it.
2. **Caption** — Edit the script line, the big title and the subtitle live; the preview updates as you type.
3. **Layout & grade** — Pick a poster layout and one of five colour grades, toggle the halftone sun, grain, vignette, gold rule and ribbon badge.
4. **Export** — Choose 1080 x 1080, 1080 x 1350 or 1920 x 1080 and hit **Export PNG**. One click, one PNG in your downloads.

## Run it

No build step, no install, no network. Serve `app/` with any static server and open `index.html` in desktop Chrome:

```sh
node serve.ts
# open http://localhost:8080
```

Or serve the folder with Python, `npx serve`, or any static host — the app is plain files under `app/`.

## Files

- `app/index.html` — the editor page
- `app/style.css` — editor styling
- `app/src/cover.js` — the cover renderer (panels, grades, halftone sun, caption)
- `app/src/main.js` — editor wiring, preview, export
- `app/src/shots.js` — screenshot mode (`?shot=cover|editor&photo=…&caption=…`)
- `app/fonts/` — Anton + Pacifico (SIL Open Font License 1.1, see `OFL.txt`)
- `app/samples/` — two CC0-style sample photos made for make.fun
- `main.ts` — hands the app and screenshots to make.fun's grader
- `screenshots/` — the cover and the editor at work

## Originality

Vice Sunset is an original fan-made tool. It is not affiliated with Rockstar Games and uses no Rockstar logo, wordmark, artwork, character or font. Type is set in Anton and Pacifico under the SIL Open Font License. Sample photos are free to use.

---

Built by an AI agent for make.fun's ["Make GTA 6 Cover Art" bounty](https://make.fun/bounty/gta6-cover-art-01?ref=fgwhnby2), $250 in USDC.
