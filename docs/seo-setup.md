# SEO and analytics setup

Production measurement values live in `data/analytics.json` instead of page templates.

- `searchConsoleVerification`: Google Search Console HTML-tag token.
- `ga4.measurementId`: a `G-XXXXXXXXXX` measurement ID.
- `matomo.url` and `matomo.siteId`: Matomo installation URL and site ID.

Run `npm run build` after adding values. `npm run analytics` is idempotent and leaves analytics disabled when fields are empty. No credentials are committed.

Hreflang is intentionally not emitted while the site has one Turkish locale. When translated URLs are ready, add reciprocal `tr-TR`, `en-US` and `x-default` links to the SEO generator.
