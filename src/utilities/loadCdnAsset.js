/**
 * Lazy-load third-party CDN assets with Subresource Integrity when configured.
 */

/**
 * @effect
 * @param {Object} options
 * @param {String} options.href
 * @param {String} [options.integrity]
 * @param {String} [options.datasetKey]
 * @returns {Promise<HTMLLinkElement>}
 */
export const loadStylesheet = ({ href, integrity = '', datasetKey = 'cdnStylesheet' }) => (
  new Promise((resolve, reject) => {
    const existingLink = document.querySelector(`link[data-${datasetKey}="${href}"]`);

    if (existingLink) {
      resolve(existingLink);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.crossOrigin = 'anonymous';
    link.dataset[datasetKey] = href;

    if (integrity) {
      link.integrity = integrity;
    }

    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`Unable to load stylesheet: ${href}`));
    document.head.append(link);
  })
);

/**
 * @effect
 * @param {Object} options
 * @param {String} options.src
 * @param {String} [options.integrity]
 * @param {String} [options.datasetKey]
 * @param {Function} options.isReady
 * @param {String} options.readyLabel
 * @returns {Promise<*>}
 */
export const loadScript = ({
  src,
  integrity = '',
  datasetKey = 'cdnScript',
  isReady,
  readyLabel = 'asset'
}) => new Promise((resolve, reject) => {
  if (isReady()) {
    resolve(isReady());
    return;
  }

  const existingScript = document.querySelector(`script[data-${datasetKey}="${src}"]`);

  if (existingScript) {
    if (isReady()) {
      resolve(isReady());
      return;
    }

    existingScript.addEventListener('load', () => {
      if (isReady()) {
        resolve(isReady());
        return;
      }

      reject(new Error(`${readyLabel} global missing after script load: ${src}`));
    }, { once: true });
    existingScript.addEventListener('error', () => {
      reject(new Error(`Unable to load script: ${src}`));
    }, { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  script.defer = true;
  script.crossOrigin = 'anonymous';
  script.dataset[datasetKey] = src;

  if (integrity) {
    script.integrity = integrity;
  }

  script.onload = () => {
    if (isReady()) {
      resolve(isReady());
      return;
    }

    reject(new Error(`${readyLabel} global missing after script load: ${src}`));
  };
  script.onerror = () => reject(new Error(`Unable to load script: ${src}`));
  document.head.append(script);
});
