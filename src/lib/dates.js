import {
  addDays,
  addMinutes,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  endOfDay,
} from 'date-fns'
import { es } from 'date-fns/locale'

export const DAY_START_HOUR = 8
export const DAY_END_HOUR = 21
export const HOUR_HEIGHT = 72

export function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value?.toDate === 'function') return value.toDate()
  if (typeof value === 'string') return parseISO(value)
  return new Date(value)
}

export function formatDayLabel(date) {
  return format(date, "EEEE d 'de' MMMM", { locale: es })
}

export function formatShortDate(date) {
  return format(date, 'd MMM yyyy', { locale: es })
}

export function formatTime(date) {
  return format(date, 'HH:mm')
}

export function formatWeekday(date) {
  return format(date, 'EEE', { locale: es }).replace('.', '')
}

export function getWeekDays(anchor) {
  const start = startOfWeek(anchor, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function buildTimeSlots() {
  return Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i)
}

export function minutesFromDayStart(date) {
  return date.getHours() * 60 + date.getMinutes() - DAY_START_HOUR * 60
}

export function appointmentStyle(startAt, endAt) {
  const start = toDate(startAt)
  const end = toDate(endAt)
  const top = (minutesFromDayStart(start) / 60) * HOUR_HEIGHT
  const height = Math.max(((end - start) / 60000 / 60) * HOUR_HEIGHT, 56)
  return { top, height }
}

export function computeEnd(startDate, durationMinutes) {
  return addMinutes(startDate, Number(durationMinutes) || 60)
}

export function dateInputValue(date) {
  return format(date, 'yyyy-MM-dd')
}

export function timeInputValue(date) {
  return format(date, 'HH:mm')
}

export function combineDateAndTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`)
}

export function isInDay(value, day) {
  const date = toDate(value)
  return date ? isSameDay(date, day) : false
}

export function getMonthMatrix(anchor) {
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 })
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

export function buildTimeSlotsEvery(stepMinutes = 15) {
  const slots = []
  for (let minutes = DAY_START_HOUR * 60; minutes < DAY_END_HOUR * 60; minutes += stepMinutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`)
  }
  return slots
}

export function formatMonthTitle(date) {
  return format(date, 'MMMM yyyy', { locale: es })
}

export function appointmentMonthKey(value) {
  const date = toDate(value)
  return date ? format(date, 'yyyy-MM') : ''
}

export function formatWeekRange(anchor) {
  const days = getWeekDays(anchor)
  const first = days[0]
  const last = days[6]
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} ${format(first, 'MMM', { locale: es })}`
  }
  return `${format(first, 'd MMM', { locale: es })} – ${format(last, 'd MMM', { locale: es })}`
}

/**
 * Convierte minutos a un formato compacto y amigable de horas y minutos.
 * Ejemplos:
 *   40 -> "40 min"
 *   60 -> "1 h"
 *   90 -> "1 h 30 min"
 *   120 -> "2 h"
 */
export function formatDuration(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0))
  if (m === 0) return '0 min'
  if (m < 60) return `${m} min`
  const hours = Math.floor(m / 60)
  const remaining = m % 60
  if (remaining === 0) {
    return `${hours} h`
  }
  return `${hours} h ${remaining} min`
}

/**
 * Convierte minutos a una frase explicativa en español.
 * Ejemplos:
 *   120 -> "2 horas"
 *   60 -> "1 hora"
 *   90 -> "1 hora 30 min"
 *   40 -> "40 min"
 */
export function formatDurationWords(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0))
  if (m === 0) return '0 min'
  if (m < 60) return `${m} min`
  const hours = Math.floor(m / 60)
  const remaining = m % 60
  const hourText = hours === 1 ? '1 hora' : `${hours} horas`
  if (remaining === 0) {
    return hourText
  }
  return `${hourText} ${remaining} min`
}

export { addDays, addMonths, isSameDay, isSameMonth, isToday, startOfDay, endOfDay, startOfWeek }
