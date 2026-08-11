// FlexNet-style site configuration for Michigan Players Golf Club.
// Pure data and pure query helpers. Runtime side effects live in loader/router modules.

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

  const siteConfig = deepFreeze({
    version: '2.0.2',
    brand: {
      name: 'Michigan Players Golf Club',
      shortName: 'Michigan Players',
      logo: 'assets/images/logo.jpg',
      logoAlt: 'Michigan Players Amateur',
      homeRoute: '/home'
    },
    seo: {
      // Update siteUrl to the deployed domain before launch. Canonical and
      // Open Graph URLs are built from it.
      siteUrl: 'https://www.michiganplayersgolfclub.com',
      siteName: 'Michigan Players Golf Club',
      locale: 'en_US',
      themeColor: '#173a4a',
      twitterSite: '@ryanyipgolf',
      ogImage: 'assets/images/og-image.jpg',
      ogImageWidth: 1200,
      ogImageHeight: 630,
      ogImageAlt: 'Great Lakes Amateur, August 17-19, 2026, Eagle Crest Golf Club, Ypsilanti, Michigan'
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
        title: 'Great Lakes Amateur 2026 | Michigan Players Golf Club',
        description: 'The 2nd Annual Great Lakes Amateur, a 54-hole stroke play championship at Eagle Crest Golf Club in Ypsilanti, Michigan, August 17-19, 2026. $299 entry, 90-player field.'
      },
      {
        label: 'Upcoming Events',
        route: '/upcoming-events',
        view: 'public/views/upcoming-events/index.html',
        title: 'Upcoming Golf Events at Eagle Crest | Michigan Players Golf Club',
        description: 'Tournament play, junior and family summer golf camps, and one-on-one playing lessons at Eagle Crest Golf Club in Ypsilanti, Michigan.'
      },
      {
        label: 'Register',
        route: '/register',
        view: 'public/views/register/index.html',
        title: 'Register for the Great Lakes Amateur 2026 | Entry $299',
        description: 'Register for the Great Lakes Amateur, practice rounds, membership, and sponsorship fees. Select one or more fees on a combined invoice and pay through Venmo.'
      },
      {
        label: 'Contact',
        route: '/contact',
        view: 'public/views/contact/index.html',
        title: 'Contact and Directions | Great Lakes Amateur',
        description: 'Contact tournament director Ryan Yip about the Great Lakes Amateur, and find directions to Eagle Crest Golf Club plus nearby Ypsilanti hotels.'
      },
      {
        label: 'Event Details',
        route: '/event-details',
        view: 'public/views/event-details/index.html',
        title: 'Tournament Information, Schedule and Prizes | Great Lakes Amateur 2026',
        description: 'Great Lakes Amateur tournament details: 54-hole stroke play format, round times, USGA handicap entry requirements, $1,800 in cash prizes, course details, and nearby hotels.'
      },
      {
        label: 'Sponsorship',
        route: '/sponsorship',
        view: 'public/views/sponsorship/index.html',
        title: 'Sponsorship Opportunities | Great Lakes Amateur 2026',
        description: 'Title, lunch, putting green, and driving range sponsorships for the Great Lakes Amateur golf tournament at Eagle Crest Golf Club in Ypsilanti, Michigan.'
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
      entryFee: {
        key: 'entryFee',
        label: 'Great Lakes Amateur Entry Fee',
        shortLabel: 'Entry Fee',
        amount: '$299',
        amountNumeric: 299,
        category: 'Tournament Entry',
        checkoutLabel: 'Pay Entry Fee',
        checkoutUrl: '',
        checkoutMode: 'registration',
        provider: 'Venmo',
        external: false
      },
      practiceRound: {
        key: 'practiceRound',
        label: 'Pre-Tournament Practice Round — Sunday, August 16, 2026 (after 2:00 PM)',
        shortLabel: 'Practice Round (Sun Aug 16)',
        amount: '$50',
        amountNumeric: 50,
        category: 'Practice Round',
        checkoutLabel: 'Pay Practice Round',
        checkoutUrl: '',
        checkoutMode: 'registration',
        provider: 'Venmo',
        external: false
      },
      membership: {
        key: 'membership',
        label: 'Michigan Players Golf Club Membership',
        shortLabel: 'MPGC Membership',
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
          shortLabel: 'Title Sponsor',
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
          shortLabel: 'Lunch Sponsor',
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
          shortLabel: 'Putting Green Sponsor',
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
          shortLabel: 'Driving Range Sponsor',
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
      copyright: '© 2026 Michigan Players Golf Club. Great Lakes Amateur.',
      legal: {
        triggerLabel: 'Terms of use',
        dialogTitle: 'Website Terms of Use',
        intro: 'Using this website means you accept these terms. If you do not agree, do not use the site.',
        closingNote: 'Last updated August 2026. Michigan Players Golf Club may revise these terms at any time. Continued use constitutes acceptance.',
        sections: [
          {
            title: 'Information only',
            body: 'This site provides Great Lakes Amateur and Michigan Players Golf Club information only. Nothing here is legal, financial, or professional advice. Tournament details may change without notice.'
          },
          {
            title: 'Registration and payments',
            body: 'Registration happens in your browser. This site does not collect, store, or confirm registration submissions on a server. Venmo payment is between you and the designated payee. Sending email or SMS does not guarantee entry. This site is not a payment processor and does not verify payments.'
          },
          {
            title: 'Your information',
            body: 'Form data stays on your device until you send email, SMS, or download a PDF. You must provide accurate information and are responsible for all charges, messages, and payment actions taken from your device and accounts.'
          },
          {
            title: 'Site content',
            body: 'All tournament names, logos, images, schedules, and copy belong to Michigan Players Golf Club or their respective owners. You may not copy, republish, scrape, or reuse site materials without written permission.'
          },
          {
            title: 'Third-party services',
            body: 'Maps, PDF tools, email, SMS, and payment apps are third-party services with their own terms. Michigan Players Golf Club is not responsible for those services or their availability.'
          },
          {
            title: 'Disclaimer',
            emphasis: true,
            body: 'This website and its tools are provided "as is" and "as available," without warranties of any kind. To the fullest extent permitted by law, Michigan Players Golf Club is not liable for errors, schedule changes, failed submissions, payment disputes, lost data, device issues, or any damages arising from your use of this site. You use this site at your own risk.'
          },
          {
            title: 'Contact',
            body: 'For tournament, registration, or payment questions, use the Contact page.'
          }
        ]
      }
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
   * @returns {Array}
   */
  const getRegistrationFeeOptions = (config) => {
    const payments = getPayments(config);
    const sponsorships = payments.sponsorships || {};

    return [
      payments.entryFee,
      payments.practiceRound,
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

const SiteConfig = deepFreeze({
  config: siteConfig,
  deepFreeze,
  getNavigation,
  getDefaultRoute,
  getBrand,
  getCallsToAction,
  getFooter,
    getDeveloperSignature,
    getPayments,
    getLocationMap,
    getRegistrationFeeOptions,
  getRegistrationFeeOption,
  getSponsorshipShowcase,
  buildVenmoPaymentUrl,
  buildMailtoLink,
  buildSmsLink,
  getContactAction,
  buildRoutes
});

export default SiteConfig;
