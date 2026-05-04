# Contributing — guia-cultivo-app

## Setup

```bash
git clone https://github.com/TecladoOscuro/guia-cultivo-app
cd guia-cultivo-app
npm install --legacy-peer-deps
npm run dev
```

## Antes de PR

1. Lee [AGENTS.md](AGENTS.md)
2. `npm run build` pasa
3. Sin secretos commiteados (`.env*` en gitignore, gitleaks recomendado)
4. Sin `console.log` debug residuales
5. Si tocas DB schema: bumpea version + upgrade callback
6. Si tocas templates: validar JSON parse + test crear cultivo en dev

## Conventional commits

```
feat(scope): descripción
fix(scope): descripción
docs(scope): descripción
chore(scope): descripción
refactor(scope): descripción
```

Scopes: `templates`, `calendar`, `stock`, `dashboard`, `journal`, `harvests`, `sessions`, `pwa`, `db`, `deps`.

## Para AIs (Claude, etc)

- Lee [CLAUDE.md](CLAUDE.md)
- Skills disponibles: [.claude/skills/](.claude/skills/)
- Slash commands: [.claude/commands/](.claude/commands/)

## Reportar bugs

Issues con:
- Pasos reproducir
- Estado dexie (export JSON adjunto si aplica, redacted)
- Browser + OS + version PWA
- Screenshots si UI

## Code of conduct

Respetuoso. Sin spam. Sin contenido ilegal o promoción extracción química controlada.

## Licencia

Personal/educational use. No medical advice. Ver README.
