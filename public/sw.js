/* Service Worker de Health At Home Tools (PWA).
 * Fase 1: habilita instalación + notificaciones en móvil (showNotification).
 * Los handlers de "push" quedan listos para la Fase 2 (avisos con la app cerrada).
 */

// Activarse de inmediato en nuevas versiones.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Passthrough de red (necesario para que la app sea "instalable"). Sin caché por ahora.
self.addEventListener("fetch", () => {
  // No interceptamos: el navegador hace la petición normal.
});

// Al tocar una notificación: enfocar una ventana existente o abrir la app.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsList) => {
        for (const client of clientsList) {
          if ("focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      })
  );
});

// Fase 2 (avisos con la app cerrada): mostrar notificación al recibir un push del servidor.
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { title: "Health At Home", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "Health At Home";
  const options = {
    body: payload.body || "",
    icon: "/icon-256.png",
    badge: "/icon-256.png",
    data: payload.data || { url: payload.url || "/" },
    tag: payload.tag,
    renotify: Boolean(payload.tag),
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
