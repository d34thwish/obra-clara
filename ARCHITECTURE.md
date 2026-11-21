# Arquitectura

Modular monolith: React SPA and Hono API share one Cloudflare Worker release. Domain/analytics/module contracts live in packages; ingestion runs outside requests; D1 holds structured/indexed public data; R2 stores immutable raw archives. D1 is an operational store, not an unlimited warehouse. At 70% of its 10 GB paid limit, sustained query p95 above 1 s, or analytical scans affecting public traffic, evaluate partitioning and PostgreSQL/ClickHouse.

Public APIs use prepared statements and pagination. Community submissions are private until reviewed. Admin authorization verifies Cloudflare Access JWT signature, issuer, audience and expiration with rotating JWKS.
