/**
 * Golf Genius live scoring embed.
 */

import SiteConfig from '../../core/site-config.js';

const ROOT_SELECTOR = '[data-live-scoring-root]';

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
 * @param {HTMLElement} root
 * @param {Object} liveScoring
 * @returns {void}
 */
const renderActiveLiveScoring = (root, liveScoring) => {
  const embedHost = root.querySelector('[data-live-scoring-embed]');
  const frame = root.querySelector('[data-live-scoring-frame]');
  const note = root.querySelector('[data-live-scoring-note]');
  const externalLink = root.querySelector('[data-live-scoring-external]');
  const subtitle = document.querySelector('[data-live-scoring-subtitle]');

  if (embedHost) {
    embedHost.hidden = false;
  }

  if (frame) {
    frame.title = liveScoring.iframeTitle || 'Great Lakes Amateur live tournament results';
    frame.src = liveScoring.embedUrl;
  }

  if (note) {
    note.textContent = liveScoring.refreshNote || 'Results update automatically from Golf Genius during tournament rounds.';
    note.hidden = false;
  }

  if (externalLink) {
    externalLink.href = liveScoring.externalUrl;
    externalLink.hidden = false;
  }

  if (subtitle && liveScoring.refreshNote) {
    subtitle.textContent = liveScoring.refreshNote;
  }
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
 * @param {Object} config
 * @param {String} routePath
 * @returns {void}
 */
export const initLiveScoring = (config, routePath) => {
  const liveScoring = SiteConfig.getLiveScoring(config);
  const root = document.querySelector(ROOT_SELECTOR);

  if (!root || routePath !== liveScoring?.route) {
    return;
  }

  if (isLiveScoringActive(liveScoring)) {
    renderActiveLiveScoring(root, liveScoring);
    return;
  }

  renderInactiveLiveScoring(root);
};
