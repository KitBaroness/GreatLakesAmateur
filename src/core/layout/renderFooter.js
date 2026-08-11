/**
 * Footer renderer.
 */

import { escapeHtml } from '../../utilities/escapeHtml.js';
import SiteConfig from '../site-config.js';
import { bindLegalDialog, createLegalDialogMarkup, LEGAL_DIALOG_ID } from './renderLegalDialog.js';

/**
 * @pure
 * @param {Object} config
 * @returns {String}
 */
const createFooterMarkup = (config) => {
  const footer = SiteConfig.getFooter(config);
  const legal = footer.legal;

  return `
    <div class="c-site-footer__inner">
      <p class="c-site-footer__text">${escapeHtml(footer.copyright)}</p>
      ${legal ? `
      <p class="c-site-footer__meta">
        <button type="button" class="c-site-footer__link c-site-footer__legal-trigger" data-legal-dialog-open>${escapeHtml(legal.triggerLabel)}</button>
      </p>` : ''}
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

  const footer = SiteConfig.getFooter(config);
  host.innerHTML = createFooterMarkup(config);

  if (footer.legal && !document.getElementById(LEGAL_DIALOG_ID)) {
    host.insertAdjacentHTML('beforeend', createLegalDialogMarkup(footer.legal));
  }

  bindLegalDialog();
};
