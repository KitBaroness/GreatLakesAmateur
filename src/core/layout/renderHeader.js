/**
 * Header renderer.
 * Pure HTML generation is separate from the DOM write performed by renderHeader.
 */

import { escapeHtml } from '../../utilities/escapeHtml.js';
import SiteConfig from '../site-config.js';

const toHash = (route) => `#${route}`;

/**
 * @pure
 * @param {String} baseClass
 * @param {String} activeClass
 * @param {String} route
 * @param {String} currentPath
 * @returns {String}
 */
const linkClass = (baseClass, activeClass, route, currentPath) => (
  route === currentPath ? `${baseClass} ${activeClass}` : baseClass
);

const ariaCurrent = (route, currentPath) => (
  route === currentPath ? ' aria-current="page"' : ''
);

const ctaClass = (variant) => (
  variant === 'primary'
    ? 'c-button c-button--primary'
    : 'c-button c-button--secondary'
);

/**
 * @pure
 * @param {String} currentPath
 * @param {Object} config
 * @returns {String}
 */
const resolveCurrentPath = (currentPath, config) => (
  !currentPath || currentPath === '/'
    ? SiteConfig.getDefaultRoute(config)
    : currentPath
);

/**
 * @pure
 * @param {Object} config
 * @param {String} currentPath
 * @returns {String}
 */
const createHeaderMarkup = (config, currentPath) => {
  const activePath = resolveCurrentPath(currentPath, config);
  const brand = SiteConfig.getBrand(config);
  const navItems = SiteConfig.getNavigation(config)
    .filter((item) => item.route !== brand.homeRoute);
  const actions = SiteConfig.getCallsToAction(config);

  const navMarkup = navItems.map((item) => `
        <a class="${linkClass('c-site-header__link', 'c-site-header__link--active', item.route, activePath)}" href="${toHash(item.route)}"${ariaCurrent(item.route, activePath)}>${escapeHtml(item.label)}</a>
      `.trim()).join('');

  const actionMarkup = actions.map((action) => `
        <a class="${ctaClass(action.variant)}" href="${toHash(action.route)}">${escapeHtml(action.label)}</a>
      `.trim()).join('');

  return `
    <div class="c-site-header__inner">
      <a class="c-site-header__brand" href="${toHash(brand.homeRoute)}" aria-label="${escapeHtml(brand.name)} home">
        <picture>
          <source srcset="assets/images/logo-200.webp" type="image/webp">
          <img class="c-site-header__logo" src="${escapeHtml(brand.logo)}" alt="${escapeHtml(brand.logoAlt)}" width="600" height="473" fetchpriority="high" decoding="async">
        </picture>
      </a>

      <nav class="c-site-header__nav" aria-label="Main navigation">
        ${navMarkup}
      </nav>

      <div class="c-site-header__actions">
        ${actionMarkup}
      </div>

      <button class="c-site-header__toggle" type="button" aria-label="Open menu" aria-expanded="false" data-menu-toggle>
        <span class="c-site-header__toggle-line"></span>
        <span class="c-site-header__toggle-line"></span>
        <span class="c-site-header__toggle-line"></span>
      </button>
    </div>

    <nav class="c-mobile-nav" aria-label="Mobile navigation" data-mobile-nav hidden>
      ${navItems.map((item) => `<a class="${linkClass('c-mobile-nav__link', 'c-mobile-nav__link--active', item.route, activePath)}" href="${toHash(item.route)}"${ariaCurrent(item.route, activePath)}>${escapeHtml(item.label)}</a>`).join('')}
    </nav>
  `.trim();
};

/**
 * @effect
 * @param {Object} config
 * @param {String} currentPath
 * @returns {void}
 */
export const renderHeader = (config, currentPath) => {
  const host = document.getElementById('site-header');
  if (!host) return;

  host.innerHTML = createHeaderMarkup(config, currentPath);
};
