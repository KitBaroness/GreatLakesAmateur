/**
 * Footer renderer.
 */

/**
 * @pure
 * @param {Object} config
 * @returns {String}
 */
export const createFooterMarkup = (config) => {
  const footer = window.FlexNetSiteConfig.getFooter(config);

  return `
    <div class="c-site-footer__inner">
      <p class="c-site-footer__text">${footer.copyright}</p>
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

  host.innerHTML = createFooterMarkup(config);
};
