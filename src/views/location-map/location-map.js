/**
 * FlexNet location map view.
 * Pure markup/helpers separated from Leaflet side effects.
 */

import { escapeHtml } from '../../utilities/escapeHtml.js';
import { loadScript, loadStylesheet } from '../../utilities/loadCdnAsset.js';
import SiteConfig from '../../core/site-config.js';

const MAP_HOST_SELECTOR = '[data-contact-map]';
const LIST_HOST_SELECTOR = '[data-map-location-list]';
const INVALIDATE_DELAYS_MS = Object.freeze([0, 120, 320]);

const runtime = Object.seal({
  mapInstance: null,
  observer: null,
  activeHost: null,
  loadGeneration: 0,
  leafletModulePromise: null,
  leafletStylesheetPromise: null
});

/**
 * @pure
 * @param {Object} location
 * @returns {String}
 */
const createLocationListItemMarkup = (location) => `
  <article class="c-location-map__location c-location-map__location--${escapeHtml(location.type)}">
    <p class="c-location-map__location-label">${escapeHtml(location.label)}</p>
    <h3 class="c-location-map__location-title">${escapeHtml(location.title)}</h3>
    <p class="c-location-map__location-address">${escapeHtml(location.address)}</p>
    <p class="c-location-map__location-note">${escapeHtml(location.note)}</p>
    <a class="c-location-map__location-link" href="${escapeHtml(location.mapUrl)}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
  </article>
`;

/**
 * @pure
 * @param {Object} location
 * @returns {String}
 */
const createLocationPopupMarkup = (location) => `
  <strong>${escapeHtml(location.title)}</strong><br>
  ${escapeHtml(location.address)}<br>
  <span>${escapeHtml(location.note)}</span>
`;

/**
 * @pure
 * @param {Array} locations
 * @returns {String}
 */
const createLocationListMarkup = (locations) => (
  locations.map(createLocationListItemMarkup).join('')
);

/**
 * @pure
 * @param {Object} location
 * @param {Function} DivIcon
 * @returns {Object}
 */
const createLocationMarkerIcon = (location, DivIcon) => {
  const markerType = location.type === 'hotel' ? 'hotel' : 'event';

  return new DivIcon({
    className: `c-location-map__marker c-location-map__marker--${markerType}`,
    html: `<span>${markerType === 'event' ? 'E' : 'H'}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
  });
};

/**
 * @pure
 * @param {Object} mapConfig
 * @param {String} routePath
 * @returns {Boolean}
 */
const shouldRenderLocationMap = (mapConfig, routePath) => (
  Boolean(mapConfig?.locations?.length && routePath === (mapConfig.contactRoute || '/contact'))
);

/**
 * @effect
 * @param {HTMLElement} host
 * @param {String} state
 * @returns {void}
 */
const setMapHostState = (host, state) => {
  host.dataset.mapState = state;
  host.classList.toggle('c-location-map__canvas--loading', state === 'loading');
  host.classList.toggle('c-location-map__canvas--ready', state === 'ready');
  host.classList.toggle('c-location-map__canvas--error', state === 'error');
};

/**
 * @effect
 * @param {HTMLElement} host
 * @returns {void}
 */
const renderMapLoadingState = (host) => {
  host.innerHTML = '<p class="c-location-map__status">Loading map…</p>';
  setMapHostState(host, 'loading');
};

/**
 * @effect
 * @param {HTMLElement} host
 * @returns {void}
 */
const renderMapFallback = (host) => {
  host.innerHTML = '<p class="c-location-map__fallback">Map unavailable. Please use the location list.</p>';
  setMapHostState(host, 'error');
};

/**
 * @effect
 * @returns {void}
 */
const ensureMapResourceHints = () => {
  if (document.head.querySelector('[data-map-resource-hint]')) {
    return;
  }

  ['https://unpkg.com', 'https://cdn.jsdelivr.net', 'https://tile.openstreetmap.org'].forEach((href) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    link.crossOrigin = '';
    link.setAttribute('data-map-resource-hint', '');
    document.head.appendChild(link);
  });
};

/**
 * @effect
 * @param {Object} mapConfig
 * @returns {Promise<Object>}
 */
const loadLeafletAssets = async (mapConfig) => {
  ensureMapResourceHints();

  const primaryScript = mapConfig.moduleUrl;
  const primaryStylesheet = mapConfig.stylesheetUrl;
  const fallbackScript = mapConfig.fallbackModuleUrl;
  const fallbackStylesheet = mapConfig.fallbackStylesheetUrl;
  const leafletReady = () => (window.L?.Map ? window.L : null);

  runtime.leafletStylesheetPromise ||= loadStylesheet({
    href: primaryStylesheet,
    integrity: mapConfig.stylesheetIntegrity,
    datasetKey: 'leafletStylesheet'
  }).catch(() => loadStylesheet({
    href: fallbackStylesheet,
    integrity: mapConfig.fallbackStylesheetIntegrity || mapConfig.stylesheetIntegrity,
    datasetKey: 'leafletStylesheet'
  }));

  runtime.leafletModulePromise ||= (async () => {
    try {
      return await loadScript({
        src: primaryScript,
        integrity: mapConfig.moduleIntegrity,
        datasetKey: 'leafletScript',
        isReady: leafletReady,
        readyLabel: 'Leaflet'
      });
    } catch (primaryError) {
      console.warn('[LocationMap] Primary Leaflet CDN failed, trying fallback.', primaryError);
      return loadScript({
        src: fallbackScript,
        integrity: mapConfig.fallbackModuleIntegrity || mapConfig.moduleIntegrity,
        datasetKey: 'leafletScript',
        isReady: leafletReady,
        readyLabel: 'Leaflet'
      });
    }
  })();

  const [, leaflet] = await Promise.all([
    runtime.leafletStylesheetPromise,
    runtime.leafletModulePromise
  ]);

  return leaflet;
};

/**
 * @effect
 * @param {Object} map
 * @returns {void}
 */
const scheduleMapInvalidation = (map) => {
  INVALIDATE_DELAYS_MS.forEach((delay) => {
    window.setTimeout(() => {
      if (runtime.mapInstance === map) {
        map.invalidateSize({ pan: false });
      }
    }, delay);
  });
};

/**
 * @effect
 * @param {HTMLElement} host
 * @param {Object} mapConfig
 * @param {Object} leaflet
 * @returns {Object}
 */
const mountLeafletMap = (host, mapConfig, L) => {
  host.innerHTML = '';
  setMapHostState(host, 'loading');

  const map = new L.Map(host, {
    scrollWheelZoom: false,
    zoomControl: true,
    preferCanvas: true
  }).setView(mapConfig.center, mapConfig.zoom);

  new L.TileLayer(mapConfig.tileLayer.url, {
    maxZoom: 19,
    attribution: mapConfig.tileLayer.attribution
  }).addTo(map);

  const locationPoints = mapConfig.locations.map((location) => location.coordinates);

  mapConfig.locations.forEach((location) => {
    const marker = new L.Marker(location.coordinates, {
      icon: createLocationMarkerIcon(location, L.divIcon),
      title: location.title
    }).addTo(map);

    marker.bindPopup(new L.Popup({ maxWidth: 260 }).setContent(createLocationPopupMarkup(location)));
  });

  map.fitBounds(locationPoints, {
    padding: [34, 34],
    maxZoom: mapConfig.maxFitZoom
  });

  scheduleMapInvalidation(map);
  setMapHostState(host, 'ready');

  return map;
};

/**
 * @effect
 * @returns {void}
 */
const resetLocationMap = () => {
  runtime.loadGeneration += 1;

  if (runtime.observer) {
    runtime.observer.disconnect();
    runtime.observer = null;
  }

  if (runtime.mapInstance) {
    runtime.mapInstance.remove();
    runtime.mapInstance = null;
  }

  runtime.activeHost = null;
};

/**
 * @effect
 * @param {Object} config
 * @returns {void}
 */
const hydrateLocationList = (config) => {
  const host = document.querySelector(LIST_HOST_SELECTOR);
  const mapConfig = SiteConfig.getLocationMap(config);

  if (!host || !mapConfig?.locations?.length) return;

  host.innerHTML = createLocationListMarkup(mapConfig.locations);
};

/**
 * @effect
 * @param {Object} config
 * @param {HTMLElement} host
 * @returns {Promise<void>}
 */
const activateLocationMap = async (config, host) => {
  const mapConfig = SiteConfig.getLocationMap(config);
  const generation = runtime.loadGeneration;

  if (!mapConfig?.locations?.length || !host.isConnected) return;

  runtime.activeHost = host;
  renderMapLoadingState(host);

  try {
    const leaflet = await loadLeafletAssets(mapConfig);

    if (generation !== runtime.loadGeneration || runtime.activeHost !== host || !host.isConnected) {
      return;
    }

    runtime.mapInstance = mountLeafletMap(host, mapConfig, leaflet);
  } catch (error) {
    if (generation !== runtime.loadGeneration || runtime.activeHost !== host) {
      return;
    }

    renderMapFallback(host);
    console.warn('[LocationMap] Map could not load.', error);
  }
};

/**
 * @effect
 * @param {Object} config
 * @param {HTMLElement} host
 * @returns {void}
 */
const observeLocationMapHost = (config, host) => {
  if (typeof IntersectionObserver !== 'function') {
    activateLocationMap(config, host);
    return;
  }

  runtime.observer = new IntersectionObserver((entries) => {
    const isVisible = entries.some((entry) => entry.isIntersecting);

    if (!isVisible || host.dataset.mapState === 'ready' || host.dataset.mapState === 'loading') {
      return;
    }

    runtime.observer?.disconnect();
    runtime.observer = null;
    activateLocationMap(config, host);
  }, {
    root: null,
    rootMargin: '120px 0px',
    threshold: 0.08
  });

  runtime.observer.observe(host);
};

/**
 * @effect
 * @param {Object} config
 * @param {String} routePath
 * @returns {void}
 */
export const initLocationMap = (config, routePath) => {
  const mapConfig = SiteConfig.getLocationMap(config);

  hydrateLocationList(config);

  if (!shouldRenderLocationMap(mapConfig, routePath)) {
    resetLocationMap();
    return;
  }

  const host = document.querySelector(MAP_HOST_SELECTOR);
  if (!host) return;

  resetLocationMap();
  observeLocationMapHost(config, host);
};
