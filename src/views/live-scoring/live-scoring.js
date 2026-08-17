/**
 * Golf Genius live scoring embed.
 */

import SiteConfig from '../../core/site-config.js';
import { ensureLiveScoringHints } from '../../utilities/liveScoringHints.js';

const ROOT_SELECTOR = '[data-live-scoring-root]';
const COMPACT_QUERY = '(max-width: 1180px)';
const LOAD_TIMEOUT_MS = 12000;
const EMBED_HEIGHT_FLOOR = 280;
const PAGE_CLASS = 'is-live-scoring-page';

let mediaCleanup = null;

/**
 * @pure
 * @param {Object} liveScoring
 * @returns {Boolean}
 */
const isLiveScoringActive = (liveScoring) => Boolean(
  liveScoring?.enabled && liveScoring.embedUrl && liveScoring.externalUrl
);

/**
 * @effect
 * @param {Boolean} active
 * @returns {void}
 */
const toggleLiveScoringPageClass = (active) => {
  document.body.classList.toggle(PAGE_CLASS, active);
};

/**
 * @effect
 * @param {HTMLElement} embedHost
 * @param {HTMLElement} root
 * @returns {Function}
 */
const bindEmbedViewport = (embedHost, root) => {
  if (!embedHost) {
    return () => {};
  }

  const media = window.matchMedia(COMPACT_QUERY);

  const syncEmbedViewport = () => {
    if (!media.matches) {
      embedHost.style.removeProperty('height');
      embedHost.style.removeProperty('min-height');
      root.style.removeProperty('--live-scoring-embed-height');
      return;
    }

    const header = document.querySelector('.c-site-header');
    const pageHeader = document.querySelector('.c-page-header--compact');
    const footerNote = root.querySelector('[data-live-scoring-note]');
    const external = root.querySelector('.c-live-scoring__external');
    const fallback = root.querySelector('[data-live-scoring-fallback]');
    const reserved = 16
      + (footerNote?.offsetHeight || 0)
      + (external?.offsetHeight || 0)
      + (fallback?.hidden === false ? fallback.offsetHeight : 0);
    const top = (header?.offsetHeight || 76) + (pageHeader?.offsetHeight || 108);
    const viewport = window.visualViewport?.height ?? window.innerHeight;
    const height = Math.max(EMBED_HEIGHT_FLOOR, Math.round(viewport - top - reserved));

    embedHost.style.height = `${height}px`;
    embedHost.style.minHeight = `${height}px`;
    root.style.setProperty('--live-scoring-embed-height', `${height}px`);
  };

  syncEmbedViewport();
  media.addEventListener('change', syncEmbedViewport);
  window.addEventListener('resize', syncEmbedViewport);
  window.visualViewport?.addEventListener('resize', syncEmbedViewport);
  window.visualViewport?.addEventListener('scroll', syncEmbedViewport);

  return () => {
    media.removeEventListener('change', syncEmbedViewport);
    window.removeEventListener('resize', syncEmbedViewport);
    window.visualViewport?.removeEventListener('resize', syncEmbedViewport);
    window.visualViewport?.removeEventListener('scroll', syncEmbedViewport);
    embedHost.style.removeProperty('height');
    embedHost.style.removeProperty('min-height');
    root.style.removeProperty('--live-scoring-embed-height');
  };
};

/**
 * @effect
 * @param {HTMLIFrameElement} frame
 * @param {HTMLElement} loading
 * @param {String} embedUrl
 * @param {Function} onFallback
 * @returns {Function}
 */
const loadEmbed = (frame, loading, embedUrl, onFallback) => {
  if (!frame || !embedUrl) {
    return () => {};
  }

  let settled = false;
  let timeoutId = 0;

  const showLoading = (message) => {
    if (!loading) return;

    loading.hidden = false;
    loading.setAttribute('aria-busy', 'true');

    if (message) {
      loading.textContent = message;
    }
  };

  const hideLoading = () => {
    if (!loading) return;

    loading.hidden = true;
    loading.setAttribute('aria-busy', 'false');
  };

  const settle = (success, message) => {
    if (settled) return;

    settled = true;
    window.clearTimeout(timeoutId);

    if (success) {
      hideLoading();
      return;
    }

    if (message && loading) {
      loading.textContent = message;
      loading.hidden = false;
      loading.setAttribute('aria-busy', 'false');
    } else {
      hideLoading();
    }

    onFallback(message);
  };

  const handleLoad = () => settle(true);
  const handleError = () => settle(
    false,
    'Live results could not be loaded here. Use the Golf Genius link below if needed.'
  );

  frame.addEventListener('load', handleLoad);
  frame.addEventListener('error', handleError);

  showLoading('Loading live results...');
  timeoutId = window.setTimeout(
    () => settle(false),
    LOAD_TIMEOUT_MS
  );

  if (frame.getAttribute('src') !== embedUrl) {
    frame.src = embedUrl;
  } else {
    try {
      if (frame.contentDocument?.readyState === 'complete') {
        settle(true);
      }
    } catch {
      // Cross-origin frame; rely on load event or timeout.
    }
  }

  return () => {
    settled = true;
    window.clearTimeout(timeoutId);
    frame.removeEventListener('load', handleLoad);
    frame.removeEventListener('error', handleError);
  };
};

/**
 * @effect
 * @param {HTMLElement} root
 * @param {Object} liveScoring
 * @returns {Function}
 */
const renderActiveLiveScoring = (root, liveScoring) => {
  const fallbackPanel = root.querySelector('[data-live-scoring-fallback]');
  const fallbackOpen = root.querySelector('[data-live-scoring-fallback-open]');
  const embedHost = root.querySelector('[data-live-scoring-embed]');
  const frame = root.querySelector('[data-live-scoring-frame]');
  const loading = root.querySelector('[data-live-scoring-loading]');
  const note = root.querySelector('[data-live-scoring-note]');
  const externalLink = root.querySelector('[data-live-scoring-external]');
  const subtitle = document.querySelector('[data-live-scoring-subtitle]');
  let embedCleanup = () => {};
  let heightCleanup = () => {};

  ensureLiveScoringHints(liveScoring.embedUrl);

  if (frame) {
    frame.title = liveScoring.iframeTitle || 'Great Lakes Amateur live tournament results';
  }

  if (fallbackOpen) {
    fallbackOpen.href = liveScoring.externalUrl;
  }

  if (externalLink) {
    externalLink.href = liveScoring.externalUrl;
    externalLink.hidden = false;
  }

  if (note) {
    note.textContent = liveScoring.refreshNote || 'Results update automatically from Golf Genius during tournament rounds.';
    note.hidden = false;
  }

  if (subtitle && liveScoring.refreshNote) {
    subtitle.textContent = liveScoring.refreshNote;
  }

  const showFallback = () => {
    if (fallbackPanel) {
      fallbackPanel.hidden = false;
    }
  };

  if (embedHost) {
    embedHost.hidden = false;
  }

  if (fallbackPanel) {
    fallbackPanel.hidden = true;
  }

  heightCleanup = bindEmbedViewport(embedHost, root);
  embedCleanup = loadEmbed(frame, loading, liveScoring.embedUrl, showFallback);
  toggleLiveScoringPageClass(true);

  return () => {
    toggleLiveScoringPageClass(false);
    embedCleanup();
    heightCleanup();
  };
};

/**
 * @effect
 * @param {HTMLElement} root
 * @returns {void}
 */
const renderInactiveLiveScoring = (root) => {
  const status = root.querySelector('[data-live-scoring-status]');

  if (!status) return;

  status.hidden = false;
  status.innerHTML = `
    <p>Live scoring is not currently published on this site.</p>
    <p>Check <a href="#/event-details">Event Details</a> for tournament information.</p>
  `.trim();
};

/**
 * @effect
 * @returns {void}
 */
const resetLiveScoring = () => {
  toggleLiveScoringPageClass(false);
  mediaCleanup?.();
  mediaCleanup = null;
};

/**
 * @effect
 * @param {Object} config
 * @param {String} routePath
 * @returns {void}
 */
export const initLiveScoring = (config, routePath) => {
  const liveScoring = SiteConfig.getLiveScoring(config);
  const root = document.querySelector(ROOT_SELECTOR);

  resetLiveScoring();

  if (!root || routePath !== liveScoring?.route) {
    return;
  }

  if (isLiveScoringActive(liveScoring)) {
    mediaCleanup = renderActiveLiveScoring(root, liveScoring);
    return;
  }

  renderInactiveLiveScoring(root);
};
