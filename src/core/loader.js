import SiteConfig from './site-config.js';
import { renderHeader } from './layout/renderHeader.js';
import { renderFooter } from './layout/renderFooter.js';
import { closeLegalDialog } from './layout/renderLegalDialog.js';
import { createRouter, getPathFromHash } from '../utilities/router.js';
import { hydrateRouteViews } from '../utilities/routeViewModules.js';
import { ensureLiveScoringHints } from '../utilities/liveScoringHints.js';
import { bindMobileNavigation, closeMobileNavigation } from '../utilities/mobileNav.js';

const storagePrefix = 'flexnet:';
const registrationStorageKey = 'flexnet:registration:draft';
let developerSignatureLogged = false;

/**
 * @param {Array} items
 * @returns {*}
 */
const pickRandomItem = (items) => items[Math.floor(Math.random() * items.length)];

/**
 * @effect
 * @param {Object} config
 * @returns {void}
 */
const logDeveloperSignature = (config) => {
  const signature = SiteConfig.getDeveloperSignature(config);

  if (
    developerSignatureLogged ||
    !signature?.enabled ||
    !Array.isArray(signature.jokes) ||
    !Array.isArray(signature.signoffs) ||
    !signature.jokes.length ||
    !signature.signoffs.length ||
    !window.console ||
    typeof window.console.info !== 'function'
  ) {
    return;
  }

  developerSignatureLogged = true;

  const joke = pickRandomItem(signature.jokes);
  const signoff = pickRandomItem(signature.signoffs);
  const styles = signature.styles || {};

  window.console.info(`%c${joke}`, styles.joke || '');
  window.console.info(`%c${signoff}`, styles.signoff || '');
};

/**
 * @effect
 * @param {String} storageName
 * @returns {void}
 */
const clearOwnedStorage = (storageName) => {
  try {
    const storage = window[storageName];
    if (!storage) return;

    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);

      if (key?.startsWith(storagePrefix) && key !== registrationStorageKey) {
        // Keep registration draft during multi-step flow; see README session privacy notes.
        storage.removeItem(key);
      }
    }
  } catch {
    // Private browsing modes can block Storage APIs; no visitor data is written by default.
  }
};

/**
 * @effect
 * @returns {void}
 */
const resetTransientForms = () => {
  document.querySelectorAll('[data-transient-form]').forEach((form) => {
    form.reset();

    form.querySelectorAll('input, textarea').forEach((control) => {
      control.value = '';
    });
  });
};

/**
 * @effect
 * @returns {void}
 */
const purgeTransientVisitorState = () => {
  resetTransientForms();
  clearOwnedStorage('sessionStorage');
  clearOwnedStorage('localStorage');
};

/**
 * @effect
 * @param {HTMLAnchorElement} link
 * @param {Object} action
 * @returns {void}
 */
const hydrateContactLink = (link, action) => {
  link.setAttribute('href', action.href);
  link.setAttribute('title', action.title || action.label);
  link.setAttribute('aria-label', action.title || action.label);
  link.removeAttribute('target');
  link.removeAttribute('rel');

  const labelTarget = link.querySelector('[data-contact-label-target]');

  if (labelTarget) {
    labelTarget.textContent = action.label;
  } else if (!link.textContent.trim()) {
    link.textContent = action.label;
  }
};

/**
 * @effect
 * @param {Object} config
 * @returns {void}
 */
const hydrateContactLinks = (config) => {
  const getContactAction = SiteConfig.getContactAction;

  document.querySelectorAll('[data-contact-action]').forEach((link) => {
    const key = link.getAttribute('data-contact-action');
    const action = getContactAction ? getContactAction(config, key) : null;

    if (action?.href) {
      hydrateContactLink(link, action);
    }
  });
};

/**
 * @effect
 * @returns {void}
 */
const bindGlobalInteractions = () => {
  bindMobileNavigation();

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLegalDialog();
    }
  });
};

/**
 * @effect
 * @returns {void}
 */
const bindSessionPrivacyGuards = () => {
  window.addEventListener('pagehide', purgeTransientVisitorState);
  window.addEventListener('beforeunload', purgeTransientVisitorState);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      purgeTransientVisitorState();
    }
  });
};

/**
 * @effect
 * @returns {void}
 */
const initializeApp = () => {
  const config = SiteConfig.config;

  if (!config) {
    console.error('[FlexNet] Missing site configuration.');
    return;
  }

  if (config.liveScoring?.enabled && config.liveScoring.embedUrl) {
    ensureLiveScoringHints(config.liveScoring.embedUrl);
  }

  logDeveloperSignature(config);
  renderHeader(config, getPathFromHash());
  renderFooter(config);
  bindGlobalInteractions();
  bindSessionPrivacyGuards();
  hydrateContactLinks(config);

  window.addEventListener('routechange', (event) => {
    renderHeader(config, event.detail.path);
    closeMobileNavigation();
    hydrateContactLinks(config);
    hydrateRouteViews(config, event.detail.path);
  });

  createRouter(config, {
    containerId: 'content-placeholder'
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
} else {
  initializeApp();
}
