import { CAMPSITES, DESTINATIONS } from './data.js';

const $ = (selector) => document.querySelector(selector);

const els = {
  form: $('#findForm'),
  input: $('#searchInput'),
  clear: $('#clearButton'),
  results: $('#results'),
  summary: $('#resultSummary'),
  paperMapButton: $('#paperMapButton'),
  paperOverlay: $('#paperMapOverlay'),
  paperCloseButton: $('#paperCloseButton'),
  discreetButton: $('#discreetButton'),
};

const STORAGE_KEY = 'campnav:boring-mode:v2';
const categoryLabels = {
  campsite: 'Campsite',
  bathhouse: 'Bathhouse',
  poi: 'POI',
  area: 'Area',
  'road-path': 'Road / path',
  parking: 'Parking',
};

const canonicalDestinationNames = {
  'ft. dix': 'Fort Dix',
  'ft dix': 'Fort Dix',
  'the grove camping area': 'The Grove',
  'triangle field': 'The Afters at Triangle Field',
  'massages': 'BodyShop / Massages',
  'grove parking': 'Grove Parking',
  'office parking area': 'Office Parking',
  'the woods pool': 'Pool',
};

const commonAliases = {
  'Fort Dix': ['Ft. Dix', 'Ft Dix', 'Dix', 'cruising', 'cruising spot', 'known cruising area'],
  'The Grove': ['Grove', 'Grove Camping Area', 'The Grove Camping Area', 'grove sites'],
  'The Afters at Triangle Field': ['The Afters', 'Afters', 'Triangle Field', 'after party', 'late night field'],
  'Back to the Cabin at 125': ['Cabin 125', 'Site 125', '125', 'home', 'home base', 'back to cabin'],
  'BodyShop / Massages': ['Massages', 'Massage', 'Body Shop', 'BodyShop', 'cuts', 'bodyscaping'],
  'Grove Parking': ['Grove lot', 'Grove parking lot', 'parking near grove'],
  'Pool': ['The Woods Pool', 'pool party', 'swimming pool'],
  'Fort Dix': ['Ft. Dix', 'Ft Dix', 'Dix', 'cruising', 'cruise', 'cruising spot', 'known cruising area'],
  'The Pavilion': ['Pavilion', 'main pavilion'],
  'The Bonfire Pit': ['Bonfire', 'Fire Pit', 'bonfire pit'],
  'Fitness Center (Gym)': ['Gym', 'Fitness Center', 'workout'],
  'Coco': ['Coco bathhouse', 'bathroom', 'restroom', 'shower', 'comfort station'],
  'Sophia': ['Sophia bathhouse', 'bathroom', 'restroom', 'shower', 'comfort station'],
  'Rose': ['Rose bathhouse', 'bathroom', 'restroom', 'shower', 'comfort station'],
  'Dorothy': ['Dorothy bathhouse', 'bathroom', 'restroom', 'shower', 'comfort station'],
  'Blanch': ['Blanche', 'Blanch bathhouse', 'bathroom', 'restroom', 'shower', 'comfort station'],
  'Stanley': ['Stanley bathhouse', 'bathroom', 'restroom', 'shower', 'comfort station'],
};

const shortcutDestinations = {
  fortDix: {
    id: 'shortcut-fort-dix',
    name: 'Fort Dix',
    displayName: 'Fort Dix',
    aliases: commonAliases['Fort Dix'],
    lat: 40.895742,
    lng: -75.604859,
    category: 'poi',
    siteNumber: null,
    sourceGeometry: 'Point from updated KML',
    estimated: false,
    searchText: 'fort dix ft dix cruising cruise known cruising area',
    note: 'Known advertised cruising area. Consent only, respect privacy, and follow resort rules.',
  },
  theGrove: {
    id: 'shortcut-the-grove',
    name: 'The Grove',
    displayName: 'The Grove',
    aliases: commonAliases['The Grove'],
    lat: 40.8970775,
    lng: -75.6027170,
    category: 'area',
    siteNumber: null,
    sourceGeometry: 'The Grove Camping Area polygon centroid from updated KML',
    estimated: false,
    searchText: 'the grove grove camping area grove sites',
  },
  theAfters: {
    id: 'shortcut-the-afters',
    name: 'The Afters at Triangle Field',
    displayName: 'The Afters at Triangle Field',
    aliases: commonAliases['The Afters at Triangle Field'],
    lat: 40.8992354,
    lng: -75.5984093,
    category: 'poi',
    siteNumber: null,
    sourceGeometry: 'Triangle Field point from updated KML',
    estimated: false,
    searchText: 'afters the afters triangle field after party late night field',
  },
  cabin125: {
    id: 'shortcut-cabin-125',
    name: 'Back to the Cabin at 125',
    displayName: 'Back to the Cabin at 125',
    aliases: commonAliases['Back to the Cabin at 125'],
    lat: 40.8980997,
    lng: -75.6060225,
    category: 'campsite',
    siteNumber: '125',
    sourceGeometry: 'Site 125 point from updated KML',
    estimated: false,
    searchText: 'cabin 125 site 125 back to cabin home home base',
  },
};

const bathhouses = [
  { name: 'Sophia', lat: 40.898128, lng: -75.605151 },
  { name: 'Rose', lat: 40.898241, lng: -75.606721 },
  { name: 'Dorothy', lat: 40.897621, lng: -75.606501 },
  { name: 'Blanch', lat: 40.895967, lng: -75.604879 },
  { name: 'Coco', lat: 40.897127, lng: -75.603212 },
  { name: 'Stanley', lat: 40.897795, lng: -75.602405 },
];

let locations = buildLocations();
let boringMode = readBoringMode();
applyMode();
renderDefault();

function readBoringMode() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'false'); }
  catch { return false; }
}

function writeBoringMode() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boringMode));
}

function applyMode() {
  document.body.classList.toggle('is-boring', boringMode);
  els.discreetButton.textContent = boringMode ? 'After Dark' : 'Boring mode';
  els.discreetButton.setAttribute('aria-pressed', String(boringMode));
  document.title = boringMode ? 'Campground Navigator' : 'The Woods After Dark';
}

function normalize(value) {
  return String(value ?? '').trim().toUpperCase().replace(/\s+/g, '')
    .replace(/^([A-Z]+)0+(\d)/, '$1$2')
    .replace(/^0+(\d)/, '$1');
}

function normalizeName(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function friendlyName(name) {
  const normalized = normalizeName(name);
  return canonicalDestinationNames[normalized] || name;
}

function aliasesFor(displayName, rawName) {
  const aliases = new Set([...(commonAliases[displayName] || []), ...(commonAliases[rawName] || [])]);
  if (displayName !== rawName) aliases.add(rawName);
  return [...aliases];
}

function makeDuplicateSafeNames(items) {
  const counts = new Map();
  items.forEach((item) => {
    counts.set(item.displayName, (counts.get(item.displayName) || 0) + 1);
  });

  const seen = new Map();
  return items.map((item) => {
    const total = counts.get(item.displayName) || 0;
    if (total <= 1 || item.category === 'campsite') return item;

    const next = (seen.get(item.displayName) || 0) + 1;
    seen.set(item.displayName, next);

    return {
      ...item,
      displayName: `${item.displayName} ${next}`,
      aliases: [...new Set([...(item.aliases || []), item.displayName])],
      duplicateGroupName: item.displayName,
    };
  });
}

function buildSearchText(location) {
  return [
    location.displayName,
    location.name,
    location.siteNumber,
    location.category,
    categoryLabels[location.category],
    ...(location.aliases || []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function buildLocations() {
  const destinationItems = DESTINATIONS.map((destination, index) => {
    const displayName = friendlyName(destination.name);
    return {
      ...destination,
      id: `poi-${index}`,
      category: destination.category || 'poi',
      siteNumber: null,
      displayName,
      aliases: aliasesFor(displayName, destination.name),
    };
  });

  const campsiteItems = Object.entries(CAMPSITES).map(([siteNumber, site]) => {
    const displayName = siteNumber === '125' ? 'Back to the Cabin at 125' : (site.name || `Site ${siteNumber}`);
    return {
      ...site,
      id: `site-${siteNumber}`,
      category: 'campsite',
      siteNumber,
      displayName,
      aliases: siteNumber === '125' ? commonAliases['Back to the Cabin at 125'] : [`Site ${siteNumber}`, siteNumber],
    };
  });

  return makeDuplicateSafeNames([...campsiteItems, ...destinationItems])
    .map((location) => ({ ...location, searchText: buildSearchText(location) }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { numeric: true }));
}

function dedupeMatches(matches) {
  const seen = new Set();
  return matches.filter((location) => {
    const key = `${normalizeName(location.displayName)}|${Number(location.lat).toFixed(7)}|${Number(location.lng).toFixed(7)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function searchLocations(query) {
  const raw = String(query || '').trim();
  if (!raw) return [];

  const normalized = normalize(raw);
  const lower = raw.toLowerCase();

  const exactSite = locations.find((location) =>
    location.category === 'campsite' && String(location.siteNumber ?? '').toUpperCase() === normalized
  );

  const exactNameOrAlias = locations.find((location) => {
    if (location.id === exactSite?.id) return false;
    const names = [location.displayName, location.name, ...(location.aliases || [])].map(normalizeName);
    return names.includes(normalizeName(raw));
  });

  const starts = locations.filter((location) => {
    if (location.id === exactSite?.id || location.id === exactNameOrAlias?.id) return false;
    return [location.displayName, location.name, ...(location.aliases || [])]
      .filter(Boolean)
      .some((value) => value.toLowerCase().startsWith(lower)) || String(location.siteNumber ?? '').toLowerCase().startsWith(lower);
  });

  const contains = locations.filter((location) => {
    if (location.id === exactSite?.id || location.id === exactNameOrAlias?.id) return false;
    if (starts.some((item) => item.id === location.id)) return false;
    return location.searchText.includes(lower);
  });

  return dedupeMatches([exactSite, exactNameOrAlias, ...starts, ...contains].filter(Boolean)).slice(0, 8);
}

function renderDefault() {
  els.results.innerHTML = '';
  els.summary.textContent = 'Start with a site number, destination name, or alias.';
}

function renderResults(matches, query) {
  els.results.innerHTML = '';

  if (!query.trim()) {
    renderDefault();
    return;
  }

  if (!matches.length) {
    els.summary.textContent = `No match for “${query.trim()}”.`;
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Try a site number like 125, an alias like Ft. Dix, The Afters, Grove, BodyShop, bathroom, or pool.';
    els.results.append(empty);
    return;
  }

  els.summary.textContent = matches.length === 1 ? 'One match. Tap Go when ready.' : `${matches.length} distinct matches. Pick one, then Go.`;
  matches.forEach((location) => els.results.append(createResultCard(location)));
}

function createResultCard(location) {
  const card = document.createElement('article');
  card.className = 'result-card';

  const type = categoryLabels[location.category] || location.category;
  const confidence = location.estimated ? `Estimated${location.confidence ? ` · ${location.confidence}` : ''}` : 'Known pin';
  const aliasNote = location.duplicateGroupName ? `Also listed as ${location.duplicateGroupName}. ` : '';
  const note = location.note || (boringMode
    ? `${aliasNote}${type} · ${confidence}`
    : `${aliasNote}${type} · ${confidence}. Consent, kindness, and camp rules, babe.`);

  card.innerHTML = `
    <div class="result-main">
      <p class="result-kicker">${escapeHtml(type)}</p>
      <h2 class="result-title">${escapeHtml(location.displayName)}</h2>
      <p class="result-note">${escapeHtml(note)}</p>
    </div>
    <div class="result-actions">
      <button class="copy-button" type="button">Copy</button>
      <button class="go-button" type="button">Go</button>
    </div>
  `;

  card.querySelector('.go-button').addEventListener('click', () => openInMaps(location));
  card.querySelector('.copy-button').addEventListener('click', () => copyLocation(location));
  return card;
}

function latLng(location) {
  const lat = Number(location.lat).toFixed(7);
  const lng = Number(location.lng).toFixed(7);
  return { lat, lng };
}

function openInMaps(location) {
  const { lat, lng } = latLng(location);
  const label = encodeURIComponent(location.displayName);
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);

  toast(`Opening ${location.displayName}…`);

  if (isAndroid) {
    window.location.href = `geo:0,0?q=${lat},${lng}(${label})`;
    return;
  }

  if (isIOS) {
    window.location.href = `https://maps.apple.com/?q=${label}&ll=${lat},${lng}`;
    return;
  }

  window.location.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

async function copyLocation(location) {
  const { lat, lng } = latLng(location);
  const text = `${location.displayName}: ${lat}, ${lng}`;
  try {
    await navigator.clipboard.writeText(text);
    toast('Pin copied.');
  } catch {
    toast(text);
  }
}

function toast(message) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('is-visible'), 2200);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));
}

function distanceFeet(a, b) {
  const earthRadiusFeet = 20902231;
  const toRad = (degrees) => degrees * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusFeet * Math.asin(Math.sqrt(h));
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not available in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    });
  });
}

async function showClosestBathroom() {
  els.summary.textContent = 'Finding the closest bathroom…';
  els.results.innerHTML = '';

  try {
    const position = await getCurrentPosition();
    const here = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };

    const nearest = bathhouses
      .map((bathhouse) => ({ ...bathhouse, distanceFeet: distanceFeet(here, bathhouse) }))
      .sort((a, b) => a.distanceFeet - b.distanceFeet)[0];

    const location = {
      id: `nearest-bathhouse-${nearest.name.toLowerCase()}`,
      name: nearest.name,
      displayName: `Closest bathroom: ${nearest.name}`,
      lat: nearest.lat,
      lng: nearest.lng,
      category: 'bathhouse',
      sourceGeometry: 'Nearest bathhouse from updated KML',
      estimated: false,
      aliases: ['bathroom', 'restroom', 'bathhouse', 'shower', 'comfort station'],
      note: `About ${Math.round(nearest.distanceFeet)} feet away from your current location.`,
    };

    els.input.value = 'Closest bathroom';
    renderResults([location], location.displayName);
  } catch {
    els.summary.textContent = 'I need location permission to find the closest bathroom.';
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Turn on location permission for this site, or search bathhouse, bathroom, restroom, shower, or comfort station and pick one manually.';
    els.results.append(empty);
  }
}

els.form.addEventListener('submit', (event) => {
  event.preventDefault();
  renderResults(searchLocations(els.input.value), els.input.value);
});

els.input.addEventListener('input', () => {
  renderResults(searchLocations(els.input.value), els.input.value);
});

els.clear.addEventListener('click', () => {
  els.input.value = '';
  els.input.focus();
  renderDefault();
});

document.querySelectorAll('[data-query], [data-shortcut]').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.shortcut === 'closestBathroom') {
      showClosestBathroom();
      return;
    }

    const shortcut = button.dataset.shortcut ? shortcutDestinations[button.dataset.shortcut] : null;

    if (shortcut) {
      els.input.value = shortcut.displayName;
      renderResults([shortcut], shortcut.displayName);
      els.input.focus();
      return;
    }

    els.input.value = button.dataset.query;
    renderResults(searchLocations(els.input.value), els.input.value);
    els.input.focus();
  });
});

els.paperMapButton.addEventListener('click', () => { els.paperOverlay.hidden = false; });
els.paperCloseButton.addEventListener('click', () => { els.paperOverlay.hidden = true; });
els.paperOverlay.addEventListener('click', (event) => {
  if (event.target === els.paperOverlay) els.paperOverlay.hidden = true;
});

els.discreetButton.addEventListener('click', () => {
  boringMode = !boringMode;
  writeBoringMode();
  applyMode();
  renderResults(searchLocations(els.input.value), els.input.value);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') els.paperOverlay.hidden = true;
});