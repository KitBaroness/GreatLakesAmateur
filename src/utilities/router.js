/**
 * FlexNet-style hash router.
 * Browser-native only: fetch, DOMParser, CustomEvent, history/hash APIs.
 */

import SiteConfig from '../core/site-config.js';

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
const normalizePath = (path) => {
  const raw = String(path || '').trim();
  const withoutHash = raw.startsWith('#') ? raw.slice(1) : raw;
  const pathOnly = withoutHash.split('?')[0].split('#')[0];
  const withSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  return withSlash.length > 1 && withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash;
};

/**
 * @effect
 * @returns {String}
 */
export const getPathFromHash = () => normalizePath(window.location.hash ? window.location.hash.slice(1) : '/');

/**
 * @pure
 * @param {String} html
 * @returns {String}
 */
const extractPageContent = (html) => {
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

  const response = await fetch(`${view}?v=${encodeURIComponent(version)}`);

  if (!response.ok) {
    throw new Error(`Unable to load view: ${view} (${response.status})`);
  }

  return templateCache.set(cacheKey, await response.text());
};

/**
 * @effect
 * @param {String} selector
 * @param {String} value
 * @returns {void}
 */
const setMetaContent = (selector, value) => {
  const tag = value ? document.head.querySelector(selector) : null;

  if (tag) {
    tag.setAttribute('content', value);
  }
};

/**
 * Deep link for the current route. The canonical tag stays on the site root
 * because crawlers discard the fragment, so every route resolves to one URL.
 *
 * @pure
 * @param {String} siteUrl
 * @param {String} path
 * @returns {String}
 */
const buildShareUrl = (siteUrl, path) => {
  const base = String(siteUrl || '').replace(/\/+$/, '');

  if (!base) {
    return '';
  }

  const isRoot = !path || path === '/' || path === '/home';

  return isRoot ? `${base}/` : `${base}/#${path}`;
};

/**
 * @effect
 * @param {Object} route
 * @param {Object} seo
 * @returns {void}
 */
const applyMetadata = (route, seo = {}) => {
  const title = route.title || seo.siteName || 'Michigan Players Golf Club';

  document.title = title;

  setMetaContent('meta[name="description"]', route.description);
  setMetaContent('meta[property="og:title"]', title);
  setMetaContent('meta[property="og:description"]', route.description);
  setMetaContent('meta[property="og:url"]', buildShareUrl(seo.siteUrl, route.path));
  setMetaContent('meta[name="twitter:title"]', title);
  setMetaContent('meta[name="twitter:description"]', route.description);
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

const HOME_PATHS = Object.freeze(['/', '/home']);
const PREFETCH_PATHS = Object.freeze(['/event-details', '/register']);

/**
 * @pure
 * @param {String} path
 * @returns {Boolean}
 */
const isHomePath = (path) => HOME_PATHS.includes(normalizePath(path));

/**
 * @effect
 * @param {String} path
 * @returns {void}
 */
const syncHomeHeroPreload = (path) => {
  const selector = 'link[data-home-hero-preload]';
  const existing = document.head.querySelector(selector);

  if (!isHomePath(path)) {
    existing?.remove();
    return;
  }

  if (existing) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = 'assets/images/hero-430.avif';
  link.type = 'image/avif';
  link.setAttribute('imagesrcset', 'assets/images/hero-430.avif 430w, assets/images/hero.avif 860w');
  link.setAttribute('imagesizes', '(max-width: 768px) 322px, 430px');
  link.fetchPriority = 'high';
  link.setAttribute('data-home-hero-preload', '');
  document.head.appendChild(link);
};

/**
 * @effect
 * @param {Array} routes
 * @param {String} version
 * @param {String} currentPath
 * @returns {void}
 */
const prefetchLikelyViews = (routes, version, currentPath) => {
  if (!isHomePath(currentPath) || typeof window.requestIdleCallback !== 'function') {
    return;
  }

  window.requestIdleCallback(() => {
    PREFETCH_PATHS.forEach((path) => {
      if (path === normalizePath(currentPath)) {
        return;
      }

      const route = findRoute(routes, path);
      if (!route?.view || document.head.querySelector(`link[data-view-prefetch="${path}"]`)) {
        return;
      }

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = `${route.view}?v=${encodeURIComponent(version)}`;
      link.setAttribute('data-view-prefetch', path);
      document.head.appendChild(link);
    });
  }, { timeout: 2500 });
};

/**
 * @effect
 * @param {Object} config
 * @param {Object} options
 * @returns {Object}
 */
export const createRouter = (config, options = {}) => {
  const containerId = options.containerId || 'content-placeholder';
  const routes = SiteConfig.buildRoutes(config);
  const defaultRoute = SiteConfig.getDefaultRoute(config);

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
      if (contentHost.dataset.shellRoute === resolvedPath) {
        delete contentHost.dataset.shellRoute;

        requestAnimationFrame(() => {
          applyMetadata(resolvedRoute, config.seo);
          syncHomeHeroPreload(resolvedPath);
          prefetchLikelyViews(routes, config.version, resolvedPath);
          document.getElementById('app')?.focus({ preventScroll: true });
          emitRouteChange({
            path: resolvedPath,
            label: resolvedRoute.label,
            timestamp: Date.now()
          });
        });
        return;
      }

      const rawTemplate = await loadTemplate(resolvedRoute.view, config.version);
      const pageMarkup = extractPageContent(rawTemplate);

      requestAnimationFrame(() => {
        contentHost.innerHTML = pageMarkup;
        applyMetadata(resolvedRoute, config.seo);
        syncHomeHeroPreload(resolvedPath);
        prefetchLikelyViews(routes, config.version, resolvedPath);
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
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('sms:')) {
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
