/**
 * Footer renderer.
 */

import { escapeHtml } from '../../utilities/escapeHtml.js';
import SiteConfig from '../site-config.js';

/**
 * @pure
 * @param {Object} config
 * @returns {String}
 */
const createFooterMarkup = (config) => {
  const footer = SiteConfig.getFooter(config);

  return `
    <div class="c-site-footer__inner">
      <p class="c-site-footer__text">${escapeHtml(footer.copyright)}</p>
    </div>
  `.trim();
};

/**
 * @effect
 * @param {Object} config
 * @returns {void}
 */
export const renderFooter = (config) => {
  const host = document.getElementById('site-footer');
  if (!host) return;

  host.innerHTML = createFooterMarkup(config);
};
