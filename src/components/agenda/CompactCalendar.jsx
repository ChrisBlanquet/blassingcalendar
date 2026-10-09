import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  addMonths,
  dateInputValue,
  formatMonthTitle,
  getMonthMatrix,
  isSameDay,
  isSameMonth,
  isToday,
} from '../../lib/dates'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function CompactCalendar({ value, onSelect }) {
  const selected = value ? new Date(`${value}T12:00:00`) : new Date()
  const [cursor, setCursor] = useState(selected)
  const days = getMonthMatrix(cursor)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor((prev) => addMonths(prev, -1))}
          className="grid h-11 w-11 place-items-center rounded-full bg-nude"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-display text-xl capitalize leading-none text-ink">{formatMonthTitle(cursor)}</p>
        <button
          type="button"
          onClick={() => setCursor((prev) => addMonths(prev, 1))}
          className="grid h-11 w-11 place-items-center rounded-full bg-nude"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold tracking-wide text-muted">
        {WEEKDAYS.map((day, index) => (
          <span key={`${day}-${index}`} className="py-1">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-x-1 gap-y-2">
        {days.map((day) => {
          const inMonth = isSameMonth(day, cursor)
          const selectedDay = isSameDay(day, selected)
          const today = isToday(day)
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(dateInputValue(day))}
              className={`mx-auto grid h-11 w-11 place-items-center rounded-full text-[15px] font-bold ${
                selectedDay
                  ? 'bg-rose text-white shadow-[0_6px_14px_rgba(201,123,132,0.35)]'
                  : today
                    ? 'text-ink ring-2 ring-gold/80'
                    : inMonth
                      ? 'text-ink'
                      : 'text-muted/30'
              }`}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
