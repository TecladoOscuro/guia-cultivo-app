# Push Worker — guia-cultivo-app

Cloudflare Worker que envía notificaciones push a tu PWA. Permite notif background reliable en iOS sin app abierta.

**100% gratis** dentro de free tier CF Workers (100k req/día, 1k cron/día).

## Setup (10 min)

### 1. Cuenta CF

https://dash.cloudflare.com/sign-up — gratis

### 2. Instalar wrangler

```bash
npm install -g wrangler
wrangler login
```

### 3. Crear KV namespace

```bash
cd worker
wrangler kv namespace create SUBS
```

Output:
```
🌀 Creating namespace with title "guia-cultivo-push-SUBS"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "SUBS", id = "abc123def456..." }
```

Copia el `id` y pégalo en `wrangler.toml` reemplazando `REPLACE_WITH_YOUR_KV_ID`.

### 4. Generar VAPID keys

```bash
npm install
npm run vapid
```

Output:
```
PUBLIC: BLBz...
PRIVATE: 3K...
```

Guarda ambas. Public la usarás en cliente; private va al Worker.

### 5. Configurar secrets

```bash
wrangler secret put VAPID_PRIVATE
# paste private key

wrangler secret put VAPID_PUBLIC
# paste public key

wrangler secret put VAPID_SUBJECT
# paste: mailto:tu@email.com
```

### 6. Deploy

```bash
npm run deploy
```

Output:
```
Published guia-cultivo-push (1.23 sec)
  https://guia-cultivo-push.<tu-usuario>.workers.dev
```

Guarda esa URL.

### 7. Configurar app

En la PWA:
1. Settings → Notificaciones
2. Pega `https://guia-cultivo-push.<tu-usuario>.workers.dev` en "Worker URL"
3. Pulsa "Activar push remoto"
4. Acepta permisos

### 8. Test

Settings → Notificaciones → "🧪 Push test" → debe llegar notif inmediato al iPhone.

## Endpoints

- `GET /vapid-public` — devuelve public key
- `POST /subscribe` — body `{ sub, schedule }` registra/actualiza
- `DELETE /subscribe` — body `{ endpoint }` desuscribe
- `POST /test` — body `{ endpoint }` envia push test

## Cron

Ejecuta cada minuto. Comprueba cada subscription, dispara push para items con `fireAt <= now`. Limpia stale subs >30 días.

## Privacy

- Worker ve metadata (cuándo schedules, endpoint device)
- Body push se construye en Worker desde `title + body` (NO encrypted client-side por ahora — opcional extender)
- Stale data cleanup automático
- CORS limitado a `ALLOWED_ORIGIN` configurado en wrangler.toml

## Costes

- Free tier: 100k req/día + 1k cron/día — sobra
- Si superas: $5/mes plan paid (no necesario uso personal)

## Limitaciones

- Cron min interval CF: 1 minuto
- TTL push 60s — pushes viejos no se entregan tras minuto
- iOS requiere PWA "Añadida pantalla inicio" para recibir push

## Troubleshooting

**No llega push**:
1. PWA instalada (no Safari tab)? iOS solo permite push en PWA standalone
2. Permisos notif granted en iOS? Settings → Cultivo → Notif
3. Worker URL correcta en Settings PWA?
4. `wrangler tail` para ver logs Worker en vivo

**410/404 error**:
- Subscription expirada (user reinstaló PWA o desuscribió)
- Worker auto-elimina del KV

**Background sin funcionar**:
- iOS suspende SW agresivamente. Push reactiva SW
- Si sigue fallando: verificar cron está activo (`wrangler triggers list`)
