import { renderHeader } from './layout/renderHeader.js';
import { renderFooter } from './layout/renderFooter.js';
import { createRouter, getPathFromHash } from '../utilities/router.js';

const bySelector = (selector) => document.querySelector(selector);

/**
 * @effect
 * @returns {void}
 */
const closeMobileNavigation = () => {
  const toggle = bySelector('[data-menu-toggle]');
  const nav = bySelector('[data-mobile-nav]');

  if (!toggle || !nav) return;

  toggle.classList.remove('c-site-header__toggle--open');
  toggle.setAttribute('aria-expanded', 'false');
  nav.hidden = true;
  nav.classList.remove('c-mobile-nav--open');
};

/**
 * @effect
 * @returns {void}
 */
const toggleMobileNavigation = () => {
  const toggle = bySelector('[data-menu-toggle]');
  const nav = bySelector('[data-mobile-nav]');

  if (!toggle || !nav) return;

  const isOpen = toggle.getAttribute('aria-expanded') === 'true';
  toggle.classList.toggle('c-site-header__toggle--open', !isOpen);
  toggle.setAttribute('aria-expanded', String(!isOpen));
  nav.hidden = isOpen;
  nav.classList.toggle('c-mobile-nav--open', !isOpen);
};

/**
 * @effect
 * @param {HTMLElement} trigger
 * @returns {void}
 */
const handlePlaceholderPayment = (trigger, config) => {
  const label = trigger.getAttribute('data-payment-label') || 'Payment';
  const payment = window.FlexNetSiteConfig?.getPayments(config);
  const message = payment
    ? `${label} ${payment.fallbackMessage} Phone: ${payment.fallbackPhone}. Email: ${payment.fallbackEmail}.`
    : `${label} payment link is not configured yet.`;

  window.alert(message);
};

/**
 * @effect
 * @returns {void}
 */
const bindGlobalInteractions = (config) => {
  document.addEventListener('click', (event) => {
    const paymentTrigger = event.target.closest('[data-payment-placeholder]');
    if (paymentTrigger) {
      event.preventDefault();
      handlePlaceholderPayment(paymentTrigger, config);
      return;
    }

    if (event.target.closest('[data-menu-toggle]')) {
      event.preventDefault();
      toggleMobileNavigation();
      return;
    }

    if (event.target.closest('.c-mobile-nav__link')) {
      closeMobileNavigation();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileNavigation();
    }
  });

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-contact-form]');
    if (!form) return;

    event.preventDefault();
    window.alert('Thank you for your message! Form submission is not yet configured.');
    form.reset();
  });
};

/**
 * @effect
 * @returns {void}
 */
const initializeApp = () => {
  const config = window.FlexNetSiteConfig?.config;

  if (!config) {
    console.error('[FlexNet] Missing site configuration.');
    return;
  }

  renderHeader(config, getPathFromHash());
  renderFooter(config);
  bindGlobalInteractions(config);

  window.addEventListener('routechange', (event) => {
    renderHeader(config, event.detail.path);
    closeMobileNavigation();
  });

  window.FlexNetApp = createRouter(config, {
    containerId: 'content-placeholder'
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
} else {
  initializeApp();
}
