# Fulcrum — Enterprise Software Website

A premium, animated enterprise SaaS website built with plain **HTML, CSS and
vanilla JavaScript**, using **GSAP + ScrollTrigger** for animation. No
frameworks, no build step — open any `.html` file in a browser (ideally via
a local server, see below) and it runs.

The brand ("Fulcrum") is a placeholder concept built for this brief: an
enterprise operations platform, with a brass/graphite palette and a literal
"pivot / balance beam" motif used throughout (logo mark, the scroll-progress
bar at the top of every public page, the 404 art).

---

## Running it locally

Because the pages use `fetch`-free relative links but browsers block some
things (like `file://` module-style loading) on double-clicked HTML files,
the safest way to preview it is a tiny local server:

```bash
cd enterprise-website
python3 -m http.server 8080
# then open http://localhost:8080/index.html
```

Any static server works (`npx serve`, VS Code "Live Server", etc).

---

## Structure

```text
enterprise-website/
├── index.html              Home (10 sections)
├── about.html
├── services.html
├── blog.html
├── contact.html
├── login.html
├── create-account.html
├── 404.html
├── admin-dashboard.html
├── dashboard.html          Public/User dashboard
├── privacy.html
├── terms.html
│
├── css/
│   ├── style.css           Design tokens + shared components (nav, footer,
│   │                       buttons, cards, forms, loader, marquee…)
│   ├── home.css             Home-page-only sections (hero, timeline, hscroll…)
│   ├── pages.css            About/Services/Blog/Contact/Auth/404-only styles
│   ├── dashboard.css        Admin + User dashboard shell and widgets
│   └── responsive.css       Breakpoints (1200 / 960 / 680px), loaded last
│
├── js/
│   ├── main.js              Site chrome: loader, nav, mobile menu, cursor,
│   │                       magnetic buttons, spotlight cards, marquee,
│   │                       expandable/flip cards, password show/hide
│   ├── animations.js        All GSAP/ScrollTrigger motion: text-split
│   │                       reveals (chars/words/lines), scramble, blur,
│   │                       scale-type, letter-spacing, counters, parallax,
│   │                       horizontal scroll, sticky timeline, sticky
│   │                       solutions accordion
│   ├── validation.js        Reusable form validation (name/email/password/
│   │                       phone/checkbox/confirm-password) — used by every
│   │                       form on the site via `data-validate="…"`
│   ├── auth.js               Login / Create Account submit + success flows
│   └── dashboard.js         Dashboard-only: profile & notification menus,
│                             mobile sidebar drawer, tab switching
│
└── assets/
    └── logo/
        ├── favicon.svg
        └── logo-mark.svg    Reference copy of the placeholder mark
```

---

## Swapping in the real logo

Every page inlines the same logo `<svg>` so it can be recolored with
`currentColor` at each usage site (navbar, footer, loading screen, dashboard
navbar). To replace it:

1. Search every HTML file for the comment `FULCRUM LOGO MARK` — that flags
   every place the mark is inlined.
2. Replace each `<svg>…</svg>` block with your real logo's markup (or swap
   to an `<img src="assets/logo/your-logo.svg">` if you'd rather link a
   file — drop the file in `assets/logo/` first).
3. Update `assets/logo/favicon.svg` the same way.

`assets/logo/logo-mark.svg` has the same instructions written into it as a
standalone reference file.

---

## Login roles & the dashboards

The login page has an **Admin / Public** toggle above the email field.
- Choosing **Admin** and logging in sends you to `admin-dashboard.html`.
- Choosing **Public / User** sends you to `dashboard.html`.

Both dashboards read `?email=` (and `&name=` if present, e.g. after Create
Account) from the URL and use it to populate the profile chip, the "Signed
in as" line in the profile dropdown, and the welcome-banner greeting. Try it
by opening, for example:

```
dashboard.html?email=jordan.avery%40yourcompany.com&name=Jordan%20Avery
```

Every sidebar item in both dashboards is a real, working section (not a
dead link) — clicking one swaps the visible content panel client-side. See
`initSidebarPanels()` in `js/dashboard.js` if you want to add more panels
or wire them to real data.

---

## What's real vs. what's a placeholder

This is a **frontend-only** deliverable, as scoped. A few things that would
need a backend before going live:

- **Login / Create Account** — `js/auth.js` validates the form, shows a
  loading state, then simulates success. Login has an Admin/Public toggle
  above the email field — the choice decides whether you land on
  `admin-dashboard.html` or `dashboard.html`, and the email you typed is
  passed along in the URL (`?email=...&role=...`) so the dashboard can show
  who's signed in. Swap the `setTimeout()` calls for real `fetch()` calls to
  your auth API, and have your backend set a real session instead of relying
  on the URL.
- **Contact form** — validates and shows a success state client-side only;
  wire the `fetch()` call in `contact.html`'s inline script up to your mail/
  CRM endpoint.
- **Dashboards** — every sidebar item (Analytics, Reports, Users, Revenue,
  Workflows, Activity, Security, Help for Admin; My workflows, Tasks,
  Reports, Profile, Settings, Help for the user dashboard) shows real,
  distinct content — but it's all static markup swapped client-side via
  `js/dashboard.js` (`initSidebarPanels()`), not separate pages. There's no
  database behind the KPIs, tables, or task checkboxes (the task list does
  toggle and update its sidebar badge count, but only in memory — it resets
  on reload). Wire each panel's data up to real endpoints when you have a
  backend.
- **Blog** — the search/category filter in `blog.html` is a real, working
  client-side filter. Article links are placeholders.
- **Images** — hero backgrounds (About/Services/Blog/Contact) and card
  photos (blog cards, home-page testimonials, About page team/story) use
  [Lorem Picsum](https://picsum.photos), a free placeholder-photo service
  built for exactly this — real photography, no attribution required, safe
  to hotlink. Swap any `https://picsum.photos/seed/...` URL for your own
  image whenever you're ready; nothing else needs to change. If an image
  ever fails to load, it just fades away to reveal the gradient/color
  underneath rather than showing a broken-image icon (see
  `initImageFallbacks()` in `js/main.js`).
- Company names in the "Trusted by" marquee and testimonials are invented,
  not real companies.

---

## Design system quick reference

All tokens live at the top of `css/style.css` as CSS custom properties:

- **Colors**: `--ink` (base), `--surface` / `--surface-2` (panels),
  `--brass` / `--brass-2` (primary accent), `--teal` (secondary accent),
  `--stone` (light interlude sections).
- **Type**: `--font-display` (Space Grotesk, headings), `--font-body` (IBM
  Plex Sans), `--font-mono` (JetBrains Mono, used for eyebrows/labels/data).
- **Motion**: `--ease-premium`, `--dur-fast/med/slow`.

Reusable animation hooks (add these `data-` attributes to any element and
`animations.js` will pick them up automatically — no per-page JS needed):

| Attribute | Effect |
|---|---|
| `data-split="chars\|words\|lines"` | Splits text and reveals it on scroll |
| `data-reveal="fade-up\|fade-down\|fade-left\|fade-right\|scale\|blur\|scale-type\|tracking"` | Generic scroll reveal |
| `data-reveal-group="name"` | Staggers all elements sharing the same group name |
| `data-counter="1234" data-counter-suffix="%"` | Animated count-up |
| `data-scramble` | Scramble-text-in effect |
| `data-parallax="60"` | Vertical parallax drift (px) |
| `data-magnetic="0.3"` | Magnetic hover pull on buttons |

---

## Accessibility & performance notes

- Respects `prefers-reduced-motion` globally (animations shortened/removed).
- Skip-to-content link on every page; visible focus states throughout.
- Mobile nav, dashboard sidebar drawer and all custom checkboxes/toggles are
  keyboard-operable.
- GSAP/ScrollTrigger and Google Fonts load from public CDNs
  (`cdnjs.cloudflare.com`, `fonts.googleapis.com`) — if you're deploying
  somewhere with strict CSP or need everything self-hosted, download those
  and update the `<link>`/`<script>` tags accordingly.
