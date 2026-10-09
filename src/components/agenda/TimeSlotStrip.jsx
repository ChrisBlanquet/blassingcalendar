import { buildTimeSlotsEvery } from '../../lib/dates'

export function TimeSlotStrip({ value, onSelect, step = 30, layout = 'row' }) {
  const slots = buildTimeSlotsEvery(step)
  if (value && !slots.includes(value)) {
    slots.push(value)
    slots.sort()
  }

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-4 gap-1.5">
        {slots.map((slot) => (
          <SlotButton key={slot} slot={slot} active={slot === value} onSelect={onSelect} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5">
      {slots.map((slot) => (
        <SlotButton key={slot} slot={slot} active={slot === value} onSelect={onSelect} compact />
      ))}
    </div>
  )
}

function SlotButton({ slot, active, onSelect, compact = false }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(slot)}
      className={`${compact ? 'h-10 min-w-[4.25rem] shrink-0' : 'h-9'} rounded-xl text-[13px] font-semibold ${
        active ? 'bg-rose text-white shadow-sm' : 'bg-white text-ink ring-1 ring-nude'
      }`}
    >
      {slot}
    </button>
  )
}
