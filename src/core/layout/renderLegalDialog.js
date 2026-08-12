/**
 * Site legal dialog renderer and interactions.
 */

import { escapeHtml } from '../../utilities/escapeHtml.js';

export const LEGAL_DIALOG_ID = 'site-legal-dialog';

/**
 * @pure
 * @param {Object} document
 * @returns {String}
 */
const createLegalDocumentBodyMarkup = (document) => {
  const sections = (document.sections || []).map((section) => (
    `<section class="c-legal-dialog__section${section.emphasis ? ' c-legal-dialog__section--disclaimer' : ''}">
      <h3 class="c-legal-dialog__section-title">${escapeHtml(section.title)}</h3>
      <p class="c-legal-dialog__section-body">${escapeHtml(section.body)}</p>
    </section>`
  )).join('');

  const links = (document.links || []).map((link) => (
    `<li><a class="c-legal-dialog__link" href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a></li>`
  )).join('');

  const linksMarkup = links
    ? `<section class="c-legal-dialog__section">
        <h3 class="c-legal-dialog__section-title">Profiles</h3>
        <ul class="c-legal-dialog__links">${links}</ul>
      </section>`
    : '';

  return `
    ${document.intro ? `<p class="c-legal-dialog__intro">${escapeHtml(document.intro)}</p>` : ''}
    ${sections}
    ${linksMarkup}
    ${document.closingNote ? `<p class="c-legal-dialog__note">${escapeHtml(document.closingNote)}</p>` : ''}
  `.trim();
};

/**
 * @pure
 * @returns {String}
 */
export const createLegalDialogShellMarkup = () => (
  `<dialog id="${LEGAL_DIALOG_ID}" class="c-legal-dialog" aria-labelledby="site-legal-dialog-title">
    <div class="c-legal-dialog__panel">
      <header class="c-legal-dialog__header">
        <h2 id="site-legal-dialog-title" class="c-legal-dialog__title"></h2>
        <button type="button" class="c-legal-dialog__close" data-legal-dialog-close aria-label="Close dialog">&times;</button>
      </header>
      <div class="c-legal-dialog__body" data-legal-dialog-body></div>
    </div>
  </dialog>`
);

/**
 * @effect
 * @param {Object} legalDocument
 * @returns {void}
 */
const renderLegalDocument = (legalDocument) => {
  const dialog = document.getElementById(LEGAL_DIALOG_ID);
  const title = dialog?.querySelector('#site-legal-dialog-title');
  const body = dialog?.querySelector('[data-legal-dialog-body]');

  if (!dialog || !title || !body || !legalDocument) return;

  title.textContent = legalDocument.dialogTitle || legalDocument.label;
  body.innerHTML = createLegalDocumentBodyMarkup(legalDocument);
};

let legalDocumentsById = {};

/**
 * @effect
 * @param {Array} documents
 * @returns {void}
 */
export const bindLegalDialog = (documents = []) => {
  const dialog = document.getElementById(LEGAL_DIALOG_ID);

  legalDocumentsById = Object.fromEntries(documents.map((entry) => [entry.id, entry]));

  if (!dialog || dialog.dataset.bound === 'true') return;

  dialog.dataset.bound = 'true';

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-legal-dialog-open]');
    if (!trigger) return;

    const documentId = trigger.getAttribute('data-legal-dialog-open');
    const legalDocument = legalDocumentsById[documentId];

    if (!legalDocument || typeof dialog.showModal !== 'function') return;

    renderLegalDocument(legalDocument);
    dialog.showModal();
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
