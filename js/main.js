// Legacy page bridge.
// The FlexNet runtime now lives in /src and loads through index.html.

(function () {
  'use strict';

  const routeByFile = Object.freeze({
    'contact.html': '/contact',
    'event-details.html': '/event-details',
    'sponsorship.html': '/sponsorship',
    'upcoming-events.html': '/upcoming-events'
  });

  const currentFile = window.location.pathname.split('/').pop();
  const route = routeByFile[currentFile];

  if (route) {
    window.location.replace(`index.html#${route}`);
  }
})();
