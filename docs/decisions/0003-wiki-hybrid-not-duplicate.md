# ADR 0003: Wiki estrategia híbrida (NO duplicar contenido)

## Status
Accepted (2026-05-04)

## Context
Wiki guia-cultivo tiene ~10000 líneas de contenido educativo. App necesita parte de esa info. ¿Duplicar todo o referenciar?

## Options

1. Duplicar toda la prosa wiki en app (offline-first total)
2. Iframe wiki dentro de la app (runtime fetch)
3. Híbrida: solo extraer datos estructurados, prosa via deep link

## Decision

**Híbrida**.

## Rationale

| Tipo contenido | Vive en | Por qué |
|----------------|---------|---------|
| Timing fases (días, semanas) | App JSON | Lógica calendario offline |
| Listas materiales | App JSON | Genera shopping list |
| Cantidades riego | App JSON | Eventos recurrentes |
| Glosario ligero | App | Tooltips inline |
| Prosa larga | Wiki externa | Demasiada |
| Bibliografía | Wiki externa | Idem |

Beneficios:
- App ligera, offline-first sin descargar 10k líneas
- Wiki sigue siendo single source of truth para contenido educativo
- Cero duplicación = cero sync drift en prosa
- Updates wiki disparan PR review en app, no rompe-cosas-silencio

## Consequences

- Necesita conexión para "Saber más" (deep link wiki) — aceptable
- Wiki necesita 1 modificación: parsear URLSearchParams para deep linking (invisible al user)
- Sync wiki↔app vía workflow (extract-templates) cuando wiki cambie
