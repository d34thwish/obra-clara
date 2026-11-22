# Obra Clara 0.2.0

Obra Clara es una plataforma cívica independiente, comunitaria y de código abierto para explorar contratación pública peruana con procedencia y contexto. **No es una autoridad gubernamental.** Las señales estadísticas no son acusaciones ni prueba de corrupción.

## Implementado

- React/Vite conectado a una API Hono del mismo origen para inicio, búsqueda, instituciones, proveedores, contrataciones, datasets, señales, comparación y comunidad.
- Dos modos estrictos: demo sintética visible (`DEMO_MODE=true`) y producción D1 sin fallback ficticio (`false`).
- D1 con etapas separadas, publicación controlada, procedencia, FTS5, submissions, eventos de moderación y auditoría.
- Formulario comunitario con campos condicionales, Turnstile cliente/servidor, ID del servidor y persistencia D1.
- Moderación autenticada por Cloudflare Access JWT y autorizada por `MODERATOR_EMAILS`.
- Rate Limiting bindings aproximados por ubicación, con límites distintos para lectura y submissions.
- Pipeline dry-run con CSV/XLSX robusto, validación, deduplicación y reporte; ruta de promoción D1/R2 implementada y bloqueada sin aprobación de licencia.

## Fuente OECE

El adaptador verificado corresponde a **Datos de la Convocatoria o Invitación de las entidades**. Se clasifica como `process`, no como adjudicación. El catálogo indica procedimientos adjudicados desde 2018, pero su licencia aparece como **License Not Specified**. Por ello, esta versión bloquea promoción y redistribución hasta que una revisión jurídica configure un adaptador con `derivativesPermitted` y `archivePermitted` verdaderos. No se incluye ni se afirma una importación oficial.

## Desarrollo

1. Node 24 y pnpm 11.28.9.
2. `pnpm install --frozen-lockfile`
3. `cp .dev.vars.example .dev.vars`
4. `pnpm db:migrate && pnpm db:seed`
5. `pnpm dev`

Calidad: `pnpm verify`. E2E: `pnpm exec playwright install --with-deps chromium && pnpm test:e2e`.

## Ingesta

- Dry run: defina `OECE_DISTRIBUTION_URL` y ejecute `pnpm data:sync`.
- Promoción: `pnpm data:sync -- --promote`. Falla de forma explícita sin licencia aprobada y credenciales Cloudflare.
- Los reportes se escriben en `import-reports/`, directorio ignorado por Git.
- La promoción mantiene staging separado, cambia visibilidad solo tras validar, actualiza FTS y conserva lineage.

Consulte `docs/deployment/CLOUDFLARE_SETUP.md`, `docs/data-sources/OECE.md` y `DATA_LICENSES.md`.
