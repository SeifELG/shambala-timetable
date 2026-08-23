# Shambala 2026 Festival Guide

An unofficial, static festival guide for Shambala 2026. It includes the timetable, personal planning, festival map, places, news, practical information, merchandise, and partners.

## Run locally

From this directory, start a local web server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

Opening `index.html` directly may not work because browsers restrict local JSON requests.

## Project structure

- `index.html` — the festival guide interface and application logic
- `data/merged.json` — merged timetable and configuration data
- `images-data/` — bundled and delta images referenced by the guide
- `vendor/maplibre-gl/` — self-hosted MapLibre map runtime and license

## Deployment

The site contains only static files and can be hosted with GitHub Pages, Cloudflare Pages, Netlify, or any ordinary web server.

Automatic data and image updates are not configured yet.

## Disclaimer

This is an unofficial community project and is not affiliated with or endorsed by Shambala Festival or VIKIN. Timetable details may change; check official sources for critical information.
