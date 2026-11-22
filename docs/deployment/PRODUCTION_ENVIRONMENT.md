# Production environment reference

Production deployment uses the GitHub Actions environment **production**. Add required reviewers before allowing the first run. Do not store values at repository level when environment scope is sufficient.

| Name                        | GitHub location  | Secret | Purpose                                              |
| --------------------------- | ---------------- | -----: | ---------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID`     | Actions variable |     No | 32-character Cloudflare account ID                   |
| `CLOUDFLARE_D1_DATABASE_ID` | Actions variable |     No | Production D1 UUID used by application deployment    |
| `CLOUDFLARE_R2_BUCKET_NAME` | Actions variable |     No | Production R2 bucket bound as `RAW_DATA`             |
| `PUBLIC_BASE_URL`           | Actions variable |     No | Exact HTTPS origin, no path                          |
| `TURNSTILE_SITE_KEY`        | Actions variable |     No | Public widget key                                    |
| `TURNSTILE_HOSTNAME`        | Actions variable |     No | Exact hostname from `PUBLIC_BASE_URL`                |
| `CLOUDFLARE_API_TOKEN`      | Actions secret   |    Yes | Least-privilege Wrangler authentication              |
| `TURNSTILE_SECRET_KEY`      | Actions secret   |    Yes | Encrypted Worker secret for Siteverify               |
| `ACCESS_TEAM_DOMAIN`        | Actions variable |     No | Required Cloudflare Access team domain/issuer        |
| `ACCESS_AUD`                | Actions variable |     No | Required Access application audience                 |
| `MODERATOR_EMAILS`          | Actions variable |     No | Required comma-separated moderator email allowlist   |
| `CORS_ALLOWED_ORIGINS`      | Actions variable |     No | Optional extra origins; empty keeps same-origin only |

All three Access settings are mandatory for production. The deployment preflight fails unless the Access team domain, application AUD, and at least one moderator email are configured. This prevents public submissions from being accepted into a production database that has no configured moderation path. Configure Cloudflare Access to protect both `/admin*` and `/api/v1/admin/*`, and keep the Worker-side JWT validation and email allowlist enabled.

The workflow fixes `DEMO_MODE=false`, `ENVIRONMENT=production`, and `TURNSTILE_ACTION=community_submission`. It never supplies `TURNSTILE_DEV_BYPASS`.

## Separate ingestion names

`CLOUDFLARE_D1_DATABASE_ID` and `CLOUDFLARE_R2_BUCKET_NAME` belong to application deployment. Existing ingestion variables `D1_DATABASE_ID` and `R2_BUCKET_NAME` remain unchanged because the ingestion workflow has a different trust boundary and protected environment.

## Local use

Create an untracked `.env.production.local` using `.env.production.example`, then load it in the shell. Bash: `set -a; source .env.production.local; set +a`. PowerShell: import each line into `$env:` or configure a secure secret manager. Never commit this file.
