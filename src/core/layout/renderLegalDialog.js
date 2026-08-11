/**
 * Site legal dialog renderer and interactions.
 */

import { escapeHtml } from '../../utilities/escapeHtml.js';

export const LEGAL_DIALOG_ID = 'site-legal-dialog';

/**
 * @pure
 * @param {Object} legal
 * @returns {String}
 */
export const createLegalDialogMarkup = (legal) => {
  if (!legal?.sections?.length) return '';

  const sections = legal.sections.map((section) => (
    `<section class="c-legal-dialog__section${section.emphasis ? ' c-legal-dialog__section--disclaimer' : ''}">
      <h3 class="c-legal-dialog__section-title">${escapeHtml(section.title)}</h3>
      <p class="c-legal-dialog__section-body">${escapeHtml(section.body)}</p>
    </section>`
  )).join('');

  return `
    <dialog id="${LEGAL_DIALOG_ID}" class="c-legal-dialog" aria-labelledby="site-legal-dialog-title">
      <div class="c-legal-dialog__panel">
        <header class="c-legal-dialog__header">
          <h2 id="site-legal-dialog-title" class="c-legal-dialog__title">${escapeHtml(legal.dialogTitle)}</h2>
          <button type="button" class="c-legal-dialog__close" data-legal-dialog-close aria-label="Close terms of use">&times;</button>
        </header>
        <div class="c-legal-dialog__body">
          ${legal.intro ? `<p class="c-legal-dialog__intro">${escapeHtml(legal.intro)}</p>` : ''}
          ${sections}
          ${legal.closingNote ? `<p class="c-legal-dialog__note">${escapeHtml(legal.closingNote)}</p>` : ''}
        </div>
      </div>
    </dialog>
  `.trim();
};

/**
 * @effect
 * @returns {void}
 */
export const bindLegalDialog = () => {
  const dialog = document.getElementById(LEGAL_DIALOG_ID);
  const trigger = document.querySelector('[data-legal-dialog-open]');

  if (!dialog || !trigger || dialog.dataset.bound === 'true') return;

  dialog.dataset.bound = 'true';

  trigger.addEventListener('click', () => {
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    }
  });

  dialog.querySelectorAll('[data-legal-dialog-close]').forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    dialog.close();
  });
};

/**
 * @effect
 * @returns {void}
 */
export const closeLegalDialog = () => {
  document.getElementById(LEGAL_DIALOG_ID)?.close();
};
