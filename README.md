# Shambala 2026 Timetable

An unofficial, static timetable viewer for Shambala 2026. It is built from the festival app's bundled timetable data and its latest published delta.

## Run locally

From this directory, start a local web server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

Opening `index.html` directly may not work because browsers restrict local JSON requests.

## Project structure

- `index.html` — the timetable interface
- `data/merged.json` — merged timetable and configuration data
- `images-data/` — bundled and delta images referenced by the timetable

## Deployment

The site contains only static files and can be hosted with GitHub Pages, Cloudflare Pages, Netlify, or any ordinary web server.

Automatic data and image updates are not configured yet.

## Disclaimer

This is an unofficial community project and is not affiliated with or endorsed by Shambala Festival or VIKIN. Timetable details may change; check official sources for critical information.
