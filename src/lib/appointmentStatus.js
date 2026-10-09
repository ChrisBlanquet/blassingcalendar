export const APPOINTMENT_STATUS = {
  pending: 'pending',
  confirmed: 'confirmed',
  finished: 'finalizada',
  cancelled: 'cancelled',
}

export function isFinished(status) {
  return status === APPOINTMENT_STATUS.finished || status === 'completed'
}

export function isCancelled(status) {
  return status === APPOINTMENT_STATUS.cancelled
}

export function editorStatus(status) {
  if (isFinished(status)) return APPOINTMENT_STATUS.finished
  return status || APPOINTMENT_STATUS.pending
}

export function statusMatches(status, filter) {
  if (!filter || filter === 'all') return true
  if (filter === APPOINTMENT_STATUS.finished || filter === 'completed') return isFinished(status)
  return status === filter
}
