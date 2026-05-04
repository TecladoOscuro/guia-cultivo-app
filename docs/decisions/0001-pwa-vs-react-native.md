# ADR 0001: PWA en lugar de React Native

## Status
Accepted (2026-05-04)

## Context
Necesitamos app instalable en iPhone para gestión personal cultivos. Sin presupuesto, sin App Store distribution.

## Options considered

1. **React Native sideload**: instalar via Xcode con Apple ID gratis
2. **React Native + Apple Developer Program**: $99/año
3. **PWA con Web Push API**: instalable via "Add to Home Screen" iOS 16.4+

## Decision

**PWA**.

## Rationale

| Criterio | PWA | RN sideload | RN $99 |
|----------|-----|-------------|--------|
| Coste | 0€ | 0€ | $99/año |
| Re-firma | n/a | cada 7 días | n/a |
| Web + móvil | ✅ mismo build | ❌ solo iOS | ❌ solo iOS |
| Push iOS | ✅ desde 16.4 | ✅ | ✅ |
| Storage offline | IndexedDB GBs | AsyncStorage | AsyncStorage |
| Distribución | URL pública | sideload manual | TestFlight |
| Setup complexity | bajo | alto | medio |

PWA gana en todas las dimensiones excepto background reliability (donde RN gana ligeramente).

## Consequences

- Push notifications iOS pueden ser inconsistentes background. Mitigar con badge + catch-up al abrir.
- Sin acceso a APIs nativas iOS (HealthKit, biometric auth) — no necesarias para esta app.
- iOS suspende SW agresivamente — schedule notifications via setTimeout no fiable. Usar push real desde server gratis (Cloudflare Workers) si necesario.

## Migration path

Si en futuro hace falta RN: el código React + lógica negocio (eventGenerator, db queries) son portables. Solo UI y storage cambian.
