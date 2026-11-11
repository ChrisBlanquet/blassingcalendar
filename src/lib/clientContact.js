import { collection, getDocs, query, where, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { toDate } from './dates'
import { cleanInstagram, openInstagramProfile } from './instagram'
import { appointmentMessageVars, fillTemplate } from './whatsapp'

/**
 * Resuelve reactivamente los datos de contacto más actualizados para una cita,
 * priorizando los datos del catálogo de clientas sobre copias fijas de la cita.
 */
export function resolveAppointmentClient(appointment, clients = []) {
  if (!appointment) {
    return {
      client: null,
      name: '',
      phone: '',
      hasPhone: false,
      instagram: '',
      instagramUser: '',
      hasInstagram: false,
    }
  }

  const client =
    (appointment.clientId && clients.length ? clients.find((c) => c.id === appointment.clientId) : null) ||
    (appointment.clientName && clients.length
      ? clients.find((c) => c.name && c.name.trim().toLowerCase() === appointment.clientName.trim().toLowerCase())
      : null)

  const name = client?.name || appointment.clientName || 'la clienta'

  // Si la clienta existe en el catálogo, sus datos en tiempo real mandan:
  // Si se eliminó el teléfono (cadena vacía/null), phone debe ser vacío, no el número viejo.
  const phone = client
    ? (client.phone ? String(client.phone).trim() : '')
    : String(appointment.clientPhone || appointment.phone || '').trim()

  const rawInstagram = client
    ? (client.instagram || '')
    : (appointment.clientInstagram || appointment.instagram || '')

  const instagramUser = cleanInstagram(rawInstagram)

  return {
    client,
    name,
    phone,
    hasPhone: Boolean(phone),
    instagram: rawInstagram,
    instagramUser,
    hasInstagram: Boolean(instagramUser),
  }
}

/**
 * Actualiza en segundo plano los campos de contacto en todas las citas
 * activas/futuras asociadas al clientId cuando se edita la clienta en el directorio.
 */
export async function cascadeUpdateClientAppointments(uid, clientId, clientData) {
  if (!uid || !clientId) return
  try {
    const appointmentsRef = collection(db, 'users', uid, 'appointments')
    const q = query(appointmentsRef, where('clientId', '==', clientId))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return

    const batch = writeBatch(db)
    let count = 0
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      const startDate = toDate(data.startAt)
      const isFutureOrActive = !startDate || startDate >= yesterday

      if (isFutureOrActive && data.status !== 'cancelled') {
        batch.update(docSnap.ref, {
          clientName: clientData.name || data.clientName || '',
          clientPhone: clientData.phone || '',
          clientInstagram: clientData.instagram || '',
        })
        count++
      }
    })

    if (count > 0) {
      await batch.commit()
    }
  } catch (error) {
    console.warn('Error en cascadeUpdateClientAppointments:', error)
  }
}

/**
 * Copia texto de forma sincrónica con execCommand('copy') dentro del mismo evento de tap/click de usuario.
 * Es el método más fiable en iOS Safari / PWA para no perder el contexto de activación.
 */
export function copyToClipboardSync(text) {
  if (!text || typeof document === 'undefined') return false
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.top = '0'
    textarea.style.left = '0'
    textarea.style.width = '2em'
    textarea.style.height = '2em'
    textarea.style.padding = '0'
    textarea.style.border = 'none'
    textarea.style.outline = 'none'
    textarea.style.boxShadow = 'none'
    textarea.style.background = 'transparent'
    textarea.style.opacity = '0'
    textarea.setAttribute('readonly', '')
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)
    const successful = document.execCommand('copy')
    document.body.removeChild(textarea)
    return successful
  } catch (err) {
    console.warn('copyToClipboardSync falló:', err)
    return false
  }
}

/**
 * Copia el texto al portapapeles con fallback robusto para iOS / Safari / PWA.
 */
export async function copyToClipboard(text) {
  if (!text) return false

  // 1. Intentar copia sincrónica (altamente compatible con eventos touch en iOS)
  if (copyToClipboardSync(text)) {
    return true
  }

  // 2. Intentar API moderna de Clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn('navigator.clipboard.writeText falló:', err)
    }
  }

  return false
}

/**
 * Genera el recordatorio con la plantilla, lo copia al portapapeles,
 * muestra un toast y abre la app de Instagram (en móvil) o su perfil web con https:// (en escritorio).
 * NUNCA redirige la página actual (window.location.href) para evitar sacar a la usuaria de la PWA en iOS.
 */
export async function copyReminderAndOpenInstagram({
  appointment,
  clients = [],
  template,
  businessName,
  showToast,
}) {
  if (!appointment) return

  const { name: clientName, phone: clientPhone, instagramUser } = resolveAppointmentClient(appointment, clients)
  const cleanUser = cleanInstagram(instagramUser || appointment.clientInstagram || appointment.instagram || '')

  if (!cleanUser) {
    showToast?.('Sin usuario de Instagram registrado', 'error')
    return
  }

  const reminderText = fillTemplate(
    template,
    appointmentMessageVars({ ...appointment, clientName, clientPhone }, businessName),
  )

  // 1. Copia sincrónica directa dentro del evento de tap (no pierde activación en iOS)
  const copied = copyToClipboardSync(reminderText)
  if (!copied) {
    try {
      await copyToClipboard(reminderText)
    } catch (err) {
      console.warn('Error al copiar recordatorio al portapapeles:', err)
    }
  }

  showToast?.('Mensaje copiado al portapapeles')

  // 2. Abrir Instagram:
  // - En móviles (iOS / Android): lanza instagram://user?username=... (app nativa)
  // - En escritorio o si no tiene app: pestaña nueva con https://www.instagram.com/.../
  // - NUNCA redirige window.location.href (protege la PWA instalable de iOS)
  openInstagramProfile(cleanUser)
}
