import { Sheet } from '../Sheet'
import { TimeSlotStrip } from './TimeSlotStrip'

export function TimeSlots({ value, onSelect, onClose }) {
  return (
    <Sheet title="Hora de inicio" onClose={onClose} nested>
      <TimeSlotStrip value={value} onSelect={onSelect} step={15} layout="grid" />
    </Sheet>
  )
}
