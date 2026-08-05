/**
 * Header renderer.
 * Pure HTML generation is separate from the DOM write performed by renderHeader.
 */

import { escapeHtml } from '../../utilities/escapeHtml.js';
import SiteConfig from '../site-config.js';

const toHash = (route) => `#${route}`;

const navLinkClass = (route, currentPath) => (
  route === currentPath
    ? 'c-site-header__link c-site-header__link--active'
    : 'c-site-header__link'
);

const mobileNavLinkClass = (route, currentPath) => (
  route === currentPath
    ? 'c-mobile-nav__link c-mobile-nav__link--active'
    : 'c-mobile-nav__link'
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
 * @param {Object} config
 * @param {String} currentPath
 * @returns {String}
 */
const createHeaderMarkup = (config, currentPath) => {
  const brand = SiteConfig.getBrand(config);
  const navItems = SiteConfig.getNavigation(config)
    .filter((item) => item.route !== brand.homeRoute);
  const actions = SiteConfig.getCallsToAction(config);

  const navMarkup = navItems.map((item) => `
        <a class="${navLinkClass(item.route, currentPath)}" href="${toHash(item.route)}"${ariaCurrent(item.route, currentPath)}>${escapeHtml(item.label)}</a>
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
      ${navItems.map((item) => `<a class="${mobileNavLinkClass(item.route, currentPath)}" href="${toHash(item.route)}"${ariaCurrent(item.route, currentPath)}>${escapeHtml(item.label)}</a>`).join('')}
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
