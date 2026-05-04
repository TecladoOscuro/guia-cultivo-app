/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();

// __WB_MANIFEST inyectado por vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

// SPA navigation fallback
registerRoute(
  new NavigationRoute(async () => {
    const cache = await caches.open("workbox-precache-v2-https://tecladooscuro.github.io/guia-cultivo-app/");
    const response = await cache.match("/guia-cultivo-app/index.html");
    return response ?? Response.error();
  })
);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// === Push handler ===

interface PushPayload {
  title: string;
  body: string;
  tag?: string;
}

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload: PushPayload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Guía Cultivo", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/guia-cultivo-app/icons/icon-192.png",
      badge: "/guia-cultivo-app/icons/icon-192.png",
      tag: payload.tag,
      data: { url: "/guia-cultivo-app/calendar" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data?.url as string | undefined) ?? "/guia-cultivo-app/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/guia-cultivo-app/")) {
          if ("focus" in client) {
            (client as WindowClient).navigate(url);
            return (client as WindowClient).focus();
          }
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
