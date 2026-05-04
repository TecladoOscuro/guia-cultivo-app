# Security & Privacy

## Premisa

Repo público (necesario GH Pages free). Cero secretos en código. Datos usuario solo en su dispositivo.

## Reglas obligatorias

### 1. Cero secretos commiteados

- `.gitignore` incluye `.env`, `.env.local`, `.env.*.local`, `*.pem`, `*.key`, `*-secret.*`
- Pre-commit hook con `gitleaks` recomendado:
  ```bash
  brew install gitleaks
  cd guia-cultivo-app
  gitleaks protect --staged
  ```
- Si necesitas tokens (PAT para repository_dispatch, etc): SOLO en GitHub Actions Secrets

### 2. GitHub PAT para sync wiki↔app

- Token con scope mínimo: `repo` (read/write) sobre TecladoOscuro/guia-cultivo y TecladoOscuro/guia-cultivo-app
- Stored en `Settings → Secrets and variables → Actions` del repo wiki como `APP_DISPATCH_TOKEN`
- Caduca cada 90 días — recordatorio mensual rotación
- Workflow wiki:
  ```yaml
  - uses: peter-evans/repository-dispatch@v3
    with:
      token: ${{ secrets.APP_DISPATCH_TOKEN }}
      repository: TecladoOscuro/guia-cultivo-app
      event-type: wiki-updated
  ```

### 3. Web Push (cuando se implemente)

- VAPID public key: OK público, embebida en cliente
- VAPID private key: NUNCA en cliente. Solo en server-side (Cloudflare Worker secrets, GH Action secrets)
- Si user opta por modo "local notifications only": no necesita server, sin VAPID

### 4. localStorage / IndexedDB

- Same-origin policy de browser → datos aislados por dominio
- Sin sync = sin fugas a terceros (privacy by default)
- Service worker no envía data fuera

### 5. Sin analytics ni telemetría

- Sin Google Analytics
- Sin Plausible / Mixpanel / Sentry
- Sin tracking errores remoto. Solo `console` local
- Si quieres crash reporting: opt-in explícito, anonimizado

### 6. CSP (Content Security Policy)

En `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  img-src 'self' data: blob:;
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://tecladooscuro.github.io;
  manifest-src 'self';
  worker-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
">
```

Si hay que relajar (eg. inline scripts, fonts CDN): documentar por qué + minimizar.

### 7. HTTPS forzado

GH Pages auto. Sin opt-out.

### 8. npm audit en CI

```yaml
- name: Audit
  run: npm audit --audit-level=high --omit=dev
```

Falla si dependencias runtime con HIGH/CRITICAL. Build deps (workbox-build vulns conocidas) toleradas con justificación.

### 9. Input sanitization

- React escapa HTML por default → seguro para text content
- Si renderizamos HTML user-provided (markdown notas?): usar `dompurify`
- Validar JSON imports (export/import) contra schema antes de dexie.bulkAdd

### 10. EXIF strip en fotos

Antes de guardar foto en `journal`:
1. Decodificar como Blob
2. Recodificar a canvas → blob (proceso strips EXIF)
3. Guardar el clean blob

Privacy: evita filtrar GPS coordinates, device info.

### 11. Export JSON encrypted (opcional)

- User establece password
- AES-256-GCM client-side via `crypto.subtle.encrypt` (Web Crypto API)
- Sin libraries externas
- Backup descargado seguro aunque acabe en cloud

### 12. Open dependencies audit

| Dependency | Por qué | Risk |
|-----------|---------|------|
| react, react-dom | UI | Standard |
| dexie | IndexedDB | Standard |
| react-router-dom | Routing | Standard |
| date-fns | Date utils | Standard |
| recharts | Charts | Standard |
| react-big-calendar | Calendar UI | Standard |
| vite-plugin-pwa | PWA build | Build-only, vulns conocidas en workbox-build (HIGH) — toleradas: NO ship a producción, solo build |
| workbox-window | SW client | Standard |

Vulnerabilidades build-time documentadas. Re-evaluar cuando upstream actualice.

## Disclaimer in-app

Onboarding screen:

> Esta app NO da consejo médico. Uso personal/educativo. Verifica legalidad en tu país. NO mezcles sustancias sin investigar contraindicaciones. Datos solo en este dispositivo — backup manual recomendado.

Emergencias visibles en sesiones psicodélicos:
> 🆘 112 emergencias · 915 620 420 anti-tóxicos España (24h)

## Auditoría periódica

Cada 90 días:
- Rotar PATs
- `npm audit` + actualizar deps
- Revisar dependencias nuevas (¿alguna trae tracker?)
- Verificar CSP funciona (inspector navegador)
