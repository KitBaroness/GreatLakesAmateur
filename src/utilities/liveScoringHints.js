/**
 * Golf Genius resource hints shared by boot and live-scoring route init.
 */

/**
 * @effect
 * @param {String} embedUrl
 * @returns {void}
 */
export const ensureLiveScoringHints = (embedUrl) => {
  if (!embedUrl) {
    return;
  }

  try {
    const origin = new URL(embedUrl).origin;

    [
      { rel: 'dns-prefetch', crossOrigin: false },
      { rel: 'preconnect', crossOrigin: true }
    ].forEach(({ rel, crossOrigin }) => {
      const marker = `data-live-scoring-hint="${rel}:${origin}"`;

      if (document.querySelector(`link[${marker}]`)) {
        return;
      }

      const link = document.createElement('link');
      link.rel = rel;
      link.href = origin;

      if (crossOrigin) {
        link.crossOrigin = 'anonymous';
      }

      link.setAttribute('data-live-scoring-hint', `${rel}:${origin}`);
      document.head.appendChild(link);
    });

    if (!document.querySelector(`link[data-live-scoring-prefetch="${embedUrl}"]`)) {
      const prefetch = document.createElement('link');
      prefetch.rel = 'prefetch';
      prefetch.href = embedUrl;
      prefetch.setAttribute('data-live-scoring-prefetch', embedUrl);
      document.head.appendChild(prefetch);
    }
  } catch {
    // Invalid embed URL; skip resource hints.
  }
};
