# Financial Monitoring Commission (FMC)

Static demo website for the Financial Monitoring Commission — a UK-style financial
regulatory authority with company registry, complaint filing & tracking, admin
dashboard, and multilingual support (EN / AR / RU / FR / ES / ZH / HI).

## Project Structure

```
.
├── index.html              # Home page
├── pages/                  # All inner pages
│   ├── about.html
│   ├── admin.html          # Admin dashboard
│   ├── companies.html      # Licensed firms registry
│   ├── complaint.html      # Multi-step complaint form
│   ├── track.html          # Complaint tracking
│   └── ...
├── assets/
│   ├── css/styles.css      # Global stylesheet
│   ├── js/                 # Client-side scripts
│   │   ├── main.js
│   │   ├── translations.js # i18n strings (7 languages)
│   │   ├── i18n.js
│   │   ├── complaint.js
│   │   ├── track.js
│   │   ├── admin.js
│   │   └── companies.js
│   └── img/                # Logos & images
├── _headers                # Cloudflare Pages: security + caching headers
├── _redirects              # Cloudflare Pages: pretty URL routing
├── robots.txt
└── sitemap.xml
```

## Local Development

Any static-file server works. Quick start with Node:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080` (or whatever port the server prints).

## Deployment (Cloudflare Pages)

1. Push the repository to GitHub.
2. In Cloudflare Pages, click **Create a project → Connect to Git**.
3. Pick this repo. Use these settings:
   - **Framework preset**: None
   - **Build command**: *(leave empty)*
   - **Build output directory**: `/`
4. Deploy — Cloudflare will publish the site at `<project>.pages.dev` and apply
   `_headers` + `_redirects` automatically.
5. Add your custom domain under **Custom domains** in the project settings.

## Notes

- All data is currently stored client-side in `localStorage`. Migrating to a real
  backend (e.g. Supabase) is the next step before production use.
- The site is a **demo**: company data, cases, and officer profiles are mock data.
