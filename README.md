# Shambala 2026 Festival Guide

An unofficial, static festival guide for Shambala 2026. It includes a time-aware timetable and Now & Next view, personal planning, global offline search, a festival map with optional current location, places, news, practical information, merchandise, and partners.

## Run locally

From this directory, start a local web server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

Opening `index.html` directly may not work because browsers restrict local JSON requests.

To test time-aware features, add an ISO timestamp to the URL, for example:

`http://localhost:8000/?testTime=2026-08-29T22:00:00Z#timetable`

The header displays the active test clock. Remove `testTime` from the URL to return to the real clock.

The guide is installable as a PWA. After the first successful visit, its interface, timetable, festival map, and previously viewed images remain available offline. YouTube previews and external links still require a connection.

The Settings section reports the active cache and storage state, can repair the core offline package, request persistent storage, and download optional image collections.

## Project structure

- `index.html` — the festival guide interface and application logic
- `data/merged.json` — merged timetable and configuration data
- `images-data/` — bundled and delta images referenced by the guide
- `manifest.webmanifest` and `service-worker.js` — installation and offline caching
- `icons/` — PWA install icons
- `vendor/maplibre-gl/` — self-hosted MapLibre map runtime and license

## Deployment

The site contains only static files and can be hosted with GitHub Pages, Cloudflare Pages, Netlify, or any ordinary web server.

Automatic data and image updates are not configured yet.

## Disclaimer

This is an unofficial community project and is not affiliated with or endorsed by Shambala Festival or VIKIN. Timetable details may change; check official sources for critical information.
