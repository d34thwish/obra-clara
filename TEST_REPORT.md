# Verification report — 0.2.0

Verified locally on 2026-11-21:

- `pnpm install --frozen-lockfile`: passed.
- Prettier, ESLint and TypeScript: passed.
- Vitest: 8 files, 28 tests passed (parser, XLSX, finance/date normalization, schemas, modules, analytics, Turnstile, API demo/empty validation, migration and dry-run pipeline).
- Cloudflare Vite production build: passed.
- D1 migrations 0001 + 0002: passed locally (34 statements total).
- Demo seed: passed; synthetic records remain `staging` and production APIs select only `published`.
- Secret-pattern scan: passed.

Not executed:

- Playwright: Chromium dependency installation was blocked by no-new-privileges and browser download was blocked by sandbox HTTP 403. CI installs Chromium with `--with-deps` and runs the retained journeys.
- `pnpm audit`: audit service was blocked by sandbox HTTP 403; CI runs the audit.
- Official OECE import/promotion: not performed. The verified catalog says License Not Specified, and promotion intentionally fails closed.
- Cloudflare deployment: not performed.
