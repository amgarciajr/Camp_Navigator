# The Woods After Dark — Camp Navigator

A mobile-first, installable, offline-friendly PWA campground companion for **The Woods Camping Resort**. The app helps guests find campsites, bathhouses, named areas, social destinations, event-weekend touring spots, and a saved home base using fast native map handoff.

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

## PWA status

This root app is now the canonical PWA build.

Included PWA pieces:

- `manifest.webmanifest` for Add to Home Screen / standalone display.
- `service-worker.js` for offline app-shell caching.
- Root service-worker registration in `index.html`.
- Offline cache coverage for `index.html`, `styles.css`, `app.js`, `data.js`, `events.js`, manifest, icon, and map image.
- Alpine Nginx container for Umbrel/Portainer deployment.
- `docker-compose.yml` for one-click Portainer stack deployment.
- `nginx.conf` with PWA-aware cache headers.

For the best install experience on phones, serve the app over HTTPS. Local HTTP is fine for first testing on Umbrel/Portainer, but iOS/Android PWA behavior is most reliable on HTTPS.

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

- `index.html` — mobile app shell, PWA registration, and event companion layout.
- `styles.css` — Pride-forward After Dark UI and Resort Mode styling.
- `app.js` — search, aliases, shortcut routing, closest-bathroom logic, event-card rendering, and map handoff.
- `events.js` — public calendar theme blocks and event-to-destination mapping rules.
- `data.js` — generated campground destination and campsite data.
- `service-worker.js` — offline cache and app-shell fetch handling.
- `manifest.webmanifest` — PWA metadata.
- `nginx.conf` — static Nginx config with PWA-friendly cache headers.
- `docker-compose.yml` — Portainer/Umbrel stack definition.
- `assets/woods-map.png` — paper/reference map image.
- `assets/icon.svg` — app icon.
- `Dockerfile` — Alpine Nginx static hosting.

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
docker run --rm -p 8099:80 woods-after-dark
```

Open:

```text
http://localhost:8099
```

## Deploy on Umbrel with Portainer

1. Open Portainer on your Umbrel.
2. Choose the local Docker environment.
3. Go to **Stacks**.
4. Click **Add stack**.
5. Name the stack `woods-after-dark`.
6. Choose **Repository**.
7. Paste this GitHub repository URL.
8. Set the compose path to `docker-compose.yml`.
9. Deploy the stack.
10. Open the app at:

```text
http://umbrel.local:8099
```

or:

```text
http://YOUR-UMBREL-IP:8099
```

To update the app later, pull the latest GitHub changes and redeploy/recreate the stack in Portainer.

## Install on phone

After opening the app in a mobile browser:

- iPhone/Safari: Share button → **Add to Home Screen**.
- Android/Chrome: menu button → **Install app** or **Add to Home screen**.

Open it once while online so the service worker can cache the app shell and data.

## Privacy stance

This build does not scrape or infer private hookup behavior from social media or private sources. It uses supplied map/KML data, public calendar blocks, and explicit project direction from Mike Garcia. Adult/social language is place-based, consent-forward, and privacy-first.

## Legal / rights notice

Copyright and project ownership are retained by **Mike Garcia**. All rights reserved.
