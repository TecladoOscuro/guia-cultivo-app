# Web Push background reliable iOS — setup guide

Guía para añadir Web Push real con VAPID + Cloudflare Worker. Permite notificaciones background fiables incluso con app cerrada en iOS PWA.

**Estado**: NO implementado en código. Esta es la guía si decides añadirlo.

## Por qué necesitas server

iOS suspende Service Workers agresivamente. `setTimeout` en SW NO sobrevive cuando app cerrada. Para notif background reliable necesitas push real desde server.

**Trade-off privacy**: el server (CF Worker) verá metadata de cuándo push se envía + endpoint del device. NO ve el contenido si encriptas el body. Aceptable si confías en CF y el código es tuyo.

## Stack: Cloudflare Workers + Cron Triggers

100% free tier:
- 100k requests/día
- 1000 cron invocations/día
- 10 KV reads + 1k writes/día (para guardar subscriptions)

## Setup paso a paso

### 1. Generar VAPID keys

```bash
npx web-push generate-vapid-keys
```

Output:
```
Public Key: BLBz...
Private Key: 3K...
```

- **Public key**: irá en cliente (OK público)
- **Private key**: SOLO server (CF Worker secret)

### 2. CF Worker setup

Crear repo `guia-cultivo-push-worker` o subdirectorio `worker/`:

```
worker/
├── wrangler.toml
├── src/
│   └── index.ts
└── package.json
```

`wrangler.toml`:
```toml
name = "guia-cultivo-push"
main = "src/index.ts"
compatibility_date = "2026-01-01"

[[kv_namespaces]]
binding = "SUBS"
id = "<generated>"

[triggers]
crons = ["*/15 * * * *"]   # Cada 15 min
```

`src/index.ts`:
```ts
import { buildPushPayload, type PushSubscription } from "@block65/webcrypto-web-push";

interface Env {
  SUBS: KVNamespace;
  VAPID_PRIVATE: string;
  VAPID_PUBLIC: string;
  VAPID_SUBJECT: string;
}

export default {
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url);
    if (url.pathname === "/subscribe" && req.method === "POST") {
      const { sub, schedule } = await req.json();
      // sub = subscription endpoint del device
      // schedule = lista de { fireAt, title, body }
      await env.SUBS.put(sub.endpoint, JSON.stringify({ sub, schedule }));
      return new Response("ok");
    }
    if (url.pathname === "/vapid-public") {
      return new Response(env.VAPID_PUBLIC);
    }
    return new Response("not found", { status: 404 });
  },

  async scheduled(_event, env) {
    const list = await env.SUBS.list();
    const now = Date.now();
    for (const k of list.keys) {
      const data = JSON.parse(await env.SUBS.get(k.name) ?? "{}");
      const due = data.schedule?.filter((s: any) => s.fireAt <= now) ?? [];
      for (const item of due) {
        const payload = await buildPushPayload(
          { data: JSON.stringify({ title: item.title, body: item.body }), options: { ttl: 60 } },
          data.sub,
          { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC, privateKey: env.VAPID_PRIVATE }
        );
        await fetch(data.sub.endpoint, payload);
      }
      // Eliminar entregadas
      data.schedule = data.schedule?.filter((s: any) => s.fireAt > now) ?? [];
      await env.SUBS.put(k.name, JSON.stringify(data));
    }
  }
};
```

### 3. Subir secrets

```bash
wrangler secret put VAPID_PRIVATE   # paste private key
wrangler secret put VAPID_PUBLIC    # paste public key
wrangler secret put VAPID_SUBJECT   # mailto:tu@email.com
```

### 4. Deploy Worker

```bash
wrangler deploy
# Output: https://guia-cultivo-push.tuusuario.workers.dev
```

### 5. Cliente: subscribe to push

En `src/lib/notifications.ts`:

```ts
const WORKER_URL = "https://guia-cultivo-push.tuusuario.workers.dev";

async function subscribePush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const vapidRes = await fetch(`${WORKER_URL}/vapid-public`);
    const vapidPublic = await vapidRes.text();
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublic),
    });
  }
  return sub;
}

export async function sendScheduleToWorker(schedule: { fireAt: number; title: string; body: string }[]) {
  const sub = await subscribePush();
  if (!sub) return;
  await fetch(`${WORKER_URL}/subscribe`, {
    method: "POST",
    body: JSON.stringify({ sub, schedule }),
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, c => c.charCodeAt(0));
}
```

### 6. Service Worker: handle push event

`vite-plugin-pwa` con `injectManifest` strategy permite custom SW:

```ts
self.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/guia-cultivo-app/icons/icon-192.png",
    })
  );
});
```

### 7. Update notifSync.ts

En vez de scheduleNotification con setTimeout local, llamar `sendScheduleToWorker(events)`.

### 8. CSP update

Añadir `https://*.workers.dev` al `connect-src` en index.html.

### 9. Test iOS

1. Add to Home Screen
2. Permisos notif granted
3. App envía schedule al Worker
4. Cierra app del switcher
5. Worker cron dispara push según schedule
6. Notif aparece en iOS

## Limitaciones

- Cron CF Workers free: cada 1 minuto mínimo, pero schedule debe respetar precisión
- 100k req/día = sobra para uso personal (5-10 cultivos × 5 events/día = 50 req/día)
- Si user pierde subscription (re-instala PWA): re-subscribir auto al abrir

## Privacy hardening

- Encripta `body` con clave del device antes de mandar al Worker (Worker no podrá leerlo)
- Body solo trigger; SW client decide qué mostrar
- TTL bajo (60s) para que pushes viejos no entreguen

## Coste

**0€** mientras estés bajo límites free (sobrado para uso personal).

## Por qué no está implementado

- Requiere CF account + setup external
- Catch-up al abrir + badge counter cubre 80% de casos prácticos
- Solo añadir si user reporta perder eventos importantes background
