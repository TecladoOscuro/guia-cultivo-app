---
description: Triggear sync de templates desde wiki
---

Invoca skill `sync-wiki`.

Modos:
- **Auto remoto**: gh workflow run sync-from-wiki.yml
- **Manual local**: node scripts/extract-templates.js ~/guia-cultivo/src ./src/templates && git diff src/templates

Pregunta al user qué modo preferir.

Tras ejecutar:
1. Reportar diff resumen
2. Si PR creado: link
3. Si Issue creado (phase nueva): explicar siguiente paso
