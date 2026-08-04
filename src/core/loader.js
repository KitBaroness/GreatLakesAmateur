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
 * @param {HTMLAnchorElement} link
 * @param {Object} payment
 * @returns {void}
 */
const hydratePaymentLink = (link, payment) => {
  const url = payment.checkoutUrl;
  const label = payment.checkoutLabel || payment.label;
  const title = `${label} - ${payment.label} ${payment.amount}`.trim();
  const isExternalPage = payment.external && /^https?:\/\//i.test(url);

  link.setAttribute('href', url);
  link.setAttribute('title', title);
  link.setAttribute('aria-label', title);
  link.setAttribute('data-payment-status', 'ready');

  if (isExternalPage) {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  } else {
    link.removeAttribute('target');
    link.removeAttribute('rel');
  }

  const labelTarget = link.querySelector('[data-payment-label-target]');
  const image = link.querySelector('img');

  if (labelTarget) {
    labelTarget.textContent = label;
  } else if (!image && label) {
    link.textContent = label;
  }

  if (image) {
    image.setAttribute('alt', label);
  }
};

/**
 * @effect
 * @param {HTMLAnchorElement} link
 * @returns {void}
 */
const markPaymentLinkUnconfigured = (link) => {
  link.setAttribute('href', '#');
  link.setAttribute('data-payment-status', 'unconfigured');
  link.removeAttribute('target');
  link.removeAttribute('rel');
};

/**
 * @effect
 * @param {Object} config
 * @returns {void}
 */
const hydratePaymentLinks = (config) => {
  const getPaymentOption = window.FlexNetSiteConfig?.getPaymentOption;

  document.querySelectorAll('[data-payment-key]').forEach((link) => {
    const key = link.getAttribute('data-payment-key');
    const payment = getPaymentOption ? getPaymentOption(config, key) : null;

    if (payment?.checkoutUrl) {
      hydratePaymentLink(link, payment);
      return;
    }

    markPaymentLinkUnconfigured(link);
  });
};

/**
 * @pure
 * @param {HTMLElement} trigger
 * @param {Object} config
 * @returns {Object|null}
 */
const getPaymentForTrigger = (trigger, config) => {
  const key = trigger.getAttribute('data-payment-key');
  return key ? window.FlexNetSiteConfig?.getPaymentOption(config, key) : null;
};

/**
 * @effect
 * @param {HTMLElement} trigger
 * @returns {void}
 */
const handlePaymentFallback = (trigger, config) => {
  const configuredPayment = getPaymentForTrigger(trigger, config);
  const label = configuredPayment?.label || trigger.getAttribute('data-payment-label') || 'Payment';
  const payment = window.FlexNetSiteConfig?.getPayments(config);
  const message = payment
    ? `${label} ${payment.fallbackMessage} Phone: ${payment.fallbackPhone}. Email: ${payment.fallbackEmail}.`
    : `${label} checkout link is not configured yet.`;

  window.alert(message);
};

/**
 * @effect
 * @returns {void}
 */
const bindGlobalInteractions = (config) => {
  document.addEventListener('click', (event) => {
    const paymentTrigger = event.target.closest('[data-payment-key], [data-payment-placeholder]');
    if (paymentTrigger) {
      const configuredPayment = getPaymentForTrigger(paymentTrigger, config);

      if (configuredPayment?.checkoutUrl && paymentTrigger.getAttribute('href') !== '#') {
        return;
      }

      event.preventDefault();
      handlePaymentFallback(paymentTrigger, config);
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
  hydratePaymentLinks(config);

  window.addEventListener('routechange', (event) => {
    renderHeader(config, event.detail.path);
    closeMobileNavigation();
    hydratePaymentLinks(config);
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
