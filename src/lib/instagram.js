/**
 * Utilidades para el manejo de perfiles, enlaces y apertura de Instagram
 */

/**
 * Limpia cualquier formato de entrada de Instagram (URL completa, con o sin https/www, @, etc.)
 * y devuelve únicamente el nombre de usuario limpio (ej: 'paocdva').
 */
export function cleanInstagram(value = '') {
  if (!value) return ''
  let cleaned = String(value).trim()

  // Elimina posibles espacios en blanco
  cleaned = cleaned.replace(/\s+/g, '')

  // Elimina protocolo (http:// o https://)
  cleaned = cleaned.replace(/^https?:\/\//i, '')

  // Elimina subdominio www.
  cleaned = cleaned.replace(/^www\./i, '')

  // Elimina dominios conocidos de Instagram (instagram.com/, ig.me/m/, ig.me/)
  cleaned = cleaned.replace(/^(?:instagram\.com|ig\.me\/m|ig\.me)\//i, '')

  // Elimina parámetros de consulta (?...) y hashes (#...)
  cleaned = cleaned.split('?')[0].split('#')[0]

  // Si contiene barras adicionales (ej. 'paocdva/'), toma el primer segmento
  cleaned = cleaned.split('/')[0].trim()

  // Elimina signos @ iniciales
  cleaned = cleaned.replace(/^@+/, '').trim()

  return cleaned
}

export function formatInstagramDisplay(handle = '') {
  const clean = cleanInstagram(handle)
  return clean ? `@${clean}` : ''
}

/**
 * URL canónica web con https:// obligatorio, www y barra final.
 */
export function instagramProfileUrl(handle = '') {
  const clean = cleanInstagram(handle)
  if (!clean) return ''
  return `https://www.instagram.com/${clean}/`
}

export function instagramChatUrl(handle = '') {
  return instagramProfileUrl(handle)
}

/**
 * Deep link nativo para abrir la aplicación de Instagram en iOS y Android.
 */
export function instagramAppUrl(handle = '') {
  const clean = cleanInstagram(handle)
  if (!clean) return ''
  return `instagram://user?username=${clean}`
}

export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const isTouch = typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1
  return /iPhone|iPad|iPod|Android/i.test(ua) || (isTouch && /Macintosh/i.test(ua))
}

/**
 * Abre el perfil de Instagram:
 * - En móviles (iOS / Android): manda directamente a la aplicación nativa de Instagram (instagram://user?username=...).
 * - Si no está instalada la app, abre la versión web con https:// en una pestaña externa (target="_blank").
 * - NUNCA utiliza window.location.href para evitar redirigir y sacar a la usuaria de la PWA instalada en iOS.
 */
export function openInstagramProfile(handle = '') {
  const clean = cleanInstagram(handle)
  if (!clean) return

  const appUrl = instagramAppUrl(clean)
  const webUrl = instagramProfileUrl(clean)
  const mobile = isMobileDevice()

  if (mobile) {
    // 1. En móvil (iOS / Android), disparar apertura de la aplicación nativa
    const appAnchor = document.createElement('a')
    appAnchor.href = appUrl
    document.body.appendChild(appAnchor)
    appAnchor.click()
    appAnchor.remove()

    // 2. Fallback web seguro si la app no está instalada:
    // Al abrir la app nativa, iOS pasa la ventana a document.hidden.
    // Si la app no abre y sigue visible tras 800ms, abrimos en nueva pestaña externa (NUNCA en la ventana actual)
    const timer = setTimeout(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        const webAnchor = document.createElement('a')
        webAnchor.href = webUrl
        webAnchor.target = '_blank'
        webAnchor.rel = 'noopener noreferrer'
        document.body.appendChild(webAnchor)
        webAnchor.click()
        webAnchor.remove()
      }
    }, 900)

    const onVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(timer)
        document.removeEventListener('visibilitychange', onVisibilityChange)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange, { once: true })
  } else {
    // En escritorio, abrir siempre la versión web en una pestaña nueva con https://
    const webAnchor = document.createElement('a')
    webAnchor.href = webUrl
    webAnchor.target = '_blank'
    webAnchor.rel = 'noopener noreferrer'
    document.body.appendChild(webAnchor)
    webAnchor.click()
    webAnchor.remove()
  }
}

export { copyReminderAndOpenInstagram } from './clientContact'

