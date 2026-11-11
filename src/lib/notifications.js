/**
 * Utilidades para Notificaciones Push y Recordatorios PWA
 */

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: false,
  reminderTimes: ['13:00'],
  fcmTokens: [],
}

/**
 * Verifica si las notificaciones están soportadas en el entorno actual.
 */
export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

/**
 * Devuelve el estado actual de los permisos de notificación.
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

/**
 * Escucha cambios de permisos en vivo (por ejemplo, cuando el usuario cambia
 * la configuración en el icono del candado o en los ajustes del navegador).
 */
export function watchNotificationPermission(callback) {
  if (typeof window === 'undefined') return () => {}

  const check = () => {
    callback(getNotificationPermission())
  }

  window.addEventListener('focus', check)
  document.addEventListener('visibilitychange', check)

  let permStatus = null
  if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
    navigator.permissions
      .query({ name: 'notifications' })
      .then((status) => {
        permStatus = status
        status.onchange = () => {
          callback(status.state || getNotificationPermission())
        }
      })
      .catch(() => {})
  }

  return () => {
    window.removeEventListener('focus', check)
    document.removeEventListener('visibilitychange', check)
    if (permStatus) permStatus.onchange = null
  }
}

/**
 * Obtiene la suscripción Web Push actual del Service Worker si existe.
 */
export async function getPushSubscription() {
  if (!isNotificationSupported() || !('serviceWorker' in navigator)) return null
  try {
    const reg = await Promise.race([
      navigator.serviceWorker.getRegistration(),
      new Promise((resolve) => setTimeout(() => resolve(null), 800)),
    ])
    if (!reg?.pushManager) return null
    return await reg.pushManager.getSubscription()
  } catch (err) {
    console.warn('No se pudo obtener la suscripción Push:', err)
    return null
  }
}

/**
 * Solicita permisos de notificación al usuario y obtiene la suscripción Push si es posible.
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return { status: 'unsupported', subscription: null }
  }

  try {
    const permission = await Notification.requestPermission()
    let subscription = null

    if (permission === 'granted' && 'serviceWorker' in navigator) {
      try {
        const reg = await Promise.race([
          navigator.serviceWorker.getRegistration(),
          new Promise((resolve) => setTimeout(() => resolve(null), 800)),
        ])
        if (reg?.pushManager) {
          subscription = await reg.pushManager.getSubscription()
        }
      } catch (err) {
        console.warn('Error al verificar pushManager:', err)
      }
    }

    return { status: permission, subscription }
  } catch (err) {
    console.error('Error al solicitar permiso de notificaciones:', err)
    return { status: Notification.permission || 'denied', subscription: null }
  }
}

/**
 * Dispara una notificación de prueba local sin bloquearse.
 * Compatible con Chrome en Windows, Mac, Android y PWA en iOS.
 */
export async function sendTestNotification({
  title = 'Estudio Blessing Nails 💅',
  body = '¡Notificaciones activadas! Mañana tienes 3 citas agendadas. Toca para ver tu agenda.',
} = {}) {
  if (!isNotificationSupported()) {
    throw new Error('Las notificaciones no están soportadas en este navegador.')
  }

  const currentPerm = Notification.permission
  if (currentPerm !== 'granted') {
    throw new Error('Primero debes conceder permisos de notificación.')
  }

  const options = {
    body,
    icon: '/pwa-192.png',
    badge: '/icon-192.png',
    data: {
      url: '/',
    },
    vibrate: [100, 50, 100],
    tag: 'test-notification',
    renotify: true,
  }

  let sent = false

  // 1. Intentar mostrar a través del Service Worker si está registrado y activo
  if ('serviceWorker' in navigator) {
    try {
      const reg = await Promise.race([
        navigator.serviceWorker.getRegistration(),
        new Promise((resolve) => setTimeout(() => resolve(null), 500)),
      ])
      if (reg && 'showNotification' in reg && reg.active) {
        await reg.showNotification(title, options)
        sent = true
      }
    } catch (err) {
      console.warn('showNotification del ServiceWorker falló:', err)
    }
  }

  // 2. Fallback con constructor nativo (especialmente en Chrome para Windows/escritorio)
  if (!sent) {
    try {
      const notification = new Notification(title, options)
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
      sent = true
    } catch (err) {
      console.warn('Constructor Notification falló:', err)
      // Último intento: esperar un poco más al ServiceWorker si es requerido (ej. iOS PWA)
      if ('serviceWorker' in navigator) {
        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise((resolve) => setTimeout(() => resolve(null), 1000)),
        ])
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, options)
          sent = true
        }
      }
      if (!sent) {
        throw new Error('No se pudo mostrar la notificación en este dispositivo.')
      }
    }
  }

  return sent
}
