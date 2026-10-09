import { toDate } from './dates'
import { OWNER_STAFF_ID } from './staff'

export function appointmentStaffId(appointment) {
  return appointment?.staffId || OWNER_STAFF_ID
}

export function findOverlappingAppointment(appointments, startAt, endAt, excludeId, staffId) {
  const start = startAt.getTime()
  const end = endAt.getTime()
  if (!start || !end) return null
  const targetStaff = staffId || OWNER_STAFF_ID

  return (
    appointments.find((apt) => {
      if (excludeId && apt.id === excludeId) return false
      if (apt.status === 'cancelled') return false
      if (appointmentStaffId(apt) !== targetStaff) return false
      const aptStart = toDate(apt.startAt)
      const aptEnd = toDate(apt.endAt)
      if (!aptStart || !aptEnd) return false
      return aptStart.getTime() < end && aptEnd.getTime() > start
    }) || null
  )
}

export function conflictMessage(appointment, staffName) {
  const name = staffName || appointment?.staffName || 'La colaboradora'
  const service = appointment?.serviceName || 'una cita'
  return `⚠️ ${name} ya tiene agendado ${service} a esa hora`
}
