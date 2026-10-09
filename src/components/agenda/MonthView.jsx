import { getMonthMatrix, isSameMonth, isToday, toDate } from '../../lib/dates'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function MonthView({ month, appointments, onOpenDay }) {
  const days = getMonthMatrix(month)

  return (
    <div className="slide-fade px-4 pb-6">
      <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-semibold text-muted">
        {WEEKDAYS.map((day, index) => (
          <span key={`${day}-${index}`} className="py-1">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const count = appointments.filter(
            (apt) => sameDay(apt.startAt, day) && apt.status !== 'cancelled',
          ).length
          const inMonth = isSameMonth(day, month)
          const today = isToday(day)

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onOpenDay(day)}
              className={`flex min-h-[62px] flex-col items-center rounded-2xl pt-1.5 transition-all duration-300 ease-out ${
                today ? 'bg-blush/80' : inMonth ? 'bg-white/70' : 'bg-transparent'
              }`}
            >
              <span
                className={`grid h-8 w-8 place-items-center rounded-full text-sm font-medium ${
                  today ? 'bg-rose text-white' : inMonth ? 'text-ink' : 'text-muted/35'
                }`}
              >
                {day.getDate()}
              </span>
              {count > 0 ? (
                <span className="mt-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-gold-soft px-1 text-[10px] font-semibold text-ink">
                  {count}
                </span>
              ) : (
                <span className="mt-0.5 h-3" />
              )}
            </button>
          )
        })}
      </div>
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
