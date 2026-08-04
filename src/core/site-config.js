// FlexNet-style site configuration for Michigan Players Golf Club.
// Pure data and pure query helpers. Runtime side effects live in loader/router modules.

(function () {
  'use strict';

  /**
   * Deep-freeze a value so application data remains immutable after boot.
   * @pure
   * @param {*} value
   * @returns {*}
   */
  const deepFreeze = (value) => {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
      return value;
    }

    Object.getOwnPropertyNames(value).forEach((key) => deepFreeze(value[key]));
    return Object.freeze(value);
  };

  const paymentContact = {
    phone: '330-990-7738',
    phoneE164: '+13309907738',
    email: 'yipper.rmy@gmail.com'
  };

  /**
   * @pure
   * @param {Object} params
   * @returns {String}
   */
  const buildMailtoLink = ({ subject, body }) => (
    `mailto:${paymentContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  );

  /**
   * @pure
   * @param {String} body
   * @returns {String}
   */
  const buildSmsLink = (body) => `sms:${paymentContact.phoneE164}?body=${encodeURIComponent(body)}`;

  const inquiryCopy = {
    general: [
      'Hello Ryan,',
      '',
      'I am contacting you about the Great Lakes Amateur. Please let me know the best next step.',
      '',
      'Name:',
      'Phone:',
      'Inquiry:'
    ].join('\n'),
    entryFee: [
      'Hello Ryan,',
      '',
      'I am interested in the 2026 Great Lakes Amateur entry fee and payment options. Please send the next steps for enrollment.',
      '',
      'Name:',
      'Phone:',
      'Player Name:',
      'Question:'
    ].join('\n'),
    sponsorship: [
      'Hello Ryan,',
      '',
      'I am interested in Great Lakes Amateur sponsorship opportunities. Please send the next steps for sponsorship payment and deliverables.',
      '',
      'Name:',
      'Company:',
      'Phone:',
      'Sponsorship Interest:'
    ].join('\n')
  };

  /**
   * @pure
   * @param {Object} params
   * @returns {String}
   */
  const buildSponsorInvoiceLink = ({ label, amount }) => {
    const subject = `${label} Invoice Request`;
    const body = [
      `I would like to sponsor the Great Lakes Amateur as the ${label} for ${amount}.`,
      '',
      'Please send payment instructions and sponsorship next steps.'
    ].join('\n');

    return buildMailtoLink({ subject, body });
  };

  const siteConfig = deepFreeze({
    version: '2.0.0',
    brand: {
      name: 'Michigan Players Golf Club',
      shortName: 'Michigan Players',
      logo: 'assets/images/logo.jpg',
      logoAlt: 'Michigan Players Amateur',
      homeRoute: '/home'
    },
    assets: {
      hero: 'assets/images/hero.jpeg',
      sidebar: 'assets/images/sidebar.jpg',
      payButton: 'assets/images/pay-button.png'
    },
    callsToAction: [
      {
        label: 'Tournament',
        route: '/event-details',
        variant: 'secondary'
      },
      {
        label: 'Get in Touch',
        route: '/contact',
        variant: 'primary'
      }
    ],
    navigation: [
      {
        label: 'Home',
        route: '/home',
        view: 'public/views/home/index.html',
        title: 'Michigan Players Golf Club | Great Lakes Amateur',
        description: 'Michigan Players Golf Club presents the 2nd Annual Great Lakes Amateur golf tournament, August 17-19, 2026.'
      },
      {
        label: 'Upcoming Events',
        route: '/upcoming-events',
        view: 'public/views/upcoming-events/index.html',
        title: 'Upcoming Events | Great Lakes Amateur',
        description: 'Upcoming events from Michigan Players Golf Club.'
      },
      {
        label: 'Contact',
        route: '/contact',
        view: 'public/views/contact/index.html',
        title: 'Contact | Great Lakes Amateur',
        description: 'Contact Michigan Players Golf Club for tournament inquiries and information.'
      },
      {
        label: 'Event Details',
        route: '/event-details',
        view: 'public/views/event-details/index.html',
        title: 'Event Details | Great Lakes Amateur',
        description: 'Great Lakes Amateur tournament information - dates, format, entry requirements, and prizes.'
      },
      {
        label: 'Sponsorship Opportunities',
        route: '/sponsorship',
        view: 'public/views/sponsorship/index.html',
        title: 'Sponsorship Opportunities | Great Lakes Amateur',
        description: 'Sponsorship opportunities for the Great Lakes Amateur golf tournament.'
      }
    ],
    contact: {
      name: 'Ryan Yip',
      role: 'Tournament Committee',
      phoneDisplay: paymentContact.phone,
      phoneHref: `tel:${paymentContact.phoneE164}`,
      smsHref: buildSmsLink(inquiryCopy.general),
      email: paymentContact.email,
      emailHref: buildMailtoLink({
        subject: 'Great Lakes Amateur Inquiry',
        body: inquiryCopy.general
      }),
      actions: {
        callGeneral: {
          key: 'callGeneral',
          label: 'Call Ryan',
          href: `tel:${paymentContact.phoneE164}`,
          title: 'Call Ryan Yip about the Great Lakes Amateur'
        },
        smsGeneral: {
          key: 'smsGeneral',
          label: 'Text Ryan',
          href: buildSmsLink(inquiryCopy.general),
          title: 'Text Ryan Yip about the Great Lakes Amateur'
        },
        emailGeneral: {
          key: 'emailGeneral',
          label: 'Email Ryan',
          href: buildMailtoLink({
            subject: 'Great Lakes Amateur Inquiry',
            body: inquiryCopy.general
          }),
          title: 'Email Ryan Yip about the Great Lakes Amateur'
        },
        smsEntryFee: {
          key: 'smsEntryFee',
          label: 'Text About Entry Fee',
          href: buildSmsLink(inquiryCopy.entryFee),
          title: 'Text Ryan Yip about the Great Lakes Amateur entry fee'
        },
        emailEntryFee: {
          key: 'emailEntryFee',
          label: 'Email Entry Fee Inquiry',
          href: buildMailtoLink({
            subject: 'Great Lakes Amateur Entry Fee Inquiry',
            body: inquiryCopy.entryFee
          }),
          title: 'Email Ryan Yip about the Great Lakes Amateur entry fee'
        },
        smsSponsorship: {
          key: 'smsSponsorship',
          label: 'Text About Sponsorship',
          href: buildSmsLink(inquiryCopy.sponsorship),
          title: 'Text Ryan Yip about Great Lakes Amateur sponsorship'
        },
        emailSponsorship: {
          key: 'emailSponsorship',
          label: 'Email Sponsorship Inquiry',
          href: buildMailtoLink({
            subject: 'Great Lakes Amateur Sponsorship Inquiry',
            body: inquiryCopy.sponsorship
          }),
          title: 'Email Ryan Yip about Great Lakes Amateur sponsorship'
        }
      }
    },
    payments: {
      fallbackPhone: paymentContact.phone,
      fallbackEmail: paymentContact.email,
      fallbackMessage: 'checkout link is not configured yet. Please contact Ryan Yip for payment options.',
      providerNotes: {
        wixAppId: 'cdd4b6d5-6fb4-4bd1-9189-791244b5361e',
        wixOrderEndpoint: 'https://www.michiganplayersgolfclub.com/_api/payment-paybutton-web/paybutton/v2/orders',
        note: 'Wix Pay creates orders inside the Wix runtime and does not expose product IDs as direct checkout URLs.'
      },
      entryFee: {
        key: 'entryFee',
        label: 'Great Lakes Amateur Entry Fee',
        amount: '$299',
        checkoutLabel: 'Pay Entry Fee',
        checkoutUrl: 'https://www.michiganplayersgolfclub.com/event-details',
        checkoutMode: 'iframe',
        iframeUrl: 'https://www.michiganplayersgolfclub.com/event-details#comp-m9skg2mt',
        iframeTitle: 'Great Lakes Amateur Entry Fee Checkout',
        provider: 'Wix Pay Button iframe',
        external: false,
        productIds: {
          home: 'fd8b841c-2648-4b24-96b2-eb33e37890dd',
          eventDetails: 'e3f799b1-ef40-458c-a316-c540b2c84922'
        }
      },
      sponsorships: {
        titleSponsor: {
          key: 'titleSponsor',
          label: 'Tournament and Website Title Sponsor',
          amount: '$3,000',
          checkoutLabel: 'Request Sponsor Invoice',
          checkoutUrl: buildSponsorInvoiceLink({
            label: 'Tournament and Website Title Sponsor',
            amount: '$3,000'
          }),
          provider: 'Email invoice request',
          external: false
        },
        lunchSponsor: {
          key: 'lunchSponsor',
          label: 'Great Lakes Amateur Lunch Sponsor',
          amount: '$1,000',
          checkoutLabel: 'Request Sponsor Invoice',
          checkoutUrl: buildSponsorInvoiceLink({
            label: 'Great Lakes Amateur Lunch Sponsor',
            amount: '$1,000'
          }),
          provider: 'Email invoice request',
          external: false
        },
        puttingGreenSponsor: {
          key: 'puttingGreenSponsor',
          label: 'Great Lakes Amateur Putting Green Sponsor',
          amount: '$1,000',
          checkoutLabel: 'Request Sponsor Invoice',
          checkoutUrl: buildSponsorInvoiceLink({
            label: 'Great Lakes Amateur Putting Green Sponsor',
            amount: '$1,000'
          }),
          provider: 'Email invoice request',
          external: false
        },
        drivingRangeSponsor: {
          key: 'drivingRangeSponsor',
          label: 'Great Lakes Amateur Driving Range Sponsor',
          amount: '$1,000',
          checkoutLabel: 'Request Sponsor Invoice',
          checkoutUrl: buildSponsorInvoiceLink({
            label: 'Great Lakes Amateur Driving Range Sponsor',
            amount: '$1,000'
          }),
          provider: 'Email invoice request',
          external: false
        }
      }
    },
    footer: {
      copyright: '&copy; 2026 Michigan Players Golf Club. Great Lakes Amateur.'
    }
  });

  /**
   * @pure
   * @param {Object} config
   * @returns {Array}
   */
  const getNavigation = (config) => config.navigation;

  /**
   * @pure
   * @param {Object} config
   * @returns {String}
   */
  const getDefaultRoute = (config) => config.brand.homeRoute;

  /**
   * @pure
   * @param {Object} config
   * @returns {Object}
   */
  const getBrand = (config) => config.brand;

  /**
   * @pure
   * @param {Object} config
   * @returns {Object}
   */
  const getAssets = (config) => config.assets;

  /**
   * @pure
   * @param {Object} config
   * @returns {Array}
   */
  const getCallsToAction = (config) => config.callsToAction;

  /**
   * @pure
   * @param {Object} config
   * @returns {Object}
   */
  const getFooter = (config) => config.footer;

  /**
   * @pure
   * @param {Object} config
   * @returns {Object}
   */
  const getPayments = (config) => config.payments;

  /**
   * @pure
   * @param {Object} config
   * @returns {Object}
   */
  const getContact = (config) => config.contact;

  /**
   * @pure
   * @param {Object} config
   * @param {String} key
   * @returns {Object|null}
   */
  const getContactAction = (config, key) => {
    const contact = getContact(config);
    return contact.actions[key] || null;
  };

  /**
   * @pure
   * @param {Object} config
   * @param {String} key
   * @returns {Object|null}
   */
  const getPaymentOption = (config, key) => {
    const payments = getPayments(config);
    const sponsorships = payments.sponsorships || {};
    const options = [
      payments.entryFee,
      ...Object.keys(sponsorships).map((sponsorshipKey) => sponsorships[sponsorshipKey])
    ].filter(Boolean);

    return options.find((option) => option.key === key) || null;
  };

  /**
   * @pure
   * @param {Object} config
   * @returns {Array}
   */
  const buildRoutes = (config) => {
    const homeRoute = getDefaultRoute(config);
    const routes = config.navigation.map((page) => ({
      path: page.route,
      view: page.view,
      label: page.label,
      title: page.title,
      description: page.description
    }));

    return deepFreeze([
      {
        path: '/',
        redirect: homeRoute,
        label: 'Home',
        title: config.navigation[0].title,
        description: config.navigation[0].description
      },
      ...routes
    ]);
  };

  /**
   * @pure
   * @param {Object} config
   * @param {String} path
   * @returns {Object|null}
   */
  const findPageByRoute = (config, path) => {
    const routes = buildRoutes(config);
    return routes.find((route) => route.path === path) || null;
  };

  const SiteConfig = deepFreeze({
    config: siteConfig,
    deepFreeze,
    getNavigation,
    getDefaultRoute,
    getBrand,
    getAssets,
    getCallsToAction,
    getFooter,
    getPayments,
    getContact,
    getContactAction,
    getPaymentOption,
    buildRoutes,
    findPageByRoute
  });

  window.FlexNetSiteConfig = SiteConfig;
})();
