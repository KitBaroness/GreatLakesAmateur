# Michigan Players Golf Club - FlexNet Vanilla JS Site

A local, editable replica of [michiganplayersgolfclub.com](https://www.michiganplayersgolfclub.com/) converted from duplicated static pages into a FlexNet-style vanilla JavaScript app.

The app uses:

- Immutable `siteConfig` data frozen with `Object.freeze()`
- Pure render functions for header/footer/page routing
- Browser-native hash routing with `fetch()` and `DOMParser`
- Static HTML view fragments in `public/views/`
- Custom BEM CSS only, with no Tailwind or frontend package dependencies

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
| `#/home` | `public/views/home/index.html` | Home - tournament hero, dates, entry fee, Pay Now |
| `#/event-details` | `public/views/event-details/index.html` | Full tournament info, schedule, prizes, course details |
| `#/contact` | `public/views/contact/index.html` | Contact form and tournament committee info |
| `#/upcoming-events` | `public/views/upcoming-events/index.html` | Upcoming events listing |
| `#/sponsorship` | `public/views/sponsorship/index.html` | Sponsorship opportunities placeholder |

The old top-level page URLs (`contact.html`, `event-details.html`, `upcoming-events.html`, `sponsorship.html`) are now redirect shells into the SPA.

## Project Structure

```
Ryan_Golf/
├── index.html                  # FlexNet SPA entry point
├── contact.html                # Legacy redirect shell
├── event-details.html          # Legacy redirect shell
├── sponsorship.html            # Legacy redirect shell
├── upcoming-events.html        # Legacy redirect shell
├── css/
│   └── styles.css              # BEM component CSS
├── js/
│   └── main.js                 # Legacy redirect bridge
├── src/
│   ├── core/
│   │   ├── site-config.js      # Frozen config and pure query helpers
│   │   ├── loader.js           # Runtime bootstrap
│   │   └── layout/
│   │       ├── renderFooter.js
│   │       └── renderHeader.js
│   └── utilities/
│       └── router.js           # Hash router and view loader
├── public/
│   └── views/
│       ├── contact/
│       ├── event-details/
│       ├── home/
│       ├── sponsorship/
│       └── upcoming-events/
└── assets/
    └── images/
        ├── logo.jpg
        ├── hero.jpeg
        ├── sidebar.jpg
        └── pay-button.png
```

## Local Preview

Run a local static server from the repo root. A server is required because the FlexNet router fetches view fragments from `public/views/`.

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080/index.html#/home`.

## Customization Notes

- **Navigation and metadata**: Edit `src/core/site-config.js`.
- **Page content**: Edit the matching file under `public/views/`.
- **Shared layout**: Edit `src/core/layout/renderHeader.js` or `src/core/layout/renderFooter.js`.
- **Styles**: Edit BEM components in `css/styles.css`.
- **Payment links**: Payment behavior is centralized in `src/core/site-config.js`. The entry fee currently opens the original Wix event-details payment page because Wix Pay creates checkout orders inside the Wix runtime. Sponsorship buttons use invoice request email links because the original Wix sponsorship page does not expose direct sponsor checkout endpoints.
- **Contact links and form**: Call, text, and email actions are centralized in `src/core/site-config.js`; the contact form opens a prefilled `mailto:` message from `src/core/loader.js`.
- **Copy**: Tournament copy has been normalized for a professional amateur golf audience while preserving the original event details.

## Source

Replicated from the live site on August 3, 2026, then converted into a FlexNet-style vanilla JavaScript architecture.
# GreatLakesAmateur
