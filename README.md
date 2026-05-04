# Guía Cultivo App

Companion PWA para la [wiki Guía Cultivo](https://tecladooscuro.github.io/guia-cultivo/). Calendario + dashboard + stock + planning para gestionar cultivos caseros.

## Estado

🚧 En desarrollo activo. Fase 0 (setup) completada.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Dexie (IndexedDB)
- React Router
- date-fns, recharts, react-big-calendar
- vite-plugin-pwa (Workbox)

## Desarrollo local

```bash
npm install --legacy-peer-deps
npm run dev          # localhost:5173
npm run build        # output dist/
npm run preview      # preview build
```

## Deploy

GitHub Actions despliega automático a GitHub Pages al push a `main`.

URL pública: `https://tecladooscuro.github.io/guia-cultivo-app/`

## Instalar en iPhone

1. Abre URL en Safari
2. Compartir → Añadir a pantalla de inicio
3. Notificaciones se piden en primera apertura (iOS 16.4+ requerido)

## Datos

Solo en tu dispositivo. IndexedDB. Sin sync, sin cloud, sin tracking. Backup manual via export JSON.

## Documentación

- [AGENTS.md](AGENTS.md) — arquitectura para humanos + IAs
- [CLAUDE.md](CLAUDE.md) — instrucciones específicas Claude
- [docs/](docs/) — arquitectura, data model, decisiones
- [feature-specs/](feature-specs/) — spec por feature

## Repos hermanos

- [guia-cultivo](https://github.com/TecladoOscuro/guia-cultivo) — wiki contenido educativo (source of truth)
- guia-cultivo-app (este) — app calendario/dashboard/stock

Workspace VSCode: `guia-cultivo.code-workspace` (en directorio padre con ambos repos hermanos).

## Privacidad y seguridad

- Repo público (necesario para GH Pages free) pero CERO secretos
- Datos usuario solo localStorage/IndexedDB del dispositivo
- Sin analytics, sin telemetría, sin cookies de terceros
- CSP estricta + HTTPS forzado

Ver [docs/security.md](docs/security.md).

## Licencia

Personal use, educational. No medical advice. Verifica legalidad en tu país.
