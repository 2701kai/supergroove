# SUPERGROOVE 2.0 · Ronald Reloaded

Event landing page for 3 April 2027, based on the SUPERGROOVE flyer and the Kling animation of Ronald.

## Source

The complete, dependency-free website is in `dist/`:

- `index.html`: German event content and accessible semantic markup
- `styles.css`: responsive green, yellow and coral festival design; locally hosted fonts
- `app.js`: video playback and sound controls, Berlin-date countdown, native flyer sharing with download fallback
- `supergroove-2027.ics`: all-day save-the-date calendar entry, explicitly without a confirmed start time
- `assets/`: optimized animation, poster images, original flyer, fonts and favicon

Serve `dist/` with any static host. No build or package installation is required. For a local preview on your own machine, run `python3 -m http.server 8080 --directory dist`.

## Checks

Run `npm run check`. Checks JavaScript syntax, required local assets and navigation targets, and the calendar dates. Python 3 and Node.js are sufficient. Browser visual QA should additionally be performed before a public launch.

## Content status

Confirmed from the organizer's announcement: 3 April 2027, SUPERGROOVE 2.0, workshop with Toby from Badaue Paris.

Venue, event times, workshop registration and line-up are intentionally marked as pending. Nothing has been carried over from the 2026 flyer. There is no booking form or payment collection.

## Accessibility and privacy

The animation starts muted and respects reduced-motion preferences. Playback and sound have labelled controls. Text remains available outside the video. Fonts and all media are local; no analytics, advertising scripts or third-party embeds are used.

## Hosting

The `.openai/hosting.json` manifest declares the private preview Site. The same `dist/` folder can be deployed to another static host without changes. If the public origin changes, update the absolute `og:image` URL in `index.html`.

## Assets

Event artwork and animation supplied for this project. Nimbus Sans fonts are from URW Base35, distributed under the GNU AGPL v3 with the font embedding exception. See `dist/assets/FONT-LICENSE.txt`.
