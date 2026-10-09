import { ChevronRight } from 'lucide-react'
import { formatTime, formatWeekday, isToday, toDate } from '../../lib/dates'

export function WeekGrid({ days, appointments, onOpenDay }) {
  return (
    <div className="slide-fade space-y-2 px-5 pb-6">
      {days.map((day) => {
        const dayApts = appointments
          .filter((apt) => sameDay(apt.startAt, day) && apt.status !== 'cancelled')
          .sort((a, b) => toDate(a.startAt) - toDate(b.startAt))
        const preview = dayApts.slice(0, 3)

        return (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onOpenDay(day)}
            className={`w-full rounded-[22px] border px-4 py-3 text-left transition-all duration-300 ease-out active:scale-[0.99] ${
              isToday(day) ? 'border-gold bg-gold-soft/25' : 'border-nude bg-white/85'
            }`}
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="w-12 text-center">
                <p className="text-[10px] font-semibold tracking-wide text-muted uppercase">
                  {formatWeekday(day)}
                </p>
                <p className="font-display text-[28px] leading-none text-ink">{day.getDate()}</p>
              </div>
              <div className="min-w-0 flex-1">
                {dayApts.length === 0 ? (
                  <p className="text-sm text-muted">Sin citas</p>
                ) : (
                  <span className="inline-flex rounded-full bg-blush px-2.5 py-1 text-[11px] font-semibold text-rose-deep">
                    {dayApts.length} {dayApts.length === 1 ? 'cita' : 'citas'}
                  </span>
                )}
              </div>
              <ChevronRight size={18} className="shrink-0 text-muted" />
            </div>
            {preview.length ? (
              <div className="space-y-1 border-t border-nude/80 pt-2">
                {preview.map((apt) => (
                  <p key={apt.id} className="truncate text-sm text-ink">
                    <span className="font-medium">{formatTime(toDate(apt.startAt))}</span>
                    <span className="text-muted"> · {apt.clientName}</span>
                  </p>
                ))}
                {dayApts.length > 3 ? (
                  <p className="text-xs text-muted">+{dayApts.length - 3} más</p>
                ) : null}
              </div>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

function sameDay(value, day) {
  const date = toDate(value)
  return (
    date &&
    date.getFullYear() === day.getFullYear() &&
    date.getMonth() === day.getMonth() &&
    date.getDate() === day.getDate()
  )
}
