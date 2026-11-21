# Obra Clara

**El dinero público es de todos. Su destino también debería ser transparente.**

Obra Clara es una plataforma cívica independiente, comunitaria y de código abierto para explorar contratación pública peruana con procedencia, contexto y metodologías reproducibles. No es una autoridad gubernamental. Las señales son estadísticas, no acusaciones.

## Estado de esta distribución

- Aplicación React + API Hono en un Worker con Static Assets.
- D1 normalizado, R2 preparado para archivos originales y migraciones versionadas.
- Demo sintética claramente marcada; producción vacía muestra estados honestos.
- Adaptador OECE basado en el catálogo oficial, configurable con una URL de distribución real. No se afirma una importación oficial dentro del ZIP.
- Búsqueda, perfiles, contratación, señales, comparación, datos abiertos, comunidad y moderación protegida.

## Inicio local

1. Node 24 y pnpm 11.
2. `pnpm install --frozen-lockfile`
3. `cp .dev.vars.example .dev.vars` y use `DEMO_MODE=true`.
4. `pnpm db:migrate && pnpm db:seed`
5. `pnpm dev`

## Calidad

`pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`

## Datos

Configure `OECE_DISTRIBUTION_URL` solo después de verificar la distribución y licencia; ejecute `pnpm data:sync`. Los originales deben archivarse en R2 con SHA-256 y nunca sobrescribirse.

## Módulos

Los módulos son TypeScript, se registran en build, declaran dependencias/capacidades/rutas y nunca ejecutan JavaScript comunitario arbitrario. Consulte `docs/development/MODULES.md`.

## Licencia

Código: AGPL-3.0-or-later. Datos: licencias de sus fuentes, documentadas por separado. Contribuciones usan DCO (`Signed-off-by`).
