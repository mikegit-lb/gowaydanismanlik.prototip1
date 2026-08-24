# CI/CD and hosting

Every push to main and every pull request runs npm ci, npm run build, Lighthouse CI budgets and a dist artifact upload.

Azure Static Web Apps preview deployments are enabled when the repository secret AZURE_STATIC_WEB_APPS_API_TOKEN is present. Pull request environments are created and closed automatically.

Netlify can deploy the dist directory after npm run build and uses _headers. Vercel Git deployments use `npm ci`, `npm run build`, and the `dist` output configured in `vercel.json`. IIS deploys dist with the included Web.config.

Set the repository variable UPTIME_URL to override the scheduled 15-minute uptime target. The default is the production homepage; /sitemap.xml is checked too.

The CSP allows the optional GA4/Matomo integrations. Add another analytics origin to the CSP locations before deployment if needed.
