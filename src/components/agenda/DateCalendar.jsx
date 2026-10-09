import { Sheet } from '../Sheet'
import { CompactCalendar } from './CompactCalendar'

export function DateCalendar({ value, onSelect, onClose }) {
  return (
    <Sheet title="Fecha" onClose={onClose} nested>
      <CompactCalendar value={value} onSelect={onSelect} />
    </Sheet>
  )
}
