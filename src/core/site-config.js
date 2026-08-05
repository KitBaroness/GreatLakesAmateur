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
   * @param {String} amount
   * @returns {Number}
   */
  const parseAmountNumeric = (amount) => {
    const digits = String(amount || '').replace(/[^\d.]/g, '');
    const value = Number.parseFloat(digits);
    return Number.isFinite(value) ? value : 0;
  };

  /**
   * @pure
   * @param {Object} params
   * @returns {String}
   */
  const buildVenmoPaymentUrl = ({ recipient, amountNumeric, note }) => {
    const amount = amountNumeric.toFixed(2);
    const encodedNote = encodeURIComponent(note);
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      return `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(recipient)}&amount=${amount}&note=${encodedNote}`;
    }

    return `https://account.venmo.com/pay?recipients=${encodeURIComponent(recipient)}&amount=${amount}&note=${encodedNote}`;
  };

  /**
   * Build a Google Maps search URL from a venue listing (title + address).
   * Address-based search resolves the correct place better than raw coordinates.
   * @pure
   * @param {String} title
   * @param {String} address
   * @returns {String}
   */
  const buildGoogleMapsSearchLink = (title, address) => (
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title}, ${address}`)}`
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
        label: 'Register',
        route: '/register',
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
        label: 'Register',
        route: '/register',
        view: 'public/views/register/index.html',
        title: 'Register | Great Lakes Amateur',
        description: 'Register for the Great Lakes Amateur, pay through Venmo, and send your invoice to the tournament committee.'
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
        label: 'Sponsorship',
        route: '/sponsorship',
        view: 'public/views/sponsorship/index.html',
        title: 'Sponsorship | Great Lakes Amateur',
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
      provider: 'Leaflet 1.9.4',
      moduleUrl: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
      moduleIntegrity: 'sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH',
      stylesheetUrl: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
      stylesheetIntegrity: 'sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H',
      fallbackModuleUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
      fallbackModuleIntegrity: 'sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH',
      fallbackStylesheetUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',
      fallbackStylesheetIntegrity: 'sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H',
      contactRoute: '/contact',
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
          mapUrl: buildGoogleMapsSearchLink('Eagle Crest Golf Club', '1201 S. Huron Street, Ypsilanti, MI 48197')
        },
        {
          key: 'marriottEagleCrest',
          type: 'hotel',
          label: 'On-Site Hotel',
          title: 'Ann Arbor Marriott Ypsilanti at Eagle Crest',
          address: '1275 S. Huron Street, Ypsilanti, MI 48197',
          note: 'On site at Eagle Crest',
          coordinates: [42.22626, -83.61756],
          mapUrl: buildGoogleMapsSearchLink('Ann Arbor Marriott Ypsilanti at Eagle Crest', '1275 S. Huron Street, Ypsilanti, MI 48197')
        },
        {
          key: 'hamptonYpsilanti',
          type: 'hotel',
          label: 'Nearby Hotel',
          title: 'Hampton Inn & Suites Ypsilanti',
          address: '515 James L Hart Parkway, Ypsilanti, MI 48197',
          note: 'Across the street from Eagle Crest',
          coordinates: [42.224907, -83.620962],
          mapUrl: buildGoogleMapsSearchLink('Hampton Inn & Suites Ypsilanti', '515 James L Hart Parkway, Ypsilanti, MI 48197')
        },
        {
          key: 'fairfieldYpsilanti',
          type: 'hotel',
          label: 'Nearby Hotel',
          title: 'Fairfield Inn & Suites Ann Arbor Ypsilanti',
          address: '326 James L Hart Parkway, Ypsilanti, MI 48197',
          note: 'Across the street from Eagle Crest',
          coordinates: [42.2258574, -83.6193269],
          mapUrl: buildGoogleMapsSearchLink('Fairfield Inn & Suites Ann Arbor Ypsilanti', '326 James L Hart Parkway, Ypsilanti, MI 48197')
        },
        {
          key: 'sheratonAnnArbor',
          type: 'hotel',
          label: 'Nearby Hotel',
          title: 'Sheraton Ann Arbor Hotel',
          address: '3200 Boardwalk Street, Ann Arbor, MI 48108',
          note: 'Less than 10 minutes from Eagle Crest',
          coordinates: [42.2404, -83.7356],
          mapUrl: buildGoogleMapsSearchLink('Sheraton Ann Arbor Hotel', '3200 Boardwalk Street, Ann Arbor, MI 48108')
        }
      ]
    },
    payments: {
      fallbackPhone: paymentContact.phone,
      fallbackEmail: paymentContact.email,
      fallbackMessage: 'online checkout is not configured. Please contact Ryan Yip for payment options.',
      venmoRecipient: 'ryanyipgolf',
      invoicePrefix: 'GLA',
      providerNotes: {
        note: 'Registration uses Venmo payment plus email or SMS invoice delivery to Ryan for payment tracking.'
      },
      entryFee: {
        key: 'entryFee',
        label: 'Great Lakes Amateur Entry Fee',
        amount: '$299',
        amountNumeric: 299,
        category: 'Tournament Entry',
        checkoutLabel: 'Pay Entry Fee',
        checkoutUrl: '',
        checkoutMode: 'registration',
        provider: 'Venmo',
        external: false
      },
      membership: {
        key: 'membership',
        label: 'Michigan Players Golf Club Membership',
        amount: '$150',
        amountNumeric: 150,
        category: 'Membership',
        checkoutLabel: 'Pay Membership',
        checkoutUrl: '',
        checkoutMode: 'registration',
        provider: 'Venmo',
        external: false
      },
      sponsorships: {
        titleSponsor: {
          key: 'titleSponsor',
          label: 'Tournament and Website Title Sponsor',
          amount: '$3,000',
          amountNumeric: 3000,
          category: 'Sponsorship',
          checkoutLabel: 'Pay Title Sponsorship',
          checkoutUrl: '',
          checkoutMode: 'registration',
          provider: 'Venmo',
          external: false
        },
        lunchSponsor: {
          key: 'lunchSponsor',
          label: 'Great Lakes Amateur Lunch Sponsor',
          amount: '$1,000',
          amountNumeric: 1000,
          category: 'Sponsorship',
          checkoutLabel: 'Pay Lunch Sponsorship',
          checkoutUrl: '',
          checkoutMode: 'registration',
          provider: 'Venmo',
          external: false
        },
        puttingGreenSponsor: {
          key: 'puttingGreenSponsor',
          label: 'Great Lakes Amateur Putting Green Sponsor',
          amount: '$1,000',
          amountNumeric: 1000,
          category: 'Sponsorship',
          checkoutLabel: 'Pay Putting Green Sponsorship',
          checkoutUrl: '',
          checkoutMode: 'registration',
          provider: 'Venmo',
          external: false
        },
        drivingRangeSponsor: {
          key: 'drivingRangeSponsor',
          label: 'Great Lakes Amateur Driving Range Sponsor',
          amount: '$1,000',
          amountNumeric: 1000,
          category: 'Sponsorship',
          checkoutLabel: 'Pay Driving Range Sponsorship',
          checkoutUrl: '',
          checkoutMode: 'registration',
          provider: 'Venmo',
          external: false
        }
      }
    },
    sponsorshipShowcase: {
      route: '/sponsorship',
      carouselIntervalMs: 5000,
      logos: [
        {
          key: 'greatLakesAmateur',
          name: 'Great Lakes Amateur',
          tier: 'Championship',
          logo: 'assets/images/sponsors/great-lakes-amateur.png',
          url: ''
        },
        {
          key: 'worldAmateurGolfRanking',
          name: 'World Amateur Golf Ranking',
          tier: 'WAGR Ranked Event',
          logo: 'assets/images/sponsors/world-amateur-golf-ranking.png',
          url: 'https://www.wagr.com/'
        },
        {
          key: 'eagleCrest',
          name: 'Eagle Crest Golf Club',
          tier: 'Host Course',
          logo: 'assets/images/sponsors/eagle-crest-golf-club.svg',
          url: 'https://www.eaglecrestresort.com/'
        },
        {
          key: 'easternMichiganGolf',
          name: 'Eastern Michigan Golf',
          tier: 'Home Course of EMU Golf',
          logo: 'assets/images/sponsors/eastern-michigan-golf.svg',
          url: 'https://emueagles.com/sports/mens-golf'
        },
        {
          key: 'michiganPlayers',
          name: 'Michigan Players Golf Club',
          tier: 'Presenting Organization',
          logo: 'assets/images/logo.jpg',
          url: ''
        }
      ],
      testimonials: [
        {
          key: 'mondayQInfo',
          quote: 'I caddied for Ryan Yip when he won on the Canadian Tour in 2009. He stopped playing to become asst coach at Kent State and is now at Eastern Michigan. He is also putting on a AM event this summer in MI. \u2026 Going to be a great event',
          name: 'Monday Q Info',
          role: '@acaseofthegolf1',
          company: 'X (Twitter), May 2025'
        },
        {
          key: 'carlosMonarrez',
          quote: 'What makes this (Eagle Crest) an outstanding course is the marriage between challenge and beauty that comes in the form of natural unadornment.',
          name: 'Carlos Monarrez',
          role: 'Sports Columnist',
          company: 'Detroit Free Press'
        },
        {
          key: 'ryanYip',
          quote: 'The Great Lakes Amateur will test you physically and mentally. Eagle Crest challenges skilled amateur golfers with a mix of short and long holes along Ford Lake. Good scores are possible if your game is sharp.',
          name: 'Ryan Yip',
          role: 'Tournament Director',
          company: '@ryanyipgolf'
        },
        {
          key: 'kitBaroness',
          quote: 'Ryan Yip is an affluent and seasoned professional; working with him was a pleasure to bring the Great Lakes Amateur tournament site to life. Now competitor listings, registration, and player stats are easier to stay on the same page through tournament week.',
          name: 'Kit Baroness, DBA',
          role: 'Developer',
          company: '@kitbaroness · X (Twitter)'
        }
      ]
    },
    registration: {
      route: '/register',
      storageKey: 'flexnet:registration:draft',
      steps: Object.freeze(['details', 'invoice', 'venmo', 'send']),
      venmoRecipient: 'ryanyipgolf',
      invoicePrefix: 'GLA',
      organization: 'Michigan Players Golf Club',
      eventName: '2nd Annual Great Lakes Amateur',
      eventDates: 'August 17-19, 2026',
      payeeName: 'Ryan Yip',
      payeeEmail: paymentContact.email,
      payeePhone: paymentContact.phone,
      payeePhoneE164: paymentContact.phoneE164,
      jspdf: {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        integrity: 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk'
      }
    },
    footer: {
      copyright: '© 2026 Michigan Players Golf Club. Great Lakes Amateur.'
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
   * @returns {Object}
   */
  const getRegistration = (config) => config.registration;

  /**
   * @pure
   * @param {Object} config
   * @returns {Array}
   */
  const getRegistrationFeeOptions = (config) => {
    const payments = getPayments(config);
    const sponsorships = payments.sponsorships || {};

    return [
      payments.entryFee,
      payments.membership,
      ...Object.keys(sponsorships).map((key) => sponsorships[key])
    ].filter(Boolean);
  };

  /**
   * @pure
   * @param {Object} config
   * @param {String} key
   * @returns {Object|null}
   */
  const getRegistrationFeeOption = (config, key) => (
    getRegistrationFeeOptions(config).find((option) => option.key === key) || null
  );
  /**
   * @pure
   * @param {Object} config
   * @returns {Object}
   */
  const getSponsorshipShowcase = (config) => config.sponsorshipShowcase;

  const getPaymentOption = (config, key) => getRegistrationFeeOption(config, key);

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
    getRegistration,
    getRegistrationFeeOptions,
    getRegistrationFeeOption,
    getSponsorshipShowcase,
    buildGoogleMapsSearchLink,
    buildVenmoPaymentUrl,
    parseAmountNumeric,
    buildMailtoLink,
    buildSmsLink,
    getContactAction,
    getPaymentOption,
    buildRoutes,
    findPageByRoute
  });

  window.FlexNetSiteConfig = SiteConfig;
})();
