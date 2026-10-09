import { toLocalDigits } from './phone'
import { toNumber } from './money'
import { toDate } from './dates'
import { isFinished } from './appointmentStatus'

export function appointmentBelongsToClient(appointment, client) {
  if (!appointment || !client) return false
  if (appointment.clientId) return appointment.clientId === client.id
  const aptPhone = toLocalDigits(appointment.clientPhone)
  const clientPhone = toLocalDigits(client.phone)
  return Boolean(aptPhone && clientPhone && aptPhone === clientPhone)
}

export function clientAppointments(appointments = [], client) {
  return appointments.filter((appointment) => appointmentBelongsToClient(appointment, client))
}

export function visitStats(appointments = [], client) {
  const all = clientAppointments(appointments, client).sort((a, b) => {
    return (toDate(b.startAt)?.getTime() || 0) - (toDate(a.startAt)?.getTime() || 0)
  })
  const finished = all.filter((appointment) => isFinished(appointment.status))
  return {
    all,
    finished,
    visits: finished.length,
    spent: finished.reduce((sum, appointment) => sum + toNumber(appointment.total), 0),
  }
}

export function visitLabel(count) {
  if (!count) return 'Primera visita'
  return `• ${count} ${count === 1 ? 'visita' : 'visitas'}`
}
