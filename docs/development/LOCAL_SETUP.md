# Local setup

Install Node 24 and pnpm 11. Copy `.dev.vars.example` to `.dev.vars`, set `DEMO_MODE=true`, install from lockfile, migrate/seed D1 and run `pnpm dev`. Local R2 is emulated by Wrangler. Never commit `.dev.vars`, `.env`, `.wrangler` or sqlite files.
