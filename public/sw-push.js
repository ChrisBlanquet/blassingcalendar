// Manejador de eventos Web Push y Notificaciones para la PWA Estudio Blessing

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'Estudio Blessing Nails 💅'
  const count = data.count ?? data.appointmentCount
  const body =
    data.body ||
    (count !== undefined
      ? `Mañana tienes ${count} ${count === 1 ? 'cita agendada' : 'citas agendadas'}. Toca para ver tu agenda.`
      : 'Mañana tienes citas agendadas. Toca para ver tu agenda.')

  const options = {
    body,
    icon: data.icon || '/pwa-192.png',
    badge: data.badge || '/icon-192.png',
    data: {
      url: data.url || '/',
      ...data,
    },
    vibrate: [100, 50, 100],
    tag: data.tag || 'daily-reminder-tomorrow',
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification?.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl)
          }
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    }),
  )
})
