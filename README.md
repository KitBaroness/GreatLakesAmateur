# GreatLakesAmateur - FlexNet JSX Vanilla JS Site

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

- Entry fee: opens the original Wix event-details payment page because Wix Pay creates checkout orders inside the Wix runtime.
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
