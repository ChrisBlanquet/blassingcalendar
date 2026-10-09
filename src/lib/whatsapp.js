import { formatMoney } from './money'
import { isValidLocalPhone, toLocalDigits } from './phone'
import { formatShortDate, formatTime, toDate } from './dates'
import { serviceSummary } from './services'

const EMOJI = {
  nail: '\u{1F485}',
  sparkles: '\u2728',
  calendar: '\u{1F4C5}',
  clock: '\u23F0',
  money: '\u{1F4B0}',
}

export const DEFAULT_WHATSAPP_TEMPLATE = [
  `Hola {cliente} ${EMOJI.nail} Te recordamos tu cita:`,
  '',
  `${EMOJI.sparkles} Servicio: {servicio}`,
  `${EMOJI.calendar} Fecha: {fecha}`,
  `${EMOJI.clock} Hora: {hora}`,
  `${EMOJI.money} Saldo pendiente: {saldo}`,
  '',
  '¡Te esperamos con mucho cariño!',
].join('\n')

const PLACEHOLDERS = ['cliente', 'servicio', 'fecha', 'hora', 'saldo', 'negocio']

export function isCorruptedWhatsAppText(text) {
  const value = String(text ?? '')
  if (!value) return false
  if (value.includes('\uFFFD')) return true
  return /Ã.|Â.|ðŸ|âœ|âœ¨|ðŸ’…|ðŸ“…|ðŸ’°/.test(value)
}

export function sanitizeWhatsAppTemplate(template) {
  const value = String(template ?? '')
    .normalize('NFC')
    .replace(/\r\n|\r/g, '\n')
  if (!value.trim() || isCorruptedWhatsAppText(value)) return DEFAULT_WHATSAPP_TEMPLATE
  return value
}

export function fillTemplate(template, vars = {}) {
  let text = sanitizeWhatsAppTemplate(template)
  for (const key of PLACEHOLDERS) {
    text = text.split(`{${key}}`).join(String(vars[key] ?? ''))
  }
  return text
}

export function appointmentMessageVars(appointment, businessName) {
  const start = toDate(appointment.startAt)
  return {
    cliente: appointment.clientName || 'clienta',
    servicio: serviceSummary(appointment).full || 'servicio',
    fecha: start ? formatShortDate(start) : '',
    hora: start ? formatTime(start) : '',
    saldo: formatMoney(appointment.balance ?? 0),
    negocio: businessName || 'el estudio',
  }
}

export function generateWhatsAppUrl(phone, template, data = {}) {
  const text = fillTemplate(template, {
    cliente: data.clientName || data.cliente || '',
    servicio: data.servicesText || data.servicio || '',
    fecha: data.date || data.fecha || '',
    hora: data.time || data.hora || '',
    saldo: data.saldo ?? (data.balance != null ? formatMoney(data.balance) : ''),
    negocio: data.negocio || '',
  })
  return buildWhatsAppUrl(phone, text)
}

export function buildWhatsAppUrl(phone, message) {
  const telefonoLimpio = toLocalDigits(phone)
  if (!isValidLocalPhone(telefonoLimpio)) return null

  const mensajeFinal = String(message ?? '')
    .normalize('NFC')
    .replace(/\r\n|\r/g, '\n')

  const encodedText = encodeURIComponent(mensajeFinal)
  return `https://wa.me/52${telefonoLimpio}?text=${encodedText}`
}

export function openWhatsAppLink(url) {
  if (!url) return
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export function greetingMessage(name) {
  return `Hola ${name || ''} ${EMOJI.nail}`.trim()
}
