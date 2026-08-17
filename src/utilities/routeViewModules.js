/**
 * Lazy route view modules. Parsed only when a route needs them, then cached
 * so cleanup handlers still run after the visitor leaves that page.
 */

const moduleCache = Object.seal({
  locationMap: null,
  registration: null,
  sponsorship: null,
  liveScoring: null
});

/**
 * @effect
 * @param {String} key
 * @param {Function} loader
 * @returns {Promise<Object>}
 */
const loadModule = (key, loader) => {
  if (!moduleCache[key]) {
    moduleCache[key] = loader();
  }

  return moduleCache[key];
};

/**
 * @effect
 * @param {Object} config
 * @param {String} path
 * @returns {Promise<void>}
 */
export const hydrateRouteViews = async (config, path) => {
  const normalizedPath = String(path || '');

  if (normalizedPath === '/contact') {
    const { initLocationMap } = await loadModule(
      'locationMap',
      () => import('../views/location-map/location-map.js')
    );
    initLocationMap(config, normalizedPath);
  } else if (moduleCache.locationMap) {
    const { initLocationMap } = await moduleCache.locationMap;
    initLocationMap(config, normalizedPath);
  }

  if (normalizedPath === '/register' || normalizedPath.startsWith('/register')) {
    const { initRegistrationForm } = await loadModule(
      'registration',
      () => import('../views/registration-invoice/registration-invoice.js')
    );
    initRegistrationForm(config, normalizedPath);
  } else if (moduleCache.registration) {
    const { initRegistrationForm } = await moduleCache.registration;
    initRegistrationForm(config, normalizedPath);
  }

  if (normalizedPath === '/sponsorship') {
    const { initSponsorshipShowcase } = await loadModule(
      'sponsorship',
      () => import('../views/sponsorship-showcase/sponsorship-showcase.js')
    );
    initSponsorshipShowcase(config, normalizedPath);
  } else if (moduleCache.sponsorship) {
    const { initSponsorshipShowcase } = await moduleCache.sponsorship;
    initSponsorshipShowcase(config, normalizedPath);
  }

  if (normalizedPath === '/live-scoring') {
    const { initLiveScoring } = await loadModule(
      'liveScoring',
      () => import('../views/live-scoring/live-scoring.js')
    );
    initLiveScoring(config, normalizedPath);
  } else if (moduleCache.liveScoring) {
    const { initLiveScoring } = await moduleCache.liveScoring;
    initLiveScoring(config, normalizedPath);
  }
};
