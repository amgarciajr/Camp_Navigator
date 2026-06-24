# The Woods After Dark — Camp Navigator

A mobile-first, offline-friendly campground companion for **The Woods Camping Resort**. The app helps guests find campsites, bathhouses, named areas, social destinations, event-weekend touring spots, and a saved home base using fast native map handoff.

## Ownership

**Project owner, creator, and maintainer: Mike Garcia.**

This repository, application concept, source code organization, campground navigation workflow, destination/alias mapping, After Dark product direction, event-companion model, and all project-specific implementation decisions are owned by **Mike Garcia** unless otherwise stated in a separate written agreement.

All rights are reserved by Mike Garcia. No transfer of ownership, license, resale right, or commercial usage right is granted by the presence of this repository alone.

## Product direction

This app is intentionally built as a **sex-positive, inclusive, rule-respecting campground companion**. It is not trying to hide the adult/social nature of the venue. It is designed to be playful, useful, respectful, and privacy-aware.

Core principles:

- Consent only.
- Respect privacy and boundaries.
- Follow posted campground rules.
- Keep shared paths and community spaces welcoming.
- Use official/public event information and user-provided map data.
- Do not scrape, infer, or expose private guest behavior.

## Current experience

- Pride-forward After Dark visual theme with rainbow borders, neon glow, and mobile-first UI.
- Native map handoff using `geo:0,0?q=[lat],[lng]` where supported.
- Fast destination search with aliases and duplicate-safe results.
- Quick actions for Fort Dix, The Grove, The Afters, Cabin 125, and closest bathroom.
- Closest-bathroom helper using browser geolocation.
- Calendar-aware event layer using public Woods theme-week/weekend blocks.
- Decoration-tour handling for Christmas in July, Illumination, and Festival of Lights weekends.
- Resort Mode toggle for a more neutral visual presentation.
- Paper-map reference overlay.

## Calendar/event layer

The public Woods calendar currently provides all-day theme blocks rather than individual hourly venue events. The app maps those blocks to suggested destinations instead of claiming exact event venues.

Examples:

- **Summer Heat / Key West** → Pool, Pavilion, Fort Dix, The Afters.
- **Bear / OktoBear** → Pavilion, Pool, Fort Dix, The Afters.
- **Country / Leather** → Pavilion, Fort Dix, The Afters, Bonfire Pit.
- **Christmas in July / Illumination / Festival of Lights** → campground-wide decoration tour.

Decoration-tour weekends are treated as campground-wide walking/touring experiences with suggested route stops such as The Grove, Grove Parking, Walnut Loop, Diversity Way, Pavilion, Bonfire Pit, and Cabin 125.

## Dataset

The navigation dataset is generated from supplied KML data plus estimated campsite positions from supplied campground map references.

- `DESTINATIONS`: KML-derived destinations and areas.
- `CAMPSITES`: campsite records, including estimated records where needed.
- Estimated coordinates are intended for guest navigation and are not survey-grade pad, utility, or property-boundary coordinates.

Estimated campsite records may include:

```js
estimated: true,
sourceGeometry: "EstimatedFromMap",
confidence: "high" | "medium" | "low"
```

## Files

- `index.html` — mobile app shell and event companion layout.
- `styles.css` — Pride-forward After Dark UI and Resort Mode styling.
- `app.js` — search, aliases, shortcut routing, closest-bathroom logic, event-card rendering, and map handoff.
- `events.js` — public calendar theme blocks and event-to-destination mapping rules.
- `data.js` — generated campground destination and campsite data.
- `manifest.webmanifest` — PWA metadata.
- `assets/woods-map.png` — paper/reference map image.
- `assets/icon.svg` — app icon.
- `Dockerfile` — nginx static hosting.

## Run locally

```bash
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080
```

## Run with Docker

```bash
docker build -t woods-after-dark .
docker run --rm -p 8080:80 woods-after-dark
```

Open:

```text
http://localhost:8080
```

## Deploy on Umbrel

Serve this as a static site with nginx or another lightweight web server container. No build step is required.

## Privacy stance

This build does not scrape or infer private hookup behavior from social media or private sources. It uses supplied map/KML data, public calendar blocks, and explicit project direction from Mike Garcia. Adult/social language is place-based, consent-forward, and privacy-first.

## Legal / rights notice

Copyright and project ownership are retained by **Mike Garcia**. All rights reserved.
