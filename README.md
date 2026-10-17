# SUPERGROOVE 2.0 · Ronald Reloaded

Event landing page for 3 April 2027, based on the SUPERGROOVE flyer and the Kling animation of Ronald.

## Versions

The complete, dependency-free website is in `dist/`. Each version is self-contained and shares `assets/` and the calendar file:

| Route | Folder | Content |
|---|---|---|
| `/` | `dist/` | Live page, currently version one |
| `/one` | `dist/one/` | Version one: the first save-the-date page |
| `/two` | `dist/two/` | Version two: the 2027 redesign |

`/one` and `/two` use root-relative paths (`/assets/...`, `/two/styles.css`), so they render the same with or without a trailing slash, and they carry `noindex` so search engines only list `/`. To put a version live, copy its three files into `dist/`, switch the paths back to relative ones (`assets/...`, `styles.css`, `app.js`, `supergroove-2027.ics`) and remove the `noindex` line.

Version one (`/` and `/one`):

- `index.html`: German event content and accessible semantic markup
- `styles.css`: responsive green, yellow and coral festival design; locally hosted fonts
- `app.js`: video playback and sound controls, Berlin-date countdown, native flyer sharing with download fallback

Version two (`/two`):

- `index.html`: hero with kinetic type, Rio sunset scene (Sugarloaf, Corcovado, Copacabana promenade), "O Coração" with the values and the charitable idea, workshop, Batucada drum pads, save-the-date with live countdown, flyer sharing
- `styles.css`: Brazil palette (green, yellow, blue, carnival pink), aurora and confetti hero, scroll reveals; locally hosted fonts
- `app.js`: everything from version one plus scroll reveals, a Berlin-time countdown to the second and a small samba drum machine (surdo, caixa, tamborim, agogô, chocalho) synthesised live with the Web Audio API

Shared:

- `supergroove-2027.ics`: all-day save-the-date calendar entry, explicitly without a confirmed start time
- `assets/`: optimized animation, poster images, original flyer, fonts and favicon

Serve `dist/` with any static host. No build or package installation is required. For a local preview on your own machine, run `python3 -m http.server 8080 --directory dist`.

## Checks

Run `npm run check`. Checks JavaScript syntax, required local assets (HTML, CSS and JavaScript references), navigation targets and JavaScript element IDs for `/`, `/one` and `/two`, that both versions stay `noindex`, and the calendar dates. Python 3 and Node.js are sufficient. Browser visual QA should additionally be performed before a public launch.

## Content status

Confirmed from the organizer's announcement: 3 April 2027, SUPERGROOVE 2.0, workshop with Toby from Badaue Paris.

Venue, event times, workshop registration and line-up are intentionally marked as pending. Nothing has been carried over from the 2026 flyer. There is no booking form or payment collection.

In version two, the "Groove, der Gutes tut" card describes the charitable spirit of the event without naming a cause: which project SUPERGROOVE 2027 supports, and how, is announced as following. Add the details there once they are confirmed. The Portuguese quote is a line from Dorival Caymmi's "Samba da Minha Terra".

## Accessibility and privacy

The animation starts muted and respects reduced-motion preferences, and text remains available outside the video. In version two, reduced motion also switches off all CSS and SVG animation, confetti and scroll effects while every piece of content stays visible; every drum pad has a labelled control and also responds to the keys 1 to 4; drum sounds only start after a tap, click or key press and stop when the page is hidden or the video sound is switched on. Fonts and all media are local and the drum sounds are generated in the browser; no analytics, advertising scripts or third-party embeds are used.

## Hosting

Production: https://supergroove.vercel.app (Vercel project `supergroove`, serving `dist/`, deployed from `main`). The `.openai/hosting.json` manifest declares the private ChatGPT preview Site. The same `dist/` folder can be deployed to another static host without changes. If the public origin changes, update the absolute `og:image` URL in every `index.html`.

## Assets

Event artwork and animation supplied for this project. Nimbus Sans fonts are from URW Base35, distributed under the GNU AGPL v3 with the font embedding exception. See `dist/assets/FONT-LICENSE.txt`.
