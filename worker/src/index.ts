import { buildPushPayload, type PushSubscription } from "@block65/webcrypto-web-push";

interface ScheduleItem {
  fireAt: number; // ms epoch
  title: string;
  body: string;
  tag?: string;
}

interface SubData {
  sub: PushSubscription;
  schedule: ScheduleItem[];
  updatedAt: number;
}

interface Env {
  SUBS: KVNamespace;
  VAPID_PRIVATE: string;
  VAPID_PUBLIC: string;
  VAPID_SUBJECT: string;
  ALLOWED_ORIGIN: string;
}

function corsHeaders(env: Env): HeadersInit {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    // GET /vapid-public → public key
    if (url.pathname === "/vapid-public" && req.method === "GET") {
      return new Response(env.VAPID_PUBLIC, {
        headers: { ...corsHeaders(env), "Content-Type": "text/plain" },
      });
    }

    // POST /subscribe { sub, schedule }
    if (url.pathname === "/subscribe" && req.method === "POST") {
      try {
        const body = await req.json<{ sub: PushSubscription; schedule: ScheduleItem[] }>();
        if (!body.sub?.endpoint) {
          return new Response("invalid sub", { status: 400, headers: corsHeaders(env) });
        }
        const data: SubData = {
          sub: body.sub,
          schedule: body.schedule ?? [],
          updatedAt: Date.now(),
        };
        // Hash endpoint as key (avoid storing full URL as key)
        const key = await hashKey(body.sub.endpoint);
        await env.SUBS.put(key, JSON.stringify(data));
        return new Response(JSON.stringify({ ok: true, key }), {
          headers: { ...corsHeaders(env), "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(`error: ${e instanceof Error ? e.message : "unknown"}`, {
          status: 500,
          headers: corsHeaders(env),
        });
      }
    }

    // DELETE /subscribe { endpoint } → unsubscribe
    if (url.pathname === "/subscribe" && req.method === "DELETE") {
      try {
        const body = await req.json<{ endpoint: string }>();
        const key = await hashKey(body.endpoint);
        await env.SUBS.delete(key);
        return new Response("ok", { headers: corsHeaders(env) });
      } catch {
        return new Response("error", { status: 500, headers: corsHeaders(env) });
      }
    }

    // POST /test → trigger push immediate (debug)
    if (url.pathname === "/test" && req.method === "POST") {
      try {
        const body = await req.json<{ endpoint: string }>();
        const key = await hashKey(body.endpoint);
        const raw = await env.SUBS.get(key);
        if (!raw) return new Response("not subscribed", { status: 404, headers: corsHeaders(env) });
        const data = JSON.parse(raw) as SubData;
        await sendPush(data.sub, "🌱 Test", "Notif de prueba desde Guía Cultivo", env);
        return new Response("ok", { headers: corsHeaders(env) });
      } catch (e) {
        return new Response(`error: ${e instanceof Error ? e.message : ""}`, {
          status: 500,
          headers: corsHeaders(env),
        });
      }
    }

    return new Response("not found", { status: 404, headers: corsHeaders(env) });
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const list = await env.SUBS.list();
    const now = Date.now();

    for (const k of list.keys) {
      const raw = await env.SUBS.get(k.name);
      if (!raw) continue;
      const data = JSON.parse(raw) as SubData;
      const due = data.schedule.filter((s) => s.fireAt <= now && s.fireAt > now - 24 * 60 * 60 * 1000);
      const future = data.schedule.filter((s) => s.fireAt > now);

      // Stale subs (>30 días sin update) → cleanup
      if (now - data.updatedAt > 30 * 24 * 60 * 60 * 1000) {
        await env.SUBS.delete(k.name);
        continue;
      }

      for (const item of due) {
        try {
          await sendPush(data.sub, item.title, item.body, env, item.tag);
        } catch (e) {
          console.error("push failed", e);
          // Si endpoint expirado (410/404) → eliminar sub
          if (e instanceof Error && (e.message.includes("410") || e.message.includes("404"))) {
            await env.SUBS.delete(k.name);
            break;
          }
        }
      }

      // Persist solo events futuros
      data.schedule = future;
      await env.SUBS.put(k.name, JSON.stringify(data));
    }
  },
};

async function sendPush(
  sub: PushSubscription,
  title: string,
  body: string,
  env: Env,
  tag?: string
): Promise<void> {
  const payload = await buildPushPayload(
    {
      data: JSON.stringify({ title, body, tag }),
      options: { ttl: 60 },
    },
    sub,
    {
      subject: env.VAPID_SUBJECT,
      publicKey: env.VAPID_PUBLIC,
      privateKey: env.VAPID_PRIVATE,
    }
  );
  const res = await fetch(sub.endpoint, payload);
  if (!res.ok) {
    throw new Error(`push ${res.status}`);
  }
}

async function hashKey(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
