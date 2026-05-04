# ADR 0002: IndexedDB (Dexie) en lugar de localStorage

## Status
Accepted (2026-05-04)

## Context
Necesitamos storage local persistente. Datos: cultivos, eventos, stock, fotos, historial.

## Options

1. localStorage (5MB limit, sync API, key-value)
2. IndexedDB raw (asíncrono, complejo, pero mucho mayor capacidad)
3. IndexedDB via Dexie (wrapper ergonómico)

## Decision

**Dexie (IndexedDB wrapper)**.

## Rationale

- localStorage: 5MB insuficiente. Fotos journal pueden ocupar >50MB
- IndexedDB raw: API verbose, callbacks complejos
- Dexie: API tipo ORM, soporte TypeScript nativo, hooks React, migrations explícitas

## Consequences

- Asíncrono → all queries via async/await + hooks
- Migrations requieren cuidado: bumpear version + upgrade callback
- Storage limit típico iOS Safari ~50MB (más en PWA standalone). Comprimir fotos + cleanup history viejo
