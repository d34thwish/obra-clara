# Obra Clara production runbook

This runbook deploys the existing `obra-clara` Worker. It never deploys `obra-clara-preview`, seeds `fixtures/demo.sql`, enables licensed ingestion, or invents account values.

## 1. Provision once

1. Authenticate locally with `pnpm exec wrangler login` or create a GitHub API token. For least privilege grant the target account: Workers Scripts Edit, D1 Edit, R2 Edit, and Account Settings Read. Scope it to the single account.
2. Create D1: `pnpm exec wrangler d1 create obra-clara`. Record the returned UUID as `CLOUDFLARE_D1_DATABASE_ID`.
3. Inspect migrations: `pnpm exec wrangler d1 migrations list obra-clara --remote --config apps/web/wrangler.jsonc` after temporarily supplying the real ID only through the production script. The script lists, then applies `0001_initial.sql` and `0002_remediation.sql`; Wrangler migration tracking makes repeat runs idempotent.
4. Create R2: `pnpm exec wrangler r2 bucket create obra-clara-raw`. Record the exact name. The binding exists even while source metadata prohibits archiving.
5. Keep rate-limit bindings `PUBLIC_RATE_LIMITER`/namespace `1001` and `SUBMISSION_RATE_LIMITER`/`1002`. Confirm no other Worker in the account uses these namespace IDs. If a collision exists, change only the two source entries in a reviewed follow-up and preserve binding names.
6. Create a Turnstile widget for the exact production hostname. Store site key as a variable and secret key as a GitHub environment secret. Action remains `community_submission`.
7. In Zero Trust create a self-hosted Access application covering `/admin*` and `/api/v1/admin/*`. Allow only the moderator group. Copy the team domain and application AUD. Set all three Access values including `MODERATOR_EMAILS`. A visitor must get login/401/403; an authenticated non-allowlisted user must get 403; only an allowlisted moderator may read or mutate submissions.

Do not run `pnpm db:seed` against remote D1.

## 2. Preferred path: GitHub Actions

1. In repository Settings > Environments create `production`, add required reviewers, and prevent non-main branches.
2. Add variables and secrets exactly as documented in `PRODUCTION_ENVIRONMENT.md`.
3. Merge the deployment infrastructure only after existing CI passes.
4. Actions > **Deploy production** > Run workflow on `main`.
5. The workflow installs from the frozen lockfile, reruns quality checks, validates all inputs, authenticates, lists/applies remote migrations, builds with the Cloudflare Vite plugin, validates `apps/web/dist/worker/wrangler.json`, deploys that generated config with a temporary encrypted secrets file, and runs smoke tests.
6. Download the safe diagnostic artifact. It contains statuses/timestamps only, never values.

The Vite plugin generates `assets.directory` during build. Deploying the source JSONC directly is intentionally prohibited.

## 3. Local path

Bash:

```text
pnpm install --frozen-lockfile
set -a; source .env.production.local; set +a
node scripts/cloudflare/preflight.mjs
node scripts/cloudflare/deploy-production.mjs
```

PowerShell:

```text
pnpm install --frozen-lockfile
# Load each protected value into $env:NAME using your secret manager.
node scripts/cloudflare/preflight.mjs
node scripts/cloudflare/deploy-production.mjs
```

The script restores the exact source `wrangler.jsonc` and deletes the temporary mode-0600 secrets file even after migration, build, deployment, or smoke-test failure.

## 4. Smoke-test contract

The release fails unless `/`, five SPA routes, health, config, overview, and OpenAPI respond successfully; health/config/overview report production; Turnstile is required with a public site key; and unauthenticated admin access does not return 2xx. An empty overview is valid. Synthetic data is not inserted.

For community persistence, complete one real Turnstile challenge, submit a benign general suggestion, retain its server ID, then verify it through authenticated moderation. Do not automate a production submission in the smoke script because Turnstile tokens are single-use and human-bound.

## 5. Monitoring

Monitoring is not active until the owner enables it. After deployment:

- Review Workers Logs for `request_failed`, Turnstile rejections, rate-limit 429s and D1 errors. Never log tokens or contact email.
- Enable Workers observability/logpush at an appropriate sampling rate and retention for the account plan.
- Alert on `/api/v1/health` non-2xx, deployment workflow failure, repeated Siteverify service errors, D1 storage/query errors and submission insert failures.
- Track `overview.data.lastUpdate`. No official data is an honest state; stale imports are operational concerns, not misconduct.
- Review D1 size/query limits and R2 object growth monthly.

## 6. Backups, recovery, rollback

Before risky migrations, export D1 with the current Wrangler-supported export command and store encrypted output outside the repository. D1 Time Travel availability and retention depend on the Cloudflare plan; verify it in the dashboard instead of assuming it. R2 objects should use immutable hash-based keys; do not add destructive lifecycle rules without legal/data review.

To recover community submissions, restore the latest tested D1 export or Time Travel point into a separate database, verify counts and moderation history, then deliberately rebind after review. Never drop the existing database during recovery.

A bad Worker release is rolled back through Cloudflare Workers Deployments/Versions to the previous known-good version. Do not roll back by deleting D1 or R2. After rollback, rerun `node scripts/cloudflare/smoke-test.mjs` and confirm admin remains protected.
