# Arquitectura 0.2.0

Monolito modular: React usa `src/lib/api.ts`; Hono expone `/api/v1`; repositorios SQL permanecen en el Worker y usan prepared statements; D1 contiene datos estructurados, estados de publicación, FTS5, comunidad y auditoría; R2 conserva originales únicamente cuando la licencia lo permite.

## Seguridad

Access JWT se valida con JWKS remoto rotatorio, issuer, AUD, tiempo y RS256; luego `MODERATOR_EMAILS` autoriza. Si falta configuración, falla cerrado. Turnstile se valida con Siteverify, timeout, hostname y action. El Rate Limiting binding es aproximado y por ubicación, no una cuota global estricta. CORS es same-origin salvo allowlist explícita. Respuestas admin llevan `no-store`.

## Ingesta

Retrieval → licencia → archivo opcional → parser CSV/XLSX → normalización → validación → deduplicación → staging → lineage → publicación → FTS. El hash evita promociones repetidas. Una falla antes de publicar conserva el lote anterior. D1 tiene 100 parámetros por query y 10 GB por base pagada; la ingesta usa lotes pequeños. Para mayor volumen se debe particionar o migrar analítica sin acoplar el dominio.
