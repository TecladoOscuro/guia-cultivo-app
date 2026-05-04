---
name: sync-wiki
description: Triggea o supervisa sync entre wiki y templates de la app. Usar cuando wiki ha cambiado y quieres regenerar templates JSON.
allowed-tools: Read, Bash, Edit
---

# sync-wiki

## Cuándo usar

- Wiki tuvo push reciente a main → workflow auto debería haber corrido
- User cambió la wiki localmente → quiere ver diff antes de commit
- Workflow falló y quieres re-correr manualmente
- Quieres añadir cultivo nuevo (NO uses esta — usa `add-new-cultivo`)

## Modos

### A. Trigger workflow remoto

```bash
gh workflow run sync-from-wiki.yml -R TecladoOscuro/guia-cultivo-app
```

(Requires gh CLI authenticated.)

### B. Run localmente (dry run)

```bash
cd ~/guia-cultivo-app
node scripts/extract-templates.js ~/guia-cultivo/src ./src/templates
git diff src/templates
```

Si diff aceptable → commit. Si raro → debugger.

### C. Lock fields editados a mano

Si user editó campo en template y NO debe ser sobrescrito:

```jsonc
{
  "id": "evento_x",
  "_lock": true,
  "title": "Custom title",
  ...
}
```

extract script preserva campos con `_lock: true`.

## Verificar post-sync

1. JSON válido: `for f in src/templates/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f'))" || echo "BAD: $f"; done`
2. Build: `npm run build`
3. Test crear cultivo en dev con template afectado
4. Diff visible: `git diff src/templates` no tiene cambios extraños

## Errores comunes

- Extract falla porque wiki cambió formato → ajustar parser
- Phase ID nuevo sin template → script crea Issue, NO PR. Usa `add-template` o `add-new-cultivo`
- Conflictos con `_lock`: log de campos preservados, verificar que es lo esperado
