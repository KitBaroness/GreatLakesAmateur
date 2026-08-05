# GreatLakesAmateur - FlexNet JSX Architecture

This repository is a static replication of [michiganplayersgolfclub.com](https://www.michiganplayersgolfclub.com/) converted into a FlexNet JSX architecture for the Michigan Players Golf Club and Great Lakes Amateur tournament site.

FlexNet JSX was created by `@KitBaroness`. Questions about the FlexNet architecture can be commented to her.

## Architecture

This project intentionally uses:

- FlexNet JSX architecture
- Pure vanilla browser JavaScript
- Functional JavaScript patterns with immutable config and pure helper functions
- No Node production runtime
- No Node build step
- No Tailwind CSS
- No frontend package dependency
- BEM CSS in `css/styles.css`
- Browser-native routing with `fetch()`, `DOMParser`, and hash routes
- Static HTML view fragments in `public/views/`
- Leaflet `1.9.4` and jsPDF `2.5.1` lazy-loaded from CDNs only when a route needs them

The `example/` folder is reference material for FlexNet JSX architecture only. Do not edit `example/` when changing this site.

## Runtime Router And Load Strategy

FlexNet Runtime Router keeps the application in one static HTML shell and loads only the requested page fragment from `public/views/`. The header, footer, config, router, and BEM stylesheet stay consistent across routes, which reduces repeated page setup work compared with loading a separate full HTML document for every page.

This approach improves load behavior across mobile, tablet, and desktop devices because:

- The browser loads one shared shell, one shared runtime, and one shared BEM stylesheet.
- Route changes fetch only the view fragment needed for the current page.
- Shared layout rendering stays centralized, reducing duplicated markup and timing drift between pages.
- BEM CSS keeps component styling predictable across browsers and operating systems.
- Legacy top-level URLs redirect into the same runtime path, preventing fragmented page behavior.

The result is a more consistent experience across device sizes, operating systems, and browsers while preserving a static deployment model.

## Security Caveats

This is a static frontend site. Static delivery reduces server-side attack surface because there is no Node production runtime, database session, or application server running inside this repository.

Security boundaries still matter:

- Do not store payment provider secrets, email API keys, private tokens, or credentials in frontend JavaScript.
- `mailto:`, `sms:`, and `tel:` links open the visitor's local apps; they do not securely submit private data to a server.
- Registration and sponsorship payments use the client-side invoice + Venmo workflow on `#/register`. There is no embedded legacy Wix checkout and no server-side payment capture in this repository.
- The contact page provides call, text, email, and map actions. It does not include a server-side contact form.
- The contact map loads Leaflet JavaScript and CSS from `unpkg.com` or `cdn.jsdelivr.net`, and map tiles from OpenStreetMap, so visitors' browsers make third-party map requests when the contact route is viewed.
- CDN scripts and stylesheets loaded by the runtime use Subresource Integrity hashes defined in `src/core/site-config.js`.
- `_headers` applies a Content Security Policy, `nosniff`, referrer policy, permissions policy, and cache rules for Cloudflare Pages.
- Any future automatic email delivery or hosted checkout should use a secure backend endpoint such as a Cloudflare Pages Function with environment variables.
- Any server-side endpoint should validate inputs, rate limit submissions, avoid exposing secrets, and return only the minimum response data needed by the browser.

## Session Privacy And Cache Controls

The site is designed to minimize leftover visitor-entered data after a session:

- The registration form uses `autocomplete="off"` on `#/register`.
- The FlexNet loader clears transient form fields on `pagehide` and `beforeunload`.
- The FlexNet loader clears app-owned `localStorage` and `sessionStorage` keys that use the `flexnet:` prefix, except the registration draft key used for the multi-step register flow.
- Registration draft data is stored in `sessionStorage` under `flexnet:registration:draft` so users can move through Details → Invoice → Venmo → Send without losing progress. Clear it by completing registration or closing the browser tab/session.
- Cloudflare Pages cache rules in `_headers` mark HTML pages and `public/views/` fragments as `no-store`.
- Runtime JavaScript is marked for revalidation so stale runtime behavior is less likely after deployment.
- Static images and CSS may still be cached because they do not contain visitor-entered data.

Browser-controlled HTTP cache, mail client drafts, SMS drafts, autofill systems, and operating-system level caches cannot be fully erased by frontend JavaScript. Sensitive workflows that require guaranteed data disposal should be handled by a secure backend endpoint with explicit retention controls.

## Functional Structure

- `src/core/site-config.js`: Frozen site data, payment/contact/developer-signature config, CDN integrity hashes, and pure query helpers.
- `src/core/loader.js`: Runtime bootstrap and browser side effects.
- `src/core/layout/renderHeader.js`: Pure header rendering with escaped config output.
- `src/core/layout/renderFooter.js`: Pure footer rendering with escaped config output.
- `src/utilities/router.js`: Browser-native hash router and view loader.
- `src/utilities/escapeHtml.js`: Shared HTML escaping helper for markup builders.
- `src/utilities/loadCdnAsset.js`: Lazy CDN loader with Subresource Integrity support.
- `src/views/registration-invoice/registration-invoice.js`: Register flow, invoice generation, Venmo handoff, PDF download.
- `src/views/location-map/location-map.js`: Contact-page Leaflet map and hotel list.
- `src/views/sponsorship-showcase/sponsorship-showcase.js`: Sponsorship logo carousel and testimonials.
- `public/views/`: Static page fragments loaded by the router.
- `css/styles.css`: BEM component styling only.

## Design System

The visual theme is tuned for a professional amateur golf event in Great Lakes Michigan:

- Lake blue for structure and primary page headers
- Fairway green for actions and tournament emphasis
- Mist, sand, and white surfaces for clean readability
- Muted gold accents for sponsorship and premium tournament details
- Responsive BEM layouts for desktop, tablet, and mobile breakpoints

## Pages

| Route | View | Description |
|------|------|-------------|
| `#/home` | `public/views/home/index.html` | Home page with tournament hero, dates, and highlighted entry fee |
| `#/event-details` | `public/views/event-details/index.html` | Tournament details, schedule, prizes, course info, entry fee, and scoring link |
| `#/register` | `public/views/register/index.html` | Multi-step registration, invoice, Venmo payment, and email/SMS invoice send |
| `#/contact` | `public/views/contact/index.html` | Call/text/email actions and Leaflet map for Eagle Crest plus nearby hotels |
| `#/upcoming-events` | `public/views/upcoming-events/index.html` | Upcoming events listing |
| `#/sponsorship` | `public/views/sponsorship/index.html` | Sponsorship tiers, partner carousel, testimonials, and register links |

The old top-level URLs (`contact.html`, `event-details.html`, `upcoming-events.html`, `sponsorship.html`) are redirect shells into the FlexNet SPA.

## Local Preview

Run a local static server from the repo root. A server is required because the router fetches view fragments from `public/views/`.

```bash
python3 -m http.server 8080
```

Then visit:

```text
http://localhost:8080/index.html#/home
```

Note: Content Security Policy headers in `_headers` apply on Cloudflare Pages. Local `python3 -m http.server` does not serve those headers unless you configure them separately.

## Payments And Contact

Payment and contact behavior is centralized in `src/core/site-config.js`.

- Entry fee and sponsorship tiers route to `#/register` with the selected fee type.
- Registration creates an invoice number, opens Venmo with the invoice note, and lets the visitor send the invoice by email or SMS.
- Legacy Wix checkout is not embedded in this site.
- Call/text/email: mobile-friendly `tel:`, `sms:`, and prefilled `mailto:` links are generated from config.

For automatic invoice email delivery or hosted checkout, add a backend endpoint such as a Cloudflare Pages Function with an email provider API key.

## Customization Notes

- **Navigation and metadata**: Edit `src/core/site-config.js`.
- **Page content**: Edit the matching file under `public/views/`.
- **Shared layout**: Edit `src/core/layout/renderHeader.js` or `src/core/layout/renderFooter.js`.
- **Styles**: Edit BEM components in `css/styles.css`.
- **Payments and registration fees**: Edit the `payments` and `registration` objects in `src/core/site-config.js`.
- **Contact actions**: Edit the `contact` object in `src/core/site-config.js`.
- **Contact map and hotels**: Edit the `locationMap` object in `src/core/site-config.js`.
- **CDN integrity hashes**: Update `locationMap` and `registration.jspdf` in `src/core/site-config.js` if CDN asset versions change.
- **Console easter egg**: Edit the `developerSignature` object in `src/core/site-config.js`.

## Source

Replicated from the live Wix site on August 3, 2026, then converted into a FlexNet JSX vanilla JavaScript architecture.
