/**
 * Footer renderer.
 */

import { escapeHtml } from '../../utilities/escapeHtml.js';
import SiteConfig from '../site-config.js';
import { bindLegalDialog, createLegalDialogShellMarkup, LEGAL_DIALOG_ID } from './renderLegalDialog.js';

/**
 * @pure
 * @param {Object} entry
 * @param {Number} index
 * @returns {String}
 */
const createFooterLinkMarkup = (entry, index) => {
  const separator = index > 0
    ? '<span class="c-site-footer__separator" aria-hidden="true"> | </span>'
    : '';

  return `${separator}<button type="button" class="c-site-footer__link c-site-footer__legal-trigger" data-legal-dialog-open="${escapeHtml(entry.id)}">${escapeHtml(entry.label)}</button>`;
};

/**
 * @pure
 * @param {Array} entries
 * @returns {String}
 */
const createFooterLinksMarkup = (entries) => (
  entries.map((entry, index) => createFooterLinkMarkup(entry, index)).join('')
);

/**
 * @pure
 * @param {Object} config
 * @returns {Array}
 */
const getFooterDialogEntries = (config) => {
  const footer = SiteConfig.getFooter(config);
  const about = footer.about ? [footer.about] : [];
  const documents = footer.legal?.documents || [];

  return [...about, ...documents];
};

/**
 * @pure
 * @param {Object} config
 * @returns {String}
 */
const createFooterMarkup = (config) => {
  const footer = SiteConfig.getFooter(config);
  const dialogEntries = getFooterDialogEntries(config);

  return `
    <div class="c-site-footer__inner">
      <p class="c-site-footer__text">${escapeHtml(footer.copyright)}</p>
      ${dialogEntries.length ? `
      <p class="c-site-footer__meta">
        ${createFooterLinksMarkup(dialogEntries)}
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

  const dialogEntries = getFooterDialogEntries(config);

  host.innerHTML = createFooterMarkup(config);

  if (dialogEntries.length && !document.getElementById(LEGAL_DIALOG_ID)) {
    host.insertAdjacentHTML('beforeend', createLegalDialogShellMarkup());
  }

  bindLegalDialog(dialogEntries);
};
