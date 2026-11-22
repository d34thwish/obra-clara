# Cloudflare setup

1. Suba el directorio completo a GitHub y cree un Worker conectado al repositorio.
2. Build: `pnpm install --frozen-lockfile && pnpm build`. Deploy: `pnpm exec wrangler deploy --config apps/web/wrangler.jsonc`.
3. Cree D1 con `pnpm exec wrangler d1 create obra-clara`; sustituya el UUID todo-cero en `apps/web/wrangler.jsonc` y ejecute migraciones remotas.
4. Cree R2 y sustituya `obra-clara-raw-placeholder`. R2 solo se usa cuando `archivePermitted` es verdadero.
5. Configure `DEMO_MODE=false`, `ENVIRONMENT=production`, `TURNSTILE_SITE_KEY`, `TURNSTILE_HOSTNAME`, `TURNSTILE_ACTION=community_submission`. Guarde `TURNSTILE_SECRET_KEY` con `wrangler secret put`.
6. En Zero Trust > Access > Applications cree una aplicación self-hosted para `/admin*` y `/api/v1/admin/*`. Copie el team domain completo y el AUD. Configure `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` y `MODERATOR_EMAILS` (CSV exacto). Access debe permitir solo ese grupo/email y el allowlist del Worker vuelve a comprobar autorización.
7. Pruebe: visitante obtiene 401/403 en admin; usuario Access no incluido obtiene 403; moderador aprobado puede listar y cambiar estados; toda decisión crea eventos.
8. Rate limiting usa namespaces `1001` y `1002`; cambie a enteros únicos de su cuenta si colisionan. Es aproximado por ubicación. Para cuota global estricta, implemente Durable Object antes de cambiar la garantía publicada.
9. Turnstile producción falla cerrado si no tiene secreto, site key, hostname y action coherentes.
10. Ingesta: configure el workflow manual. `promote=false` genera artefacto de validación. `promote=true` requiere environment `production-data-promotion`, aprobación humana, `LICENSE_APPROVED=true` y secretos listados en `.env.example`. La fuente actual tiene licencia no especificada y permanece bloqueada.
11. Dominio: asócielo al Worker, añada el hostname de Turnstile y verifique `/api/v1/health`, `/api/openapi.json` y los headers.
12. Backups: D1 Time Travel, export SQL antes de promociones y objetos R2 inmutables. Para rollback, restaure D1 o marque el lote fallido y vuelva a publicar el lote anterior; nunca borre el original.
