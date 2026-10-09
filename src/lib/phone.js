export const DEFAULT_COUNTRY_CODE = '52'
export const LOCAL_PHONE_LENGTH = 10

export function digitsOnly(value = '') {
  return String(value).replace(/\D/g, '')
}

/** Conserva solo los 10 dígitos locales. Si pegan +52 / 52, los elimina. */
export function toLocalDigits(value = '') {
  let digits = digitsOnly(value)
  if (digits.startsWith(DEFAULT_COUNTRY_CODE) && digits.length > LOCAL_PHONE_LENGTH) {
    digits = digits.slice(DEFAULT_COUNTRY_CODE.length)
  }
  return digits.slice(0, LOCAL_PHONE_LENGTH)
}

export function isValidLocalPhone(value = '') {
  return toLocalDigits(value).length === LOCAL_PHONE_LENGTH
}

/** Formato estándar en Firestore: +52XXXXXXXXXX */
export function toStoredPhone(value = '') {
  const local = toLocalDigits(value)
  if (!isValidLocalPhone(local)) return ''
  return `+${DEFAULT_COUNTRY_CODE}${local}`
}

/** Número para wa.me: 52 + 10 dígitos, sin + ni espacios */
export function toWhatsAppNumber(value = '') {
  const local = toLocalDigits(value)
  if (!isValidLocalPhone(local)) return ''
  return `${DEFAULT_COUNTRY_CODE}${local}`
}

export function telHref(value) {
  const local = toLocalDigits(value)
  if (!isValidLocalPhone(local)) return null
  return `tel:+${DEFAULT_COUNTRY_CODE}${local}`
}

export function formatPhoneDisplay(value) {
  const local = toLocalDigits(value)
  if (!local) return ''
  if (local.length === LOCAL_PHONE_LENGTH) {
    return `+52 ${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`
  }
  return `+52 ${local}`
}
