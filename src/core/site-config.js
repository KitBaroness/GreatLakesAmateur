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

  /**
   * @pure
   * @param {String} query
   * @returns {String}
   */
  const buildOpenStreetMapSearchLink = (query) => (
    `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`
  );

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
    locationMap: {
      provider: 'Leaflet 2.0.0-alpha.1',
      moduleUrl: 'https://unpkg.com/leaflet@2.0.0-alpha.1/dist/leaflet.js',
      stylesheetUrl: 'https://unpkg.com/leaflet@2.0.0-alpha.1/dist/leaflet.css',
      center: [42.232, -83.672],
      zoom: 12,
      maxFitZoom: 14,
      tileLayer: {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      },
      locations: [
        {
          key: 'eagleCrestGolfClub',
          type: 'event',
          label: 'Event Location',
          title: 'Eagle Crest Golf Club',
          address: '1201 S. Huron Street, Ypsilanti, MI 48197',
          note: 'Great Lakes Amateur host course',
          coordinates: [42.225, -83.61056],
          mapUrl: buildOpenStreetMapSearchLink('Eagle Crest Golf Club, 1201 S. Huron Street, Ypsilanti, MI 48197')
        },
        {
          key: 'marriottEagleCrest',
          type: 'hotel',
          label: 'On-Site Hotel',
          title: 'Ann Arbor Marriott Ypsilanti at Eagle Crest',
          address: '1275 S. Huron Street, Ypsilanti, MI 48197',
          note: 'On site at Eagle Crest',
          coordinates: [42.22626, -83.61756],
          mapUrl: buildOpenStreetMapSearchLink('Ann Arbor Marriott Ypsilanti at Eagle Crest, 1275 S. Huron Street, Ypsilanti, MI 48197')
        },
        {
          key: 'hamptonYpsilanti',
          type: 'hotel',
          label: 'Nearby Hotel',
          title: 'Hampton Inn & Suites Ypsilanti',
          address: '515 James L Hart Parkway, Ypsilanti, MI 48197',
          note: 'Across the street from Eagle Crest',
          coordinates: [42.224907, -83.620962],
          mapUrl: buildOpenStreetMapSearchLink('Hampton Inn & Suites Ypsilanti, 515 James L Hart Parkway, Ypsilanti, MI 48197')
        },
        {
          key: 'fairfieldYpsilanti',
          type: 'hotel',
          label: 'Nearby Hotel',
          title: 'Fairfield Inn & Suites Ann Arbor Ypsilanti',
          address: '326 James L Hart Parkway, Ypsilanti, MI 48197',
          note: 'Across the street from Eagle Crest',
          coordinates: [42.2258574, -83.6193269],
          mapUrl: buildOpenStreetMapSearchLink('Fairfield Inn & Suites Ann Arbor Ypsilanti, 326 James L Hart Parkway, Ypsilanti, MI 48197')
        },
        {
          key: 'sheratonAnnArbor',
          type: 'hotel',
          label: 'Nearby Hotel',
          title: 'Sheraton Ann Arbor Hotel',
          address: '3200 Boardwalk Street, Ann Arbor, MI 48108',
          note: 'Less than 10 minutes from Eagle Crest',
          coordinates: [42.2404, -83.7356],
          mapUrl: buildOpenStreetMapSearchLink('Sheraton Ann Arbor Hotel, 3200 Boardwalk Street, Ann Arbor, MI 48108')
        }
      ]
    },
    payments: {
      fallbackPhone: paymentContact.phone,
      fallbackEmail: paymentContact.email,
      fallbackMessage: 'online checkout is not configured. Please contact Ryan Yip for payment options.',
      providerNotes: {
        note: 'Entry-fee checkout is intentionally not linked to the legacy Wix site. Visitor payment coordination should use the configured contact actions unless a dedicated checkout endpoint is added.'
      },
      entryFee: {
        key: 'entryFee',
        label: 'Great Lakes Amateur Entry Fee',
        amount: '$299',
        checkoutLabel: 'Entry Fee Inquiry',
        checkoutUrl: '',
        checkoutMode: 'contact',
        provider: 'Contact coordination',
        external: false
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
    },
    developerSignature: {
      enabled: true,
      jokes: [
        'FlexNet loaded with zero build step and a frankly suspicious amount of confidence.',
        'No node_modules folder was summoned. The fairway remains playable.',
        'BEM classes walked this CSS in a straight line. Mostly.',
        'The router is hash-based because server config had enough feelings already.',
        'Vanilla JS showed up in golf shoes and asked where the framework went.',
        'Inspect console unlocked: you found the tiny developer plaque behind the drywall.',
        'If this layout shifts, pretend it was reading the green.',
        'Tailwind is not here. Please leave utility-class confetti at the clubhouse.'
      ],
      signoffs: [
        'Hydrate nothing. Question everything. ~Kit Baroness',
        'May your cache be empty and your selectors obedient. ~Kit Baroness',
        'Tell the DOM I said behave. ~Kit Baroness',
        'Ship clean. Commit weird. ~Kit Baroness',
        'I was here, the bundle was small, and the console snitched. ~Kit Baroness',
        'Zero build step. Maximum side-eye. ~Kit Baroness',
        'If the divs ask, I was never here. ~Kit Baroness',
        'The CSS has boundaries. I am working on mine. ~Kit Baroness'
      ],
      styles: {
        joke: 'color:#0f2b37;background:#f8f6ef;border:1px solid #b9904d;padding:3px 7px;border-radius:4px;font-weight:800;line-height:1.6;',
        signoff: 'color:#f8f6ef;background:#173a4a;border:1px solid #b9904d;padding:3px 7px;border-radius:4px;font-style:italic;font-weight:800;line-height:1.6;'
      }
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
  const getDeveloperSignature = (config) => config.developerSignature;

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
   * @returns {Object}
   */
  const getLocationMap = (config) => config.locationMap;

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
    getDeveloperSignature,
    getPayments,
    getContact,
    getLocationMap,
    getContactAction,
    getPaymentOption,
    buildRoutes,
    findPageByRoute
  });

  window.FlexNetSiteConfig = SiteConfig;
})();
