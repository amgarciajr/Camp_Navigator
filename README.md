# Campground Navigator — Fully Featured Mobile App Build

This package turns the original standalone HTML/CSS/JS navigator into a fuller native-style mobile web app.

## Major value-add features

- Full-screen native-style mobile layout
- Interactive campground map using the supplied Woods map image
- Tap/click map markers
- Pinch, pan, wheel zoom, and floating zoom controls
- Draggable bottom sheet with peek, mid, and full states
- Global search with instant results
- POI / bathhouse / area directory
- Fast campsite numeric lookup
- Site 125 home-base quick action
- Category layer filters
- Selected destination card
- Native `geo:0,0?q=[lat],[lng]` navigation
- Apple Maps and Google Maps fallback buttons
- Favorites saved to local storage
- Recent destinations saved to local storage
- Share destination using the Web Share API where available
- Copy coordinates to clipboard
- Guest-safe label toggle
- Offline app shell via service worker
- PWA manifest for Add to Home Screen support

## Current dataset

Generated from the supplied KML plus estimated campsite positions from the supplied campground map image.

- `DESTINATIONS`: 52 KML destinations
- `CAMPSITES`: 248 campsite records
  - 1 known KML coordinate: Site 125
  - 174 plain numeric site records
  - 1 alpha numeric record: Site 37B
  - 65 Grove records: G1-G65

Estimated campsite records are marked with:

```js
estimated: true,
sourceGeometry: "EstimatedFromMap",
confidence: "high" | "medium" | "low"
```

These coordinates are intended for guest navigation and should get users close to the correct site. They are not survey-grade pad or utility-hookup coordinates.

## Files

- `index.html` — full-screen app shell
- `styles.css` — native-style mobile UI
- `app.js` — app logic, search, pan/zoom, sheet states, favorites, recent, sharing, and navigation
- `data.js` — generated location data
- `service-worker.js` — offline cache
- `manifest.webmanifest` — PWA metadata
- `assets/woods-map.png` — visual map base layer
- `assets/icon.svg` — PWA icon
- `Dockerfile` — nginx static hosting

## Run locally

```bash
cd campground-navigator-pro
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080
```

## Run with Docker

```bash
docker build -t campground-navigator .
docker run --rm -p 8080:80 campground-navigator
```

Open:

```text
http://localhost:8080
```

## Deploy on Umbrel

Use this as a static site served by nginx or any lightweight web server container next to Home Assistant. No build step is required.


## Update: Diversity Way F26-F33

Added estimated records for the missed Diversity Way F-sites:

```text
F26, F27, F28, F29, F30, F31, F32, F33
```

These are marked `estimated: true`, `confidence: "medium"`, and `sourceGeometry: "EstimatedFromMap"`. They are suitable for guest navigation but should be verified in the Google satellite calibration page before treating them as final.


## Final calibration merge

Imported `corrected-campsites.json` from the Google satellite calibration workflow.

- Campsite records: 248
- Export timestamp: 2026-06-23T18:12:02.454Z
- Export-reported changed records: 1
- Merge report: `MERGE_REPORT.md`

The app still uses the Woods resort map as the guest-facing visual layer and uses corrected campsite latitude/longitude values for navigation.


## After Dark primary release

This build makes **After Dark** the default product personality and keeps the neutral/boring version as an opt-in **Boring / discreet mode** in the Discretion tab.

### Included

- Neon late-night color system: fuchsia, violet, cyan, midnight plum
- Sassy but usable app copy
- "The Move", "Hunt", "Little Black Book", and "Discretion" tabs
- Boring/discreet mode that switches back to neutral colors and hides spicy/social labels
- After Dark rules card: consent, privacy, quiet sites, and no outing
- Uses the corrected campsite export already merged into `data.js`

### Privacy stance

This build does not scrape or infer private hookup behavior from social media. It uses the campsite/POI data already provided and keeps any after-dark language place-based, playful, and privacy-first.
