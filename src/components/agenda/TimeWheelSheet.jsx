import { Sheet } from '../Sheet'
import { Button } from '../ui'
import { DAY_END_HOUR, DAY_START_HOUR } from '../../lib/dates'
import { useState } from 'react'

const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, index) =>
  String(DAY_START_HOUR + index).padStart(2, '0'),
)
const MINUTES = ['00', '15', '30', '45']

function pad(value) {
  return String(value).padStart(2, '0')
}

function snapMinute(minute) {
  const n = Number(minute)
  if (!Number.isFinite(n)) return '00'
  const closest = MINUTES.reduce((best, option) =>
    Math.abs(Number(option) - n) < Math.abs(Number(best) - n) ? option : best,
  )
  return closest
}

export function TimeWheelSheet({ value, onSelect, onClose }) {
  const [hours, minutes] = String(value || '10:00').split(':')
  const [hour, setHour] = useState(HOURS.includes(pad(hours)) ? pad(hours) : '10')
  const [minute, setMinute] = useState(snapMinute(minutes))

  return (
    <Sheet
      title="Hora de inicio"
      onClose={onClose}
      nested
      footer={
        <Button
          className="w-full"
          onClick={() => {
            onSelect(`${hour}:${minute}`)
            onClose()
          }}
        >
          Listo
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <WheelColumn label="Hora" options={HOURS} value={hour} onChange={setHour} />
        <WheelColumn label="Min" options={MINUTES} value={minute} onChange={setMinute} />
      </div>
    </Sheet>
  )
}

function WheelColumn({ label, options, value, onChange }) {
  return (
    <div className="overflow-hidden rounded-[22px] bg-white">
      <p className="px-3 pt-3 text-center text-[11px] font-semibold tracking-wide text-muted uppercase">
        {label}
      </p>
      <div className="max-h-56 overflow-y-auto px-2 py-2">
        {options.map((option) => {
          const active = option === value
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`mb-1 flex h-11 w-full items-center justify-center rounded-2xl text-[20px] font-semibold ${
                active ? 'bg-blush text-rose-deep' : 'text-ink'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
