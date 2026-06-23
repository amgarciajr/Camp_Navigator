import { CAMPSITES, DESTINATIONS, MAP_ANCHOR } from './data.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const els = {
  destinationSelect: $('#destinationSelect'),
  siteInput: $('#siteInput'),
  findSiteButton: $('#findSiteButton'),
  site125Button: $('#site125Button'),
  homeBaseButton: $('#homeBaseButton'),
  showAllButton: $('#showAllButton'),
  filterChips: $('#filterChips'),
  statusMessage: $('#statusMessage'),
  markerLayer: $('#markerLayer'),
  mapViewport: $('#mapViewport'),
  mapStage: $('#mapStage'),
  mapImage: $('#mapImage'),
  zoomOutButton: $('#zoomOutButton'),
  zoomInButton: $('#zoomInButton'),
  resetMapButton: $('#resetMapButton'),
  searchInput: $('#searchInput'),
  clearSearchButton: $('#clearSearchButton'),
  searchResults: $('#searchResults'),
  bottomSheet: $('#bottomSheet'),
  sheetDragHandle: $('#sheetDragHandle'),
  detailSubtitle: $('#detailSubtitle'),
  detailsTitle: $('#details-title'),
  detailBadge: $('#detailBadge'),
  detailName: $('#detailName'),
  detailType: $('#detailType'),
  detailCoords: $('#detailCoords'),
  detailNotes: $('#detailNotes'),
  favoriteButton: $('#favoriteButton'),
  focusButton: $('#focusButton'),
  navigateButton: $('#navigateButton'),
  shareButton: $('#shareButton'),
  copyButton: $('#copyButton'),
  appleMapsButton: $('#appleMapsButton'),
  googleMapsButton: $('#googleMapsButton'),
  favoritesList: $('#favoritesList'),
  recentList: $('#recentList'),
  clearFavoritesButton: $('#clearFavoritesButton'),
  clearRecentButton: $('#clearRecentButton'),
  guestModeToggle: $('#guestModeToggle'),
  offlineStatus: $('#offlineStatus'),
  connectionBadge: $('#connectionBadge'),
  installButton: $('#installButton'),
};

const STORAGE_KEYS = {
  favorites: 'campnav:favorites:v1',
  recent: 'campnav:recent:v1',
  guestMode: 'campnav:guest-mode:v1',
};

const categoryMeta = {
  campsite: { label: 'Campsites', notes: 'Direct campsite destination from the imported KML.', short: 'Site' },
  bathhouse: { label: 'Bathhouse', notes: 'Bathhouse / shower destination.', short: 'Bath' },
  poi: { label: 'Amenity / POI', notes: 'Mapped point of interest inside the resort.', short: 'POI' },
  area: { label: 'Named area', notes: 'Area overlays use centroid coordinates for navigation.', short: 'Area' },
  'road-path': { label: 'Road / path', notes: 'Road and path entries use midpoint coordinates.', short: 'Path' },
  parking: { label: 'Parking', notes: 'Parking area or lot.', short: 'Park' },
};

const categoryOrder = ['campsite', 'bathhouse', 'poi', 'area', 'road-path', 'parking'];
const privateLabelPattern = /(sti|jock|cruis|martini|ft\.?\s*dix|sex|sperm)/i;

const MAP_OVERRIDES = {
  'Site 125': { x: 74.0, y: 31.6 },
  'Dog Park': { x: 88.5, y: 53.5 },
  'Main Office': { x: 39.2, y: 51.7 },
  'The Woods Pool': { x: 41.0, y: 53.4 },
  'The Pavilion': { x: 33.8, y: 83.3 },
  'Fitness Center (Gym)': { x: 35.2, y: 91.0 },
  'Volleyball Courts': { x: 44.7, y: 80.8 },
  'Amphitheatre': { x: 43.2, y: 88.3 },
  'The Bonfire Pit': { x: 41.7, y: 72.0 },
  'Massages': { x: 68.2, y: 48.4 },
  'Barber Shop': { x: 68.2, y: 48.4 },
  'Ft. Dix': { x: 31.8, y: 77.0 },
  'Flamingo Heights': { x: 71.0, y: 18.0 },
  'Overflow A': { x: 49.0, y: 33.5 },
  'Overflow D': { x: 47.8, y: 94.0 },
  'Walnut Loop': { x: 84.0, y: 12.2 },
  'Couples Cabins': { x: 14.0, y: 90.0 },
  'Cabins': { x: 17.5, y: 83.0 },
  'Grove Parking': { x: 27.0, y: 97.0 },
  'Office Parking area': { x: 54.0, y: 53.0 },
  'Perm Parking': { x: 60.5, y: 78.5 },
};

const MAP_PROJECTION = {
  latMin: 40.8954356,
  latMax: 40.8992767,
  lngMin: -75.607706,
  lngMax: -75.6011473,
  xMin: 8,
  xMax: 84,
  yMin: 10,
  yMax: 94,
};

let allLocations = [];
let visibleCategories = new Set(['campsite', 'bathhouse', 'poi']);
let selectedId = null;
let panzoom = null;
let deferredInstallPrompt = null;
let dragStart = null;

const favorites = new Set(readJson(STORAGE_KEYS.favorites, []));
let recent = readJson(STORAGE_KEYS.recent, []);
let guestMode = readJson(STORAGE_KEYS.guestMode, false);

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'item';
}

function normalizeSiteNumber(value) {
  const cleaned = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
  return cleaned
    .replace(/^([A-Z]+)0+(\d)/, '$1$2')
    .replace(/^0+(\d)/, '$1');
}

function projectCoordinates(lat, lng) {
  const { latMin, latMax, lngMin, lngMax, xMin, xMax, yMin, yMax } = MAP_PROJECTION;
  const xRatio = (lng - lngMin) / (lngMax - lngMin);
  const yRatio = (latMax - lat) / (latMax - latMin);
  const x = xMin + xRatio * (xMax - xMin);
  const y = yMin + yRatio * (yMax - yMin);
  return {
    x: Math.min(96, Math.max(4, Number(x.toFixed(2)))),
    y: Math.min(96, Math.max(4, Number(y.toFixed(2)))),
  };
}

function createLocations() {
  const merged = [];
  const nameCounts = new Map();

  DESTINATIONS.forEach((destination, index) => {
    const key = destination.name;
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
    merged.push({
      ...destination,
      id: `${slugify(destination.name)}-${index}`,
      category: destination.category || 'poi',
    });
  });

  Object.entries(CAMPSITES).forEach(([siteNumber, site]) => {
    merged.push({
      ...site,
      id: `site-${siteNumber}`,
      category: 'campsite',
      siteNumber,
    });
  });

  const duplicateRunningCount = new Map();

  return merged.map((location) => {
    const duplicateCount = nameCounts.get(location.name) ?? 0;
    const currentIndex = (duplicateRunningCount.get(location.name) ?? 0) + 1;
    duplicateRunningCount.set(location.name, currentIndex);

    const suffix = location.category !== 'campsite' && duplicateCount > 1 ? ` (${currentIndex})` : '';
    const displayName = location.category === 'campsite' ? location.name : `${location.name}${suffix}`;
    const override = MAP_OVERRIDES[location.name];

    return {
      ...location,
      displayName,
      mapPos: override ?? projectCoordinates(location.lat, location.lng),
      isPrivateLabel: privateLabelPattern.test(location.name),
      searchText: `${displayName} ${location.name} ${location.category} ${categoryMeta[location.category]?.label ?? ''}`.toLowerCase(),
    };
  }).sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { numeric: true }));
}

function visibleLocations() {
  return allLocations.filter((location) => !guestMode || !location.isPrivateLabel);
}

function buildGeoUri(location) {
  const lat = Number(location.lat).toFixed(7);
  const lng = Number(location.lng).toFixed(7);
  return `geo:0,0?q=${lat},${lng}`;
}

function appleMapsUrl(location) {
  const lat = Number(location.lat).toFixed(7);
  const lng = Number(location.lng).toFixed(7);
  return `https://maps.apple.com/?q=${encodeURIComponent(location.displayName)}&ll=${lat},${lng}`;
}

function googleMapsUrl(location) {
  const lat = Number(location.lat).toFixed(7);
  const lng = Number(location.lng).toFixed(7);
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function setStatus(message = '', type = 'info') {
  els.statusMessage.textContent = message;
  els.statusMessage.dataset.type = type;
}

function setSheetState(state) {
  els.bottomSheet.dataset.state = state;
}

function populateSelect() {
  els.destinationSelect.innerHTML = '<option value="">Choose a destination</option>';
  const fragment = document.createDocumentFragment();

  categoryOrder.forEach((category) => {
    const items = visibleLocations().filter((location) => location.category === category);
    if (!items.length) return;

    const group = document.createElement('optgroup');
    group.label = categoryMeta[category]?.label ?? category;

    items.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.displayName;
      group.append(option);
    });

    fragment.append(group);
  });

  els.destinationSelect.append(fragment);
}

function renderFilterChips() {
  els.filterChips.innerHTML = '';
  categoryOrder.forEach((category) => {
    if (!visibleLocations().some((item) => item.category === category)) return;

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `filter-chip${visibleCategories.has(category) ? ' is-active' : ''}`;
    chip.dataset.category = category;
    chip.textContent = categoryMeta[category]?.label ?? category;
    chip.addEventListener('click', () => {
      if (visibleCategories.has(category)) {
        visibleCategories.delete(category);
      } else {
        visibleCategories.add(category);
      }
      if (visibleCategories.size === 0) visibleCategories.add(category);
      renderFilterChips();
      renderMarkers();
    });
    els.filterChips.append(chip);
  });
}

function shortLabel(location) {
  if (location.category === 'campsite') return location.siteNumber ?? location.name.replace(/Site\s+/i, '');
  const pieces = location.displayName.split(/\s+/).filter(Boolean);
  return pieces.length === 1 ? pieces[0].slice(0, 7) : pieces[0];
}

function renderMarkers() {
  els.markerLayer.innerHTML = '';
  const fragment = document.createDocumentFragment();

  visibleLocations()
    .filter((location) => visibleCategories.has(location.category))
    .forEach((location) => {
      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = `marker marker--${location.category}${selectedId === location.id ? ' is-selected' : ''}`;
      marker.style.left = `${location.mapPos.x}%`;
      marker.style.top = `${location.mapPos.y}%`;
      marker.dataset.short = shortLabel(location);
      marker.setAttribute('aria-label', location.displayName);
      marker.title = location.displayName;
      marker.addEventListener('click', () => selectLocation(location.id, { center: true, source: 'marker', sheet: 'mid' }));
      fragment.append(marker);
    });

  els.markerLayer.append(fragment);
}

function getLocationById(id) {
  return allLocations.find((location) => location.id === id) ?? null;
}

function getLocationBySiteNumber(siteNumber) {
  const normalized = normalizeSiteNumber(siteNumber);
  return allLocations.find((location) =>
    location.category === 'campsite' &&
    String(location.siteNumber ?? '').toUpperCase() === normalized
  ) ?? null;
}

function renderDetails(location) {
  const hasLocation = Boolean(location);

  if (!hasLocation) {
    els.detailSubtitle.textContent = 'Select a destination';
    els.detailsTitle.textContent = 'Ready when you are';
    els.detailBadge.textContent = 'Waiting';
    els.detailName.textContent = 'None selected';
    els.detailType.textContent = '—';
    els.detailCoords.textContent = '—';
    els.detailNotes.textContent = 'Tap a marker or search to center the map and open native navigation.';
  } else {
    els.detailSubtitle.textContent = 'Ready to navigate';
    els.detailsTitle.textContent = location.displayName;
    els.detailBadge.textContent = categoryMeta[location.category]?.label ?? location.category;
    els.detailName.textContent = location.displayName;
    els.detailType.textContent = `${categoryMeta[location.category]?.label ?? location.category} · ${location.sourceGeometry ?? 'Mapped point'}`;
    els.detailCoords.textContent = `${Number(location.lat).toFixed(7)}, ${Number(location.lng).toFixed(7)}`;
    els.detailNotes.textContent = categoryMeta[location.category]?.notes ?? 'Mapped destination.';
  }

  [
    els.favoriteButton,
    els.focusButton,
    els.navigateButton,
    els.shareButton,
    els.copyButton,
    els.appleMapsButton,
    els.googleMapsButton,
  ].forEach((button) => { button.disabled = !hasLocation; });

  updateFavoriteButton();
}

function updateFavoriteButton() {
  const isFavorite = selectedId && favorites.has(selectedId);
  els.favoriteButton.textContent = isFavorite ? '★' : '☆';
  els.favoriteButton.classList.toggle('is-favorite', Boolean(isFavorite));
  els.favoriteButton.setAttribute('aria-label', isFavorite ? 'Remove from favorites' : 'Add to favorites');
}

function syncInputs(location) {
  els.destinationSelect.value = location?.id ?? '';
  if (location?.category === 'campsite') {
    els.siteInput.value = location.siteNumber ?? '';
  }
}

function addRecent(id) {
  recent = [id, ...recent.filter((existing) => existing !== id)].slice(0, 8);
  writeJson(STORAGE_KEYS.recent, recent);
  renderSavedLists();
}

function selectLocation(id, options = {}) {
  const location = getLocationById(id);
  if (!location) return;

  selectedId = location.id;
  renderMarkers();
  renderDetails(location);
  syncInputs(location);
  addRecent(location.id);

  els.searchInput.value = '';
  hideSearchResults();

  if (options.center) centerOnLocation(location, options.zoom ?? 1.9);
  if (options.sheet) setSheetState(options.sheet);
  if (options.source !== 'initial') setStatus(`Selected ${location.displayName}.`, 'info');
}

function lookupSite() {
  const siteNumber = normalizeSiteNumber(els.siteInput.value);
  if (!siteNumber) {
    setStatus('Enter a campsite number first.', 'error');
    return;
  }

  const location = getLocationBySiteNumber(siteNumber);
  if (!location || (guestMode && location.isPrivateLabel)) {
    setStatus(`Site/code ${siteNumber} is not in the imported campsite dataset yet.`, 'error');
    return;
  }

  selectLocation(location.id, { center: true, source: 'site', sheet: 'mid' });
}

function getSelectedLocation() {
  return selectedId ? getLocationById(selectedId) : null;
}

function renderSearchResults(query) {
  const cleaned = query.trim().toLowerCase();
  if (!cleaned) {
    hideSearchResults();
    return;
  }

  const matches = visibleLocations()
    .filter((location) => location.searchText.includes(cleaned))
    .slice(0, 8);

  els.searchResults.innerHTML = '';

  if (!matches.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-list';
    empty.textContent = 'No matching destinations.';
    els.searchResults.append(empty);
  } else {
    matches.forEach((location) => {
      els.searchResults.append(createLocationButton(location, 'result-button'));
    });
  }

  els.searchResults.hidden = false;
}

function hideSearchResults() {
  els.searchResults.hidden = true;
  els.searchResults.innerHTML = '';
}

function createLocationButton(location, className = 'list-button') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.innerHTML = `
    <span><strong>${escapeHtml(location.displayName)}</strong><span>${escapeHtml(categoryMeta[location.category]?.label ?? location.category)}</span></span>
    <em>${favorites.has(location.id) ? '★' : '›'}</em>
  `;
  button.addEventListener('click', () => {
    activateTab('destination');
    selectLocation(location.id, { center: true, source: 'list', sheet: 'mid' });
  });
  return button;
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

function renderSavedLists() {
  const favoriteItems = [...favorites].map(getLocationById).filter(Boolean);
  const recentItems = recent.map(getLocationById).filter(Boolean);

  renderList(els.favoritesList, favoriteItems, 'No favorites yet.');
  renderList(els.recentList, recentItems, 'No recent destinations yet.');
}

function renderList(container, items, emptyText) {
  container.classList.toggle('empty-list', items.length === 0);
  container.innerHTML = '';
  if (!items.length) {
    container.textContent = emptyText;
    return;
  }
  items.forEach((location) => container.append(createLocationButton(location, 'list-button')));
}

function activateTab(view) {
  $$('.sheet-tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.view === view));
  $$('.sheet-view').forEach((panel) => panel.classList.toggle('is-active', panel.dataset.viewPanel === view));
}

function centerOnLocation(location, zoom = 1.9) {
  panzoom?.centerOnPercent(location.mapPos.x, location.mapPos.y, zoom);
}

class PanZoomController {
  constructor(viewport, stage, image) {
    this.viewport = viewport;
    this.stage = stage;
    this.image = image;
    this.scale = 1;
    this.x = 0;
    this.y = 0;
    this.minScale = 1;
    this.maxScale = 4.2;
    this.activePointers = new Map();
    this.gesture = null;
    this.bind();
  }

  bind() {
    this.viewport.addEventListener('wheel', (event) => {
      event.preventDefault();
      this.zoomAt(event.deltaY < 0 ? 1.15 : 0.87, event.clientX, event.clientY);
    }, { passive: false });

    this.viewport.addEventListener('pointerdown', (event) => {
      if (event.target.closest('.marker')) return;
      this.viewport.setPointerCapture(event.pointerId);
      this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (this.activePointers.size === 1) {
        this.gesture = {
          type: 'pan',
          startX: event.clientX,
          startY: event.clientY,
          originX: this.x,
          originY: this.y,
        };
      } else if (this.activePointers.size === 2) {
        const [a, b] = [...this.activePointers.values()];
        this.gesture = {
          type: 'pinch',
          startDistance: Math.hypot(b.x - a.x, b.y - a.y),
          startScale: this.scale,
        };
      }
    });

    this.viewport.addEventListener('pointermove', (event) => {
      if (!this.activePointers.has(event.pointerId)) return;
      this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (this.activePointers.size === 1 && this.gesture?.type === 'pan') {
        this.x = this.gesture.originX + (event.clientX - this.gesture.startX);
        this.y = this.gesture.originY + (event.clientY - this.gesture.startY);
        this.clamp();
        this.apply();
      }

      if (this.activePointers.size === 2 && this.gesture?.type === 'pinch') {
        const [a, b] = [...this.activePointers.values()];
        const distance = Math.hypot(b.x - a.x, b.y - a.y);
        const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const targetScale = this.gesture.startScale * (distance / this.gesture.startDistance);
        this.zoomAt(targetScale / this.scale, midpoint.x, midpoint.y);
      }
    });

    const clearPointer = (event) => {
      this.activePointers.delete(event.pointerId);
      if (this.activePointers.size === 1) {
        const [remaining] = this.activePointers.values();
        this.gesture = {
          type: 'pan',
          startX: remaining.x,
          startY: remaining.y,
          originX: this.x,
          originY: this.y,
        };
      } else {
        this.gesture = null;
      }
    };

    this.viewport.addEventListener('pointerup', clearPointer);
    this.viewport.addEventListener('pointercancel', clearPointer);
    window.addEventListener('resize', () => {
      this.clamp();
      this.apply();
    });
  }

  getBaseSize() {
    return {
      width: this.image.clientWidth,
      height: this.image.clientHeight,
    };
  }

  clamp() {
    const viewportRect = this.viewport.getBoundingClientRect();
    const { width, height } = this.getBaseSize();
    const scaledWidth = width * this.scale;
    const scaledHeight = height * this.scale;
    const minX = Math.min(0, viewportRect.width - scaledWidth);
    const minY = Math.min(0, viewportRect.height - scaledHeight);
    this.x = Math.min(0, Math.max(minX, this.x));
    this.y = Math.min(0, Math.max(minY, this.y));
  }

  apply() {
    this.stage.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.scale})`;
  }

  reset() {
    this.scale = 1;
    this.x = 0;
    this.y = 0;
    this.apply();
  }

  zoomBy(factor) {
    const rect = this.viewport.getBoundingClientRect();
    this.zoomAt(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  zoomAt(factor, clientX, clientY) {
    const nextScale = Math.min(this.maxScale, Math.max(this.minScale, this.scale * factor));
    if (nextScale === this.scale) return;

    const viewportRect = this.viewport.getBoundingClientRect();
    const originX = clientX - viewportRect.left;
    const originY = clientY - viewportRect.top;
    const ratio = nextScale / this.scale;

    this.x = originX - (originX - this.x) * ratio;
    this.y = originY - (originY - this.y) * ratio;
    this.scale = nextScale;
    this.clamp();
    this.apply();
  }

  centerOnPercent(xPercent, yPercent, targetScale = 1.9) {
    const viewportRect = this.viewport.getBoundingClientRect();
    const { width, height } = this.getBaseSize();
    this.scale = Math.min(this.maxScale, Math.max(this.minScale, targetScale));
    this.x = viewportRect.width / 2 - width * (xPercent / 100) * this.scale;
    this.y = viewportRect.height / 2 - height * (yPercent / 100) * this.scale;
    this.clamp();
    this.apply();
  }
}

function setupSheetDrag() {
  const states = ['peek', 'mid', 'full'];

  const stateFromDelta = (deltaY) => {
    const current = els.bottomSheet.dataset.state || 'mid';
    const index = states.indexOf(current);
    if (deltaY < -55) return states[Math.min(states.length - 1, index + 1)];
    if (deltaY > 55) return states[Math.max(0, index - 1)];
    return current === 'peek' ? 'mid' : current;
  };

  els.sheetDragHandle.addEventListener('pointerdown', (event) => {
    dragStart = { y: event.clientY };
    els.sheetDragHandle.setPointerCapture(event.pointerId);
  });

  els.sheetDragHandle.addEventListener('pointerup', (event) => {
    if (!dragStart) return;
    setSheetState(stateFromDelta(event.clientY - dragStart.y));
    dragStart = null;
  });

  els.sheetDragHandle.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') setSheetState('full');
    if (event.key === 'ArrowDown') setSheetState('peek');
    if (event.key === 'Enter' || event.key === ' ') setSheetState(els.bottomSheet.dataset.state === 'full' ? 'mid' : 'full');
  });
}

async function copySelectedCoordinates() {
  const location = getSelectedLocation();
  if (!location) return;
  const text = `${location.displayName}: ${Number(location.lat).toFixed(7)}, ${Number(location.lng).toFixed(7)}`;
  await navigator.clipboard?.writeText(text);
  setStatus('Coordinates copied.', 'info');
}

async function shareSelectedLocation() {
  const location = getSelectedLocation();
  if (!location) return;

  const shareText = `${location.displayName}\n${Number(location.lat).toFixed(7)}, ${Number(location.lng).toFixed(7)}\n${googleMapsUrl(location)}`;

  if (navigator.share) {
    await navigator.share({
      title: location.displayName,
      text: shareText,
    });
    setStatus('Destination shared.', 'info');
  } else {
    await navigator.clipboard?.writeText(shareText);
    setStatus('Share is not available here, so I copied the destination instead.', 'info');
  }
}

function updateConnectionBadges() {
  const online = navigator.onLine;
  els.connectionBadge.textContent = online ? 'Online' : 'Offline ready';
  els.offlineStatus.textContent = 'serviceWorker' in navigator ? 'Enabled' : 'Unavailable';
}

function refreshForGuestMode() {
  writeJson(STORAGE_KEYS.guestMode, guestMode);
  populateSelect();
  renderFilterChips();
  renderMarkers();
  renderSearchResults(els.searchInput.value);
  if (selectedId) {
    const selected = getLocationById(selectedId);
    if (guestMode && selected?.isPrivateLabel) {
      selectedId = null;
      renderDetails(null);
      setStatus('Guest-safe labels are hidden.', 'info');
    }
  }
}

function attachEvents() {
  els.destinationSelect.addEventListener('change', () => {
    if (!els.destinationSelect.value) return;
    activateTab('destination');
    selectLocation(els.destinationSelect.value, { center: true, source: 'select', sheet: 'mid' });
  });

  els.findSiteButton.addEventListener('click', lookupSite);
  els.siteInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      lookupSite();
    }
  });

  [els.site125Button, els.homeBaseButton].forEach((button) => {
    button.addEventListener('click', () => {
      els.siteInput.value = '125';
      activateTab('destination');
      lookupSite();
    });
  });

  els.showAllButton.addEventListener('click', () => {
    categoryOrder.forEach((category) => visibleCategories.add(category));
    renderFilterChips();
    renderMarkers();
    setStatus('All map layers are visible.', 'info');
  });

  els.searchInput.addEventListener('input', () => renderSearchResults(els.searchInput.value));
  els.clearSearchButton.addEventListener('click', () => {
    els.searchInput.value = '';
    hideSearchResults();
    els.searchInput.focus();
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.search-panel')) hideSearchResults();
  });

  els.zoomInButton.addEventListener('click', () => panzoom?.zoomBy(1.2));
  els.zoomOutButton.addEventListener('click', () => panzoom?.zoomBy(0.84));
  els.resetMapButton.addEventListener('click', () => {
    panzoom?.reset();
    setSheetState('mid');
    setStatus('Map reset.', 'info');
  });

  els.focusButton.addEventListener('click', () => {
    const location = getSelectedLocation();
    if (!location) return;
    centerOnLocation(location);
    setStatus(`Centered on ${location.displayName}.`, 'info');
  });

  els.navigateButton.addEventListener('click', () => {
    const location = getSelectedLocation();
    if (!location) return;
    setStatus(`Opening ${location.displayName} in your maps app…`, 'info');
    window.location.href = buildGeoUri(location);
  });

  els.appleMapsButton.addEventListener('click', () => {
    const location = getSelectedLocation();
    if (location) window.location.href = appleMapsUrl(location);
  });

  els.googleMapsButton.addEventListener('click', () => {
    const location = getSelectedLocation();
    if (location) window.location.href = googleMapsUrl(location);
  });

  els.copyButton.addEventListener('click', () => {
    copySelectedCoordinates().catch(() => setStatus('Could not copy coordinates in this browser.', 'error'));
  });

  els.shareButton.addEventListener('click', () => {
    shareSelectedLocation().catch(() => setStatus('Could not share this destination.', 'error'));
  });

  els.favoriteButton.addEventListener('click', () => {
    if (!selectedId) return;
    if (favorites.has(selectedId)) {
      favorites.delete(selectedId);
      setStatus('Removed from favorites.', 'info');
    } else {
      favorites.add(selectedId);
      setStatus('Added to favorites.', 'info');
    }
    writeJson(STORAGE_KEYS.favorites, [...favorites]);
    updateFavoriteButton();
    renderSavedLists();
  });

  els.clearFavoritesButton.addEventListener('click', () => {
    favorites.clear();
    writeJson(STORAGE_KEYS.favorites, []);
    renderSavedLists();
    updateFavoriteButton();
    setStatus('Favorites cleared.', 'info');
  });

  els.clearRecentButton.addEventListener('click', () => {
    recent = [];
    writeJson(STORAGE_KEYS.recent, recent);
    renderSavedLists();
    setStatus('Recent destinations cleared.', 'info');
  });

  els.guestModeToggle.addEventListener('change', () => {
    guestMode = els.guestModeToggle.checked;
    refreshForGuestMode();
  });

  $$('.sheet-tab').forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.view));
  });

  window.addEventListener('online', updateConnectionBadges);
  window.addEventListener('offline', updateConnectionBadges);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    els.installButton.hidden = false;
  });

  els.installButton.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    els.installButton.hidden = true;
  });
}

async function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('./service-worker.js');
    els.offlineStatus.textContent = 'Enabled';
  } catch {
    els.offlineStatus.textContent = 'Unavailable';
  }
}

function init() {
  allLocations = createLocations();
  els.guestModeToggle.checked = guestMode;

  populateSelect();
  renderFilterChips();
  renderMarkers();
  renderDetails(null);
  renderSavedLists();
  attachEvents();
  setupSheetDrag();
  updateConnectionBadges();
  setupServiceWorker();

  const ready = () => {
    panzoom = new PanZoomController(els.mapViewport, els.mapStage, els.mapImage);
    panzoom.reset();
  };

  if (els.mapImage.complete) ready();
  else els.mapImage.addEventListener('load', ready, { once: true });

  setStatus(`Loaded ${DESTINATIONS.length} destinations and ${Object.keys(CAMPSITES).length} campsite record.`, 'info');

  window.CampgroundNavigator = {
    anchor: MAP_ANCHOR,
    destinations: allLocations,
    buildGeoUri,
    appleMapsUrl,
    googleMapsUrl,
  };
}

init();
