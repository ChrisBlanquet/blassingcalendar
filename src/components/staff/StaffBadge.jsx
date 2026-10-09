export function StaffBadge({ name, color, compact = false }) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 truncate rounded-full font-semibold text-white ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
      style={{ backgroundColor: color || '#c97b84' }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/85" />
      <span className="truncate">{name || 'Equipo'}</span>
    </span>
  )
}

export function StaffDot({ color, size = 28, name }) {
  const letter = (name || '?').slice(0, 1).toUpperCase()
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, backgroundColor: color || '#c97b84', fontSize: size * 0.4 }}
    >
      {letter}
    </span>
  )
}
