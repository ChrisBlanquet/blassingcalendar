import { inferLegacyCategoryId } from './categories'

export const SERVICE_KIND = {
  principal: 'principal',
  addon: 'addon',
}

export function serviceKind(service) {
  return service?.kind === SERVICE_KIND.addon ? SERVICE_KIND.addon : SERVICE_KIND.principal
}

export function defaultCategoryForKind(kind, categories = []) {
  if (!categories.length) return ''
  if (kind === SERVICE_KIND.addon) {
    const addon = categories.find((item) => /complement|dise[nñ]o|extra/.test(`${item.id} ${item.name}`.toLowerCase()))
    if (addon) return addon.id
  }
  const principal = categories.find((item) => /mano|gelish/.test(`${item.id} ${item.name}`.toLowerCase()))
  return principal?.id || categories[0].id
}

export function serviceCategory(service, categories = []) {
  const stored = service?.category
  if (stored && categories.some((item) => item.id === stored)) return stored

  const inferred = inferLegacyCategoryId(service)
  if (categories.some((item) => item.id === inferred)) return inferred

  const name = String(service?.name || '').toLowerCase()
  const match = categories.find((item) => {
    const hay = `${item.id} ${item.name} ${item.short}`.toLowerCase()
    return hay.split(/\s+|\/|,/).filter(Boolean).some((token) => token.length > 2 && name.includes(token))
  })
  if (match) return match.id
  return defaultCategoryForKind(serviceKind(service), categories)
}

export function groupServicesByCategory(services = [], categories = []) {
  return categories
    .map((category) => ({
      ...category,
      label: category.name,
      items: services.filter((service) => serviceCategory(service, categories) === category.id),
    }))
    .filter((group) => group.items.length > 0)
}

export function splitCatalog(services = []) {
  return {
    principals: services.filter((service) => serviceKind(service) === SERVICE_KIND.principal),
    addons: services.filter((service) => serviceKind(service) === SERVICE_KIND.addon),
  }
}

export function getAppointmentServices(appointment) {
  if (Array.isArray(appointment?.services) && appointment.services.length) {
    return appointment.services
  }
  if (appointment?.serviceName) {
    return [
      {
        id: appointment.serviceId || 'legacy',
        name: appointment.serviceName,
        duration: appointment.duration || 60,
        price: appointment.total ?? 0,
        kind: SERVICE_KIND.principal,
      },
    ]
  }
  return []
}

export function sumServices(items = []) {
  return items.reduce(
    (acc, item) => ({
      duration: acc.duration + Number(item.duration || 0),
      price: acc.price + Number(item.price || 0),
    }),
    { duration: 0, price: 0 },
  )
}

export function serviceSummary(appointment) {
  const items = getAppointmentServices(appointment)
  if (!items.length) {
    return { label: 'Servicio', extra: 0, extraKind: 'addon', full: 'Servicio', items, principals: [], addons: [] }
  }

  const principals = items.filter((item) => serviceKind(item) !== SERVICE_KIND.addon)
  const addons = items.filter((item) => serviceKind(item) === SERVICE_KIND.addon)
  const names = (principals.length ? principals : items).map((item) => item.name)
  const label = names.length <= 2 ? names.join(' + ') : `${names[0]} + ${names[1]}`
  const extra = addons.length + Math.max(0, names.length - 2)
  const extraKind = addons.length ? 'addon' : 'service'
  const full = items.map((item) => item.name).join(' + ')

  return { label, extra, extraKind, full, items, principals, addons }
}

export function extraLabel(extra, extraKind = 'addon') {
  if (extra <= 0) return ''
  if (extraKind === 'addon') {
    return extra === 1 ? '+1 extra' : `+${extra} extras`
  }
  return extra === 1 ? '+1 servicio' : `+${extra} servicios`
}
