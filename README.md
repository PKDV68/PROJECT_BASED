# Project Based website

```
project-based/
├── index.html            Home: hero, mission, why us, fields, plan teaser, partners, team, sponsors
├── plan.html             First event format (linked from "View plan")
├── downloads.html        Documents to download + support form
├── fields/               One page per field card (page tree + tabs, incl. Get in contact)
├── assets/               Everything visual
│   ├── css/
│   │   ├── tokens.css    Font (Segoe UI), red + grey colours, type scale  ← change the look here
│   │   ├── base.css      Reset, layout, header, buttons, footer, motion (all pages)
│   │   ├── home.css      Sections used only on index.html
│   │   └── pages.css     plan.html and downloads.html
│   ├── js/main.js        Ribbon, scroll reveal, nav highlight, form status
│   ├── fonts/            Self-hosted graffiti font for the PRB mark (licence in OFL.txt)
│   ├── img/              Self-hosted images (Kleve photo, CC BY-SA 2.0)
│   └── docs/             PDFs offered on the site, built from docs/source/*.html
└── php/                  Server side only
    ├── support-form.php  Receives the support form, saves to CSV, emails contact@projectbased.de
    ├── contact-form.php  Receives the field-page contact form, emails contact@projectbased.de
    ├── updates-form.php  Receives the footer "Stay updated" sign-up, saves to CSV, emails contact@projectbased.de
    ├── config.php        Email address, storage path, allowed support types
    ├── lib/helpers.php
    └── storage/          support-requests.csv is written here (blocked from the web)
```

## Before going live
- PDFs are written as HTML in `assets/docs/source/` and printed to `assets/docs/` (same name, `.pdf`). Edit the HTML, then run
  `powershell -ExecutionPolicy Bypass -File assets/docs/source/build-pdfs.ps1` (add names like `event-details` to build only those).
  For a new document copy `_template.html`; the header band, footer and page numbers are added by `document.js`, the styles live in `document.css`.
  A page with too much content gets a red outline in the PDF.
  Forms come out fillable on screen: every `.box`, tick-list item and signature line becomes a PDF form field automatically
  (`add-fields.py`, needs Python with `pypdf`: `python -m pip install pypdf`). Without pypdf the PDFs still build, just not fillable.
- Emails go to the addresses in `php/config.php` (`mail_to`, `contact_to`) and are sent from `mail_from` (no-reply@projectbased.de). Every form is also saved as CSV in `php/storage/`.
- PHP `mail()` must be enabled on the host. If emails don't arrive, ask the host to set up sending for projectbased.de (SPF/DKIM) or switch to SMTP.
- The `.htaccess` files assume Apache. On nginx, deny `php/storage/`, `php/lib/` and `php/config.php` in the server config.
- Sponsor logos: replace the text inside `.logo-plate` / `.sponsor-tile` in `index.html` with `<img src="assets/img/name.svg" alt="Company">`.

- Everything loads from this server, nothing from Google or other providers (see privacy.html, section 6). Keep it that way: put new fonts in `assets/fonts/` and images in `assets/img/`.
