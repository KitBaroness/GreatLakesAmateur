/**
 * Golf Genius live scoring embed.
 */

import SiteConfig from '../../core/site-config.js';

const ROOT_SELECTOR = '[data-live-scoring-root]';
const MOBILE_EMBED_QUERY = '(max-width: 1180px)';

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
 * @param {String} embedUrl
 * @returns {void}
 */
const ensureLiveScoringPreconnect = (embedUrl) => {
  try {
    const origin = new URL(embedUrl).origin;

    if (document.querySelector(`link[data-live-scoring-preconnect="${origin}"]`)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    link.setAttribute('data-live-scoring-preconnect', origin);
    document.head.appendChild(link);
  } catch {
    // Invalid embed URL; skip preconnect.
  }
};

/**
 * @effect
 * @param {HTMLIFrameElement} frame
 * @param {HTMLElement} loading
 * @param {String} embedUrl
 * @returns {Function}
 */
const loadDesktopEmbed = (frame, loading, embedUrl) => {
  if (!frame || !embedUrl) {
    return () => {};
  }

  const showLoading = () => {
    if (loading) {
      loading.hidden = false;
      loading.setAttribute('aria-busy', 'true');
    }
  };

  const hideLoading = () => {
    if (loading) {
      loading.hidden = true;
      loading.setAttribute('aria-busy', 'false');
    }
  };

  const handleLoad = () => hideLoading();
  const handleError = () => {
    hideLoading();
    if (loading) {
      loading.textContent = 'Live results could not be loaded here. Use Open full results on Golf Genius below.';
      loading.hidden = false;
    }
  };

  frame.addEventListener('load', handleLoad);
  frame.addEventListener('error', handleError);

  showLoading();

  if (!frame.getAttribute('src')) {
    frame.src = embedUrl;
  } else if (frame.getAttribute('src') !== embedUrl) {
    frame.src = embedUrl;
  } else {
    try {
      if (frame.contentDocument?.readyState === 'complete') {
        hideLoading();
      }
    } catch {
      // Cross-origin frame; rely on the load event.
    }
  }

  return () => {
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
  const mobilePanel = root.querySelector('[data-live-scoring-mobile-panel]');
  const mobileOpen = root.querySelector('[data-live-scoring-mobile-open]');
  const embedHost = root.querySelector('[data-live-scoring-embed]');
  const frame = root.querySelector('[data-live-scoring-frame]');
  const loading = root.querySelector('[data-live-scoring-loading]');
  const note = root.querySelector('[data-live-scoring-note]');
  const externalLink = root.querySelector('[data-live-scoring-external]');
  const subtitle = document.querySelector('[data-live-scoring-subtitle]');
  const media = window.matchMedia(MOBILE_EMBED_QUERY);
  let embedCleanup = () => {};

  ensureLiveScoringPreconnect(liveScoring.embedUrl);

  if (frame) {
    frame.title = liveScoring.iframeTitle || 'Great Lakes Amateur live tournament results';
  }

  if (mobileOpen) {
    mobileOpen.href = liveScoring.externalUrl;
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

  const applyLayout = () => {
    embedCleanup();

    if (media.matches) {
      if (mobilePanel) {
        mobilePanel.hidden = false;
      }

      if (embedHost) {
        embedHost.hidden = true;
      }

      if (frame) {
        frame.removeAttribute('src');
      }

      if (loading) {
        loading.hidden = true;
        loading.setAttribute('aria-busy', 'false');
      }

      return;
    }

    if (mobilePanel) {
      mobilePanel.hidden = true;
    }

    if (embedHost) {
      embedHost.hidden = false;
    }

    embedCleanup = loadDesktopEmbed(frame, loading, liveScoring.embedUrl);
  };

  applyLayout();
  media.addEventListener('change', applyLayout);

  return () => {
    media.removeEventListener('change', applyLayout);
    embedCleanup();
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
