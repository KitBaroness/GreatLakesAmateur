/**
 * FlexNet-style hash router.
 * Browser-native only: fetch, DOMParser, CustomEvent, history/hash APIs.
 */

const createTemplateCache = () => {
  const cache = new Map();

  return Object.freeze({
    get: (key) => cache.get(key) || null,
    set: (key, value) => {
      cache.set(key, Object.freeze(value));
      return value;
    },
    size: () => cache.size,
    clear: () => cache.clear()
  });
};

const templateCache = createTemplateCache();

/**
 * @pure
 * @param {String} path
 * @returns {String}
 */
export const normalizePath = (path) => {
  const raw = String(path || '').trim();
  const withoutHash = raw.startsWith('#') ? raw.slice(1) : raw;
  const withSlash = withoutHash.startsWith('/') ? withoutHash : `/${withoutHash}`;
  return withSlash.length > 1 && withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash;
};

/**
 * @pure
 * @returns {String}
 */
export const getPathFromHash = () => normalizePath(window.location.hash ? window.location.hash.slice(1) : '/');

/**
 * @pure
 * @param {String} html
 * @returns {String}
 */
export const extractPageContent = (html) => {
  const parser = new DOMParser();
  const documentFragment = parser.parseFromString(html, 'text/html');
  const pageContent = documentFragment.getElementById('page-content');

  return pageContent ? pageContent.innerHTML : html;
};

/**
 * @effect
 * @param {String} view
 * @param {String} version
 * @returns {Promise<String>}
 */
const loadTemplate = async (view, version) => {
  const cacheKey = `${view}?v=${version}`;
  const cached = templateCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await fetch(view);

  if (!response.ok) {
    throw new Error(`Unable to load view: ${view} (${response.status})`);
  }

  return templateCache.set(cacheKey, await response.text());
};

/**
 * @effect
 * @param {Object} route
 * @returns {void}
 */
const applyMetadata = (route) => {
  document.title = route.title || 'Michigan Players Golf Club';

  const description = document.querySelector('meta[name="description"]');
  if (description && route.description) {
    description.setAttribute('content', route.description);
  }
};

/**
 * @effect
 * @param {Object} detail
 * @returns {void}
 */
const emitRouteChange = (detail) => {
  window.dispatchEvent(new CustomEvent('routechange', {
    detail: Object.freeze(detail)
  }));
};

/**
 * @pure
 * @param {Array} routes
 * @param {String} path
 * @returns {Object|null}
 */
const findRoute = (routes, path) => routes.find((route) => route.path === path) || null;

/**
 * @effect
 * @param {Object} config
 * @param {Object} options
 * @returns {Object}
 */
export const createRouter = (config, options = {}) => {
  const containerId = options.containerId || 'content-placeholder';
  const routes = window.FlexNetSiteConfig.buildRoutes(config);
  const defaultRoute = window.FlexNetSiteConfig.getDefaultRoute(config);

  const navigate = async (path, shouldUpdateHash = true) => {
    const requestedPath = normalizePath(path);
    const route = findRoute(routes, requestedPath) || findRoute(routes, defaultRoute);
    const resolvedPath = route.redirect || route.path;
    const resolvedRoute = route.redirect ? findRoute(routes, resolvedPath) : route;
    const contentHost = document.getElementById(containerId);

    if (!contentHost || !resolvedRoute) {
      return;
    }

    if (shouldUpdateHash && window.location.hash !== `#${resolvedPath}`) {
      window.location.hash = resolvedPath;
      return;
    }

    try {
      const rawTemplate = await loadTemplate(resolvedRoute.view, config.version);
      const pageMarkup = extractPageContent(rawTemplate);

      requestAnimationFrame(() => {
        contentHost.innerHTML = pageMarkup;
        applyMetadata(resolvedRoute);
        document.getElementById('app')?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
        emitRouteChange({
          path: resolvedPath,
          label: resolvedRoute.label,
          timestamp: Date.now()
        });
      });
    } catch (error) {
      contentHost.innerHTML = `
        <section class="c-page-header">
          <h1 class="c-page-header__title">Page unavailable</h1>
        </section>
        <section class="c-content">
          <p>That page could not be loaded.</p>
        </section>
      `;
      console.error(error);
    }
  };

  const handleHashChange = () => navigate(getPathFromHash(), false);

  const handleDocumentClick = (event) => {
    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    if (href.startsWith('#/')) {
      event.preventDefault();
      navigate(href.slice(1), true);
    }
  };

  document.addEventListener('click', handleDocumentClick);
  window.addEventListener('hashchange', handleHashChange);
  navigate(getPathFromHash(), false);

  return Object.freeze({
    navigate,
    getRoutes: () => routes,
    getCacheSize: () => templateCache.size()
  });
};
