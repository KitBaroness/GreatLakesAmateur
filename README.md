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
- The contact form currently opens a prefilled email and does not send server-side email by itself.
- Wix checkout links depend on Wix runtime behavior and should not be treated as direct payment API endpoints.
- The entry-fee checkout iframe depends on the original Wix event-details page remaining available at the configured Wix URL.
- Any future automatic email delivery, payment checkout, or sponsor payment flow should use a secure backend endpoint such as a Cloudflare Pages Function with environment variables.
- Any server-side endpoint should validate inputs, rate limit submissions, avoid exposing secrets, and return only the minimum response data needed by the browser.

## Session Privacy And Cache Controls

The site is designed to avoid leaving visitor-entered data behind after a session:

- The contact form uses `autocomplete="off"` and is marked as transient form state.
- The FlexNet loader clears transient form fields when the form opens the prefilled email handoff.
- The FlexNet loader clears transient form fields on `pagehide` and `beforeunload`.
- The FlexNet loader clears any app-owned `localStorage` or `sessionStorage` keys that use the `flexnet:` prefix.
- The app does not intentionally store visitor form input in browser storage.
- Cloudflare Pages cache rules in `_headers` mark HTML pages and `public/views/` fragments as `no-store`.
- Runtime JavaScript is marked for revalidation so stale runtime behavior is less likely after deployment.
- Static images and CSS may still be cached because they do not contain visitor-entered data.

Browser-controlled HTTP cache, mail client drafts, SMS drafts, autofill systems, and operating-system level caches cannot be fully erased by frontend JavaScript. Sensitive workflows that require guaranteed data disposal should be handled by a secure backend endpoint with explicit retention controls.

## Functional Structure

- `src/core/site-config.js`: Frozen site data, payment/contact config, and pure query helpers.
- `src/core/loader.js`: Runtime bootstrap and browser side effects.
- `src/core/layout/renderHeader.js`: Pure header rendering.
- `src/core/layout/renderFooter.js`: Pure footer rendering.
- `src/utilities/router.js`: Browser-native hash router and view loader.
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
| `#/home` | `public/views/home/index.html` | Home page with tournament hero, dates, entry fee, and payment actions |
| `#/event-details` | `public/views/event-details/index.html` | Tournament details, schedule, prizes, course info, entry fee, and scoring link |
| `#/contact` | `public/views/contact/index.html` | Contact form plus call, text, and email actions |
| `#/upcoming-events` | `public/views/upcoming-events/index.html` | Upcoming events listing |
| `#/sponsorship` | `public/views/sponsorship/index.html` | Sponsorship tiers, benefits, and invoice inquiry actions |

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

## Payments And Contact

Payment and contact behavior is centralized in `src/core/site-config.js`.

- Entry fee: all entry-fee payment actions open a local FlexNet modal that embeds the original Wix event-details page in an iframe so the Wix Pay button/runtime can load without navigating away. The Wix URL remains as a no-JavaScript fallback.
- Sponsorships: use invoice request email links because the original Wix sponsorship page does not expose direct sponsor checkout endpoints.
- Call/text/email: mobile-friendly `tel:`, `sms:`, and prefilled `mailto:` links are generated from config.
- Contact form: opens a prefilled `mailto:` message. It does not send server-side email by itself.

For automatic form email delivery, add a backend endpoint such as a Cloudflare Pages Function with an email provider API key.

## Customization Notes

- **Navigation and metadata**: Edit `src/core/site-config.js`.
- **Page content**: Edit the matching file under `public/views/`.
- **Shared layout**: Edit `src/core/layout/renderHeader.js` or `src/core/layout/renderFooter.js`.
- **Styles**: Edit BEM components in `css/styles.css`.
- **Payments**: Edit the `payments` object in `src/core/site-config.js`.
- **Contact actions**: Edit the `contact` object in `src/core/site-config.js`.

## Source

Replicated from the live Wix site on August 3, 2026, then converted into a FlexNet JSX vanilla JavaScript architecture.
