/**
 * FlexNet sponsorship showcase view.
 * Logo carousel and testimonials hydrated from frozen site config.
 */

import { escapeHtml } from '../../utilities/escapeHtml.js';
import SiteConfig from '../../core/site-config.js';

const ROOT_SELECTOR = '[data-sponsorship-showcase]';
const TRACK_SELECTOR = '[data-sponsor-carousel-track]';
const TESTIMONIALS_SELECTOR = '[data-sponsor-testimonials-list]';

const runtime = Object.seal({
  root: null,
  intervalId: null,
  activeIndex: 0,
  slideCount: 0,
  clickHandler: null,
  pointerDownHandler: null,
  pointerUpHandler: null,
  dragStartX: 0
});

/**
 * @pure
 * @param {String} name
 * @returns {String}
 */
const createMonogram = (name) => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'SP';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

/**
 * @pure
 * @param {Object} config
 * @param {String} routePath
 * @returns {Boolean}
 */
const shouldRenderSponsorshipShowcase = (config, routePath) => (
  routePath === config.sponsorshipShowcase?.route
);

/**
 * @pure
 * @param {Object} logo
 * @returns {String}
 */
const createLogoSlideMarkup = (logo) => {
  const visual = logo.logo
    ? `<img class="c-sponsor-carousel__logo-image" src="${escapeHtml(logo.logo)}" alt="${escapeHtml(logo.name)} logo" loading="lazy">`
    : `<span class="c-sponsor-carousel__monogram" aria-hidden="true">${escapeHtml(createMonogram(logo.name))}</span>`;

  const inner = `
    <div class="c-sponsor-carousel__logo-card">
      ${visual}
      <p class="c-sponsor-carousel__logo-name">${escapeHtml(logo.name)}</p>
      <p class="c-sponsor-carousel__logo-tier">${escapeHtml(logo.tier)}</p>
    </div>
  `;

  if (logo.url) {
    return `
      <article class="c-sponsor-carousel__slide">
        <a class="c-sponsor-carousel__logo-link" href="${escapeHtml(logo.url)}" target="_blank" rel="noopener noreferrer">
          ${inner}
        </a>
      </article>
    `;
  }

  return `<article class="c-sponsor-carousel__slide">${inner}</article>`;
};

/**
 * @pure
 * @param {Array} logos
 * @returns {String}
 */
const createCarouselTrackMarkup = (logos) => (
  logos.map(createLogoSlideMarkup).join('')
);

/**
 * @pure
 * @param {Object} testimonial
 * @returns {String}
 */
const createTestimonialMarkup = (testimonial) => `
  <blockquote class="c-sponsor-testimonials__item">
    <p class="c-sponsor-testimonials__quote">“${escapeHtml(testimonial.quote)}”</p>
    <footer class="c-sponsor-testimonials__footer">
      <cite class="c-sponsor-testimonials__name">${escapeHtml(testimonial.name)}</cite>
      <p class="c-sponsor-testimonials__role">${escapeHtml(testimonial.role)}, ${escapeHtml(testimonial.company)}</p>
    </footer>
  </blockquote>
`;

/**
 * @pure
 * @param {Array} testimonials
 * @returns {String}
 */
const createTestimonialsMarkup = (testimonials) => (
  testimonials.map(createTestimonialMarkup).join('')
);

/**
 * @effect
 * @param {HTMLElement} root
 * @param {Number} index
 * @returns {void}
 */
const updateCarouselStatus = (root) => {
  const status = root.querySelector('[data-sponsor-carousel-status]');
  const slides = root.querySelectorAll('.c-sponsor-carousel__slide');

  if (!status || !slides.length) {
    return;
  }

  const activeSlide = slides[runtime.activeIndex];
  const logoName = activeSlide?.querySelector('img')?.alt?.replace(/\s+logo$/i, '') || `Sponsor ${runtime.activeIndex + 1}`;
  status.textContent = `Showing ${runtime.activeIndex + 1} of ${slides.length}: ${logoName}`;
};

/**
 * @effect
 * @param {HTMLElement} root
 * @param {Number} index
 * @returns {void}
 */
const setCarouselIndex = (root, index) => {
  const track = root.querySelector(TRACK_SELECTOR);
  const slides = root.querySelectorAll('.c-sponsor-carousel__slide');
  const dots = root.querySelectorAll('[data-sponsor-carousel-dot]');

  if (!track || !slides.length) return;

  runtime.activeIndex = ((index % slides.length) + slides.length) % slides.length;
  track.style.transform = `translateX(-${runtime.activeIndex * 100}%)`;

  dots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === runtime.activeIndex;
    dot.classList.toggle('c-sponsor-carousel__dot--active', isActive);
    dot.setAttribute('aria-current', isActive ? 'true' : 'false');
  });

  updateCarouselStatus(root);
};

/**
 * @effect
 * @param {HTMLElement} root
 * @param {Number} direction
 * @returns {void}
 */
const moveCarousel = (root, direction) => {
  setCarouselIndex(root, runtime.activeIndex + direction);
};

/**
 * @effect
 * @param {HTMLElement} root
 * @param {Number} intervalMs
 * @returns {void}
 */
const startCarouselAutoplay = (root, intervalMs) => {
  stopCarouselAutoplay();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || runtime.slideCount <= 1) {
    return;
  }

  runtime.intervalId = window.setInterval(() => {
    moveCarousel(root, 1);
  }, intervalMs);
};

/**
 * @effect
 * @returns {void}
 */
const stopCarouselAutoplay = () => {
  if (runtime.intervalId) {
    window.clearInterval(runtime.intervalId);
    runtime.intervalId = null;
  }
};

/**
 * @effect
 * @param {HTMLElement} root
 * @param {Object} showcase
 * @returns {void}
 */
const renderCarouselDots = (root, showcase) => {
  const host = root.querySelector('[data-sponsor-carousel-dots]');
  if (!host) return;

  host.innerHTML = showcase.logos.map((logo, index) => (
    `<button
      type="button"
      class="c-sponsor-carousel__dot${index === 0 ? ' c-sponsor-carousel__dot--active' : ''}"
      data-sponsor-carousel-dot
      data-slide-index="${index}"
      aria-label="Show sponsor ${escapeHtml(logo.name)}"
      aria-current="${index === 0 ? 'true' : 'false'}"
    ></button>`
  )).join('');
};

/**
 * @effect
 * @param {Object} config
 * @param {HTMLElement} root
 * @returns {void}
 */
const hydrateSponsorshipShowcase = (config, root) => {
  const showcase = SiteConfig.getSponsorshipShowcase(config);
  if (!showcase) return;

  const track = root.querySelector(TRACK_SELECTOR);
  const testimonialsHost = document.querySelector(TESTIMONIALS_SELECTOR);

  if (track && showcase.logos?.length) {
    let status = root.querySelector('[data-sponsor-carousel-status]');
    if (!status) {
      status = document.createElement('p');
      status.className = 'u-visually-hidden';
      status.setAttribute('data-sponsor-carousel-status', '');
      status.setAttribute('aria-live', 'polite');
      root.querySelector('.c-sponsor-carousel__frame')?.prepend(status);
    }

    track.innerHTML = createCarouselTrackMarkup(showcase.logos);
    runtime.slideCount = showcase.logos.length;
    renderCarouselDots(root, showcase);
    setCarouselIndex(root, 0);
    startCarouselAutoplay(root, showcase.carouselIntervalMs || 5000);
  }

  if (testimonialsHost && showcase.testimonials?.length) {
    testimonialsHost.innerHTML = createTestimonialsMarkup(showcase.testimonials);
  }
};

/**
 * @effect
 * @returns {void}
 */
const resetSponsorshipShowcase = () => {
  stopCarouselAutoplay();

  if (runtime.root && runtime.clickHandler) {
    runtime.root.removeEventListener('click', runtime.clickHandler);
  }

  if (runtime.root && runtime.pointerDownHandler) {
    runtime.root.removeEventListener('pointerdown', runtime.pointerDownHandler);
    runtime.root.removeEventListener('pointerup', runtime.pointerUpHandler);
  }

  runtime.root = null;
  runtime.clickHandler = null;
  runtime.pointerDownHandler = null;
  runtime.pointerUpHandler = null;
  runtime.activeIndex = 0;
  runtime.slideCount = 0;
};

/**
 * @effect
 * @param {Object} config
 * @param {HTMLElement} root
 * @returns {void}
 */
const bindCarouselInteractions = (config, root) => {
  runtime.root = root;

  runtime.clickHandler = (event) => {
    if (event.target.closest('[data-sponsor-carousel-prev]')) {
      event.preventDefault();
      moveCarousel(root, -1);
      startCarouselAutoplay(root, config.sponsorshipShowcase.carouselIntervalMs || 5000);
      return;
    }

    if (event.target.closest('[data-sponsor-carousel-next]')) {
      event.preventDefault();
      moveCarousel(root, 1);
      startCarouselAutoplay(root, config.sponsorshipShowcase.carouselIntervalMs || 5000);
      return;
    }

    const dot = event.target.closest('[data-sponsor-carousel-dot]');
    if (dot) {
      event.preventDefault();
      setCarouselIndex(root, Number(dot.dataset.slideIndex));
      startCarouselAutoplay(root, config.sponsorshipShowcase.carouselIntervalMs || 5000);
    }
  };

  runtime.pointerDownHandler = (event) => {
    if (!event.target.closest('[data-sponsor-carousel-track-wrap]')) return;
    runtime.dragStartX = event.clientX;
  };

  runtime.pointerUpHandler = (event) => {
    if (!runtime.dragStartX) return;

    const delta = event.clientX - runtime.dragStartX;
    runtime.dragStartX = 0;

    if (Math.abs(delta) < 40) return;

    moveCarousel(root, delta > 0 ? -1 : 1);
    startCarouselAutoplay(root, config.sponsorshipShowcase.carouselIntervalMs || 5000);
  };

  root.addEventListener('click', runtime.clickHandler);
  root.addEventListener('pointerdown', runtime.pointerDownHandler);
  root.addEventListener('pointerup', runtime.pointerUpHandler);
};

/**
 * @effect
 * @param {Object} config
 * @param {String} routePath
 * @returns {void}
 */
export const initSponsorshipShowcase = (config, routePath) => {
  if (!shouldRenderSponsorshipShowcase(config, routePath)) {
    resetSponsorshipShowcase();
    return;
  }

  const root = document.querySelector(ROOT_SELECTOR);
  if (!root) return;

  resetSponsorshipShowcase();
  hydrateSponsorshipShowcase(config, root);
  bindCarouselInteractions(config, root);
};
