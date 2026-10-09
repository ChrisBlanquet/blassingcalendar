export const OWNER_STAFF_ID = 'owner'

export const STAFF_COLORS = [
  '#c97b84',
  '#c9a36b',
  '#7d9b86',
  '#9b7bb8',
  '#6b8fc9',
  '#c47a5a',
]

export function isOwnerStaff(member) {
  return member?.id === OWNER_STAFF_ID || member?.role === 'owner'
}

export function ownerDisplayName(profile) {
  return profile?.ownerName || 'Dueña'
}

export function resolveStaff(appointment, staff = []) {
  const id = appointment?.staffId || OWNER_STAFF_ID
  const found = staff.find((member) => member.id === id)
  if (found) return found
  return {
    id,
    name: appointment?.staffName || 'Dueña',
    color: appointment?.staffColor || STAFF_COLORS[0],
    role: id === OWNER_STAFF_ID ? 'owner' : 'staff',
  }
}

export function nextStaffColor(existing = []) {
  const used = new Set(existing.map((member) => member.color))
  return STAFF_COLORS.find((color) => !used.has(color)) || STAFF_COLORS[existing.length % STAFF_COLORS.length]
}
