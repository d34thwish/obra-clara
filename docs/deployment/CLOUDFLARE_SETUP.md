# Cloudflare setup

1. Create a Cloudflare account and upload this repository to GitHub.
2. In Workers & Pages, import the repository as a Worker build. Build command: `pnpm install --frozen-lockfile && pnpm build`; deploy command: `pnpm exec wrangler deploy --config apps/web/wrangler.jsonc`. The Vite plugin produces static assets and Worker code together.
3. Run `pnpm exec wrangler d1 create obra-clara`; replace the all-zero D1 UUID placeholder. Apply with `pnpm exec wrangler d1 migrations apply obra-clara --remote --config apps/web/wrangler.jsonc`.
4. Run `pnpm exec wrangler r2 bucket create obra-clara-raw`; replace `obra-clara-raw-placeholder`. Enable R2 billing if Cloudflare requires it.
5. Set production `DEMO_MODE=false`. Production starts empty until an approved import. Add `TURNSTILE_SECRET_KEY` as a secret and public site key as a variable after creating a Turnstile widget.
6. Create a Cloudflare Access self-hosted application for `/admin*` and `/api/v1/admin/*`. Set `ACCESS_TEAM_DOMAIN` to the exact team domain and `ACCESS_AUD` to the application audience tag. The Worker additionally validates the `Cf-Access-Jwt-Assertion` with rotating JWKS, issuer and audience.
7. Add a custom domain to the Worker. Verify `/api/v1/health`, `/api/openapi.json`, SPA routes and an unauthorized admin request returning 401.
8. Configure GitHub Actions environment secrets only if ingestion is enabled: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, `R2_BUCKET_NAME`, `OECE_DISTRIBUTION_URL`. Keep the monthly workflow disabled until license/URL review.
9. Manually run ingestion first, inspect hash/count/errors, then promote validated data. Never run large transforms inside a request.
10. Backups: use D1 Time Travel, scheduled SQL exports to restricted R2, and immutable raw files keyed by dataset/date/SHA-256. Test restoration quarterly.
