export function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function formatMoney(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(toNumber(value))
}

export function pendingBalance(total, deposit) {
  return Math.max(toNumber(total) - toNumber(deposit), 0)
}

export function priceAdjustment(catalogSum, total) {
  const delta = Math.round((toNumber(total) - toNumber(catalogSum)) * 100) / 100
  if (Math.abs(delta) < 0.01) return null
  if (delta > 0) {
    return { kind: 'extra', label: 'Diseño personalizado / Ajuste', amount: delta }
  }
  return { kind: 'discount', label: 'Descuento / Promoción', amount: delta }
}

export function formatSignedMoney(amount) {
  const formatted = formatMoney(Math.abs(amount))
  return amount < 0 ? `-${formatted}` : `+${formatted}`
}
