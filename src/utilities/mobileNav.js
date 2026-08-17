/**
 * Mobile header navigation toggle.
 */

const bySelector = (selector) => document.querySelector(selector);

/**
 * @effect
 * @returns {void}
 */
export const closeMobileNavigation = () => {
  const toggle = bySelector('[data-menu-toggle]');
  const nav = bySelector('[data-mobile-nav]');

  if (!toggle || !nav) {
    return;
  }

  toggle.classList.remove('c-site-header__toggle--open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open menu');
  nav.hidden = true;
};

/**
 * @effect
 * @returns {void}
 */
export const toggleMobileNavigation = () => {
  const toggle = bySelector('[data-menu-toggle]');
  const nav = bySelector('[data-mobile-nav]');

  if (!toggle || !nav) {
    return;
  }

  const isOpen = toggle.getAttribute('aria-expanded') === 'true';
  toggle.classList.toggle('c-site-header__toggle--open', !isOpen);
  toggle.setAttribute('aria-expanded', String(!isOpen));
  toggle.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
  nav.hidden = isOpen;
};

/**
 * @effect
 * @returns {void}
 */
export const bindMobileNavigation = () => {
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-menu-toggle]')) {
      event.preventDefault();
      toggleMobileNavigation();
      return;
    }

    if (event.target.closest('.c-mobile-nav__link')) {
      closeMobileNavigation();
    }

    if (event.target.closest('.c-site-header__brand')) {
      closeMobileNavigation();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileNavigation();
    }
  });
};
