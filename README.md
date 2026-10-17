# SUPERGROOVE 2.0 · Ronald Reloaded

Event landing page for 3 April 2027, based on the SUPERGROOVE flyer and the Kling animation of Ronald.

## Source

The complete, dependency-free website is in `dist/`:

- `index.html`: German event content and accessible semantic markup. Sections: hero, Rio sunset scene, "Das Herz dahinter" (values and the philanthropic idea), workshop, Batucada drum pads, save-the-date with live countdown, flyer sharing
- `styles.css`: vibrant Brazil palette (green, yellow, blue, carnival pink), kinetic type, aurora and confetti hero, scroll reveals; locally hosted fonts
- `app.js`: video playback and sound controls, Berlin-time countdown, scroll reveals, native flyer sharing with download fallback, and a small samba drum machine (surdo, caixa, tamborim, agogô, chocalho) synthesised live with the Web Audio API
- `supergroove-2027.ics`: all-day save-the-date calendar entry, explicitly without a confirmed start time
- `assets/`: optimized animation, poster images, original flyer, fonts and favicon
- `draft-one/`: the first version of the site, kept as an archive at `/draft-one/`

Serve `dist/` with any static host. No build or package installation is required. For a local preview on your own machine, run `python3 -m http.server 8080 --directory dist`.

## Archived first draft

`dist/draft-one/` holds the original page unchanged apart from root-relative paths (`/assets/...`, `/draft-one/styles.css`), so it renders identically at `/draft-one` and `/draft-one/` and shares the assets and calendar file with the current page. It carries `noindex` so search engines only list the current version.

## Checks

Run `npm run check`. Checks JavaScript syntax, required local assets (HTML, CSS and JavaScript references), navigation targets and JavaScript element IDs for both the current page and `/draft-one/`, plus the calendar dates. Python 3 and Node.js are sufficient. Browser visual QA should additionally be performed before a public launch.

## Content status

Confirmed from the organizer's announcement: 3 April 2027, SUPERGROOVE 2.0, workshop with Toby from Badaue Paris.

Venue, event times, workshop registration and line-up are intentionally marked as pending. Nothing has been carried over from the 2026 flyer. There is no booking form or payment collection.

The "Groove, der Gutes tut" card describes the charitable spirit of the event without naming a cause: which project SUPERGROOVE 2027 supports, and how, is announced as following. Add the details there once they are confirmed. The Portuguese quote is a line from Dorival Caymmi's "Samba da Minha Terra".

## Accessibility and privacy

The animation starts muted and respects reduced-motion preferences: with reduced motion, the video does not autoplay and all CSS and SVG animation, confetti and scroll effects are switched off while every piece of content stays visible. Playback, sound and every drum pad have labelled controls; pads also respond to the keys 1 to 4. Drum sounds only start after a tap, click or key press and stop when the page is hidden or the video sound is switched on. Text remains available outside the video. Fonts and all media are local and the drum sounds are generated in the browser; no analytics, advertising scripts or third-party embeds are used.

## Hosting

Production: https://supergroove.vercel.app (Vercel project `supergroove`, serving `dist/`, deployed from `main`). The `.openai/hosting.json` manifest declares the private ChatGPT preview Site. The same `dist/` folder can be deployed to another static host without changes. If the public origin changes, update the absolute `og:image` URL in `index.html`.

## Assets

Event artwork and animation supplied for this project. Nimbus Sans fonts are from URW Base35, distributed under the GNU AGPL v3 with the font embedding exception. See `dist/assets/FONT-LICENSE.txt`.
