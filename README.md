# Ameer Al-Butaihi — Personal Website

A personal portfolio built as a pure HTML/CSS/JS site — no frameworks, no build tools. Just carefully written code and a lot of attention to detail.

---

## Pages

| Page | Path | Description |
|---|---|---|
| Landing | `index.html` | Two-sided split — Matrix (CV) and Human (everything else) |
| Intro | `intro.html` | First-visit entrance sequence |
| Human | `human.html` | Photography, posters, patterns, cooking, music |
| Matrix | `matrix.html` | Full CV — overview, detailed timeline, skill graph |
| Mind | `mind.html` | Hidden. Desktop only. You'll find it if you're curious enough. |

---

## Structure

```
/
├── index.html, intro.html, human.html, matrix.html, mind.html, editor.html
├── css/          — one stylesheet per page/feature
├── js/           — shared core + one script per page/feature
├── images/       — photography, posters, profile
└── music/        — audio files for the music player
```

---

## Technical notes

- `js/core.js` — shared foundation: EventBus, RAF loop, `portal()` circular reveal transition, DOM helpers
- `js/protect.js` — image protection: right-click disabled, drag blocked, CSS user-select
- Portal transitions connect every page navigation with a circular reveal animation
- Ambient canvas particles run on a single shared RAF loop
- The mind page is restricted to desktop — redirects mobile visitors automatically

---

## Built with

Pure HTML · CSS · Vanilla JS · Web Audio API · Canvas API

No dependencies. No build step. Open `index.html` and it works.

---
