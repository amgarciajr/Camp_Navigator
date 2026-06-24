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

const shortcutDestinations = {
  groveParking: {
    id: 'shortcut-grove-parking',
    name: 'Grove Parking',
    displayName: 'Grove Parking',
    lat: 40.8975516,
    lng: -75.6016636,
    category: 'parking',
    siteNumber: null,
    sourceGeometry: 'Polygon centroid from updated KML',
    estimated: false,
    searchText: 'grove parking parking lot area',
  },
};

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

function buildLocations() {
  const destinationItems = DESTINATIONS.map((destination, index) => ({
    ...destination,
    id: `poi-${index}`,
    category: destination.category || 'poi',
    siteNumber: null,
    displayName: destination.name,
  }));

  const campsiteItems = Object.entries(CAMPSITES).map(([siteNumber, site]) => ({
    ...site,
    id: `site-${siteNumber}`,
    category: 'campsite',
    siteNumber,
    displayName: site.name || `Site ${siteNumber}`,
  }));

  return [...campsiteItems, ...destinationItems].map((location) => ({
    ...location,
    searchText: [
      location.displayName,
      location.name,
      location.siteNumber,
      location.category,
      categoryLabels[location.category],
    ].filter(Boolean).join(' ').toLowerCase(),
  })).sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { numeric: true }));
}

function searchLocations(query) {
  const raw = String(query || '').trim();
  if (!raw) return [];

  const normalized = normalize(raw);
  const lower = raw.toLowerCase();

  const exactSite = locations.find((location) =>
    location.category === 'campsite' && String(location.siteNumber ?? '').toUpperCase() === normalized
  );

  const starts = locations.filter((location) => {
    if (location.id === exactSite?.id) return false;
    return location.displayName.toLowerCase().startsWith(lower) || String(location.siteNumber ?? '').toLowerCase().startsWith(lower);
  });

  const contains = locations.filter((location) => {
    if (location.id === exactSite?.id) return false;
    if (starts.some((item) => item.id === location.id)) return false;
    return location.searchText.includes(lower);
  });

  return [exactSite, ...starts, ...contains].filter(Boolean).slice(0, 8);
}

function renderDefault() {
  els.results.innerHTML = '';
  els.summary.textContent = 'Start with a site number or destination name.';
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
    empty.textContent = 'Try a site number like 36, G12, F26, or a place like bathhouse, parking, pool, or pavilion.';
    els.results.append(empty);
    return;
  }

  els.summary.textContent = matches.length === 1 ? 'One match. Tap Go when ready.' : `${matches.length} matches. Pick one, then Go.`;
  matches.forEach((location) => els.results.append(createResultCard(location)));
}

function createResultCard(location) {
  const card = document.createElement('article');
  card.className = 'result-card';

  const type = categoryLabels[location.category] || location.category;
  const confidence = location.estimated ? `Estimated${location.confidence ? ` · ${location.confidence}` : ''}` : 'Known pin';
  const note = boringMode
    ? `${type} · ${confidence}`
    : `${type} · ${confidence}. Use it however the evening unfolds.`;

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