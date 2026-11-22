# Cloudflare setup

Production deployment is implemented by `scripts/cloudflare/deploy-production.mjs` and `.github/workflows/deploy-production.yml`.

Use:

- `PRODUCTION_ENVIRONMENT.md` for the exact variable/secret map.
- `PRODUCTION_RUNBOOK.md` for provisioning, GitHub Actions and local deployment.
- `PRODUCTION_CHECKLIST.md` for first-release approval.

The deployment builds with the Cloudflare Vite plugin and deploys `apps/web/dist/worker/wrangler.json`, whose generated `assets.directory` points to the client output. It does not deploy the source JSONC directly, does not seed demo data, and does not enable official-data ingestion.
