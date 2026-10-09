export const DEFAULT_CATEGORIES = [
  { id: 'manos', name: 'Manos / Gelish', short: 'Manos', emoji: '💅', order: 0 },
  { id: 'acrilico', name: 'Acrílico / Esculturales', short: 'Esculturales', emoji: '💎', order: 1 },
  { id: 'pies', name: 'Pies / Pedicure', short: 'Pies', emoji: '🦶', order: 2 },
  { id: 'complementos', name: 'Complementos / Diseños', short: 'Complementos', emoji: '✨', order: 3 },
  { id: 'cuidados', name: 'Cuidados / Retiros', short: 'Cuidados', emoji: '🧼', order: 4 },
]

export const EMOJI_PRESETS = ['💅', '💎', '🦶', '✨', '🧼', '🌸', '💖', '🎀', '🤍', '💫']

export function categoryShortName(category) {
  if (category?.short) return category.short
  const name = String(category?.name || category?.label || '').trim()
  if (!name) return 'Categoría'
  return name.split('/')[0].trim() || name
}

export function normalizeCategory(item) {
  const name = String(item?.name || item?.label || '').trim() || 'Categoría'
  return {
    id: item.id,
    name,
    short: categoryShortName({ ...item, name }),
    emoji: String(item?.emoji || '✨').trim() || '✨',
    order: Number.isFinite(Number(item?.order)) ? Number(item.order) : 0,
  }
}

export function inferLegacyCategoryId(service) {
  const name = String(service?.name || '').toLowerCase()
  if (/pedi|pie[s]?/.test(name)) return 'pies'
  if (/acr[ií]l|escultur/.test(name)) return 'acrilico'
  if (/retiro|remo|cuidado|spa|cut[ií]cula/.test(name)) return 'cuidados'
  if (/dise[nñ]o|cromo|cristal|nail art|extra|complement/.test(name)) return 'complementos'
  if (/gelish|mano|mani|esmalte/.test(name)) return 'manos'
  return service?.kind === 'addon' ? 'complementos' : 'manos'
}
