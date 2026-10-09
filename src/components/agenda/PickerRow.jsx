import { Children } from 'react'
import { ChevronRight } from 'lucide-react'

export function GroupedPicker({ children }) {
  const items = Children.toArray(children).filter(Boolean)
  return (
    <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_8px_24px_rgba(61,43,36,0.04)]">
      {items.map((child, index) => (
        <div key={index}>
          {index > 0 ? <div className="ml-14 h-px bg-nude" /> : null}
          {child}
        </div>
      ))}
    </div>
  )
}

export function PickerRow({ label, value, placeholder = 'Elegir', onClick, avatar, grouped = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-14 w-full items-center gap-3 px-3.5 py-2.5 text-left transition ${
        grouped
          ? 'bg-white active:bg-nude/50'
          : 'h-14 rounded-2xl border border-sand/80 bg-white/85 shadow-sm active:scale-[0.99]'
      }`}
    >
      {avatar}
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</span>
        <span className={`block truncate text-[16px] ${value ? 'font-medium text-ink' : 'text-muted/70'}`}>
          {value || placeholder}
        </span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </button>
  )
}

export function ClientAvatar({ name, size = 40 }) {
  const letter = (name || '?').slice(0, 1).toUpperCase()
  const tones = ['bg-blush text-rose-deep', 'bg-gold-soft/80 text-ink', 'bg-nude text-muted', 'bg-[#dce8df] text-sage']
  const tone = tones[(name || '').length % tones.length]
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${tone}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {letter}
    </span>
  )
}
