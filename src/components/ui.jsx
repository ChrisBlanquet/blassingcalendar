export function Field({ label, children, hint }) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="px-1 text-sm font-medium text-muted">{label}</span> : null}
      {children}
      {hint ? <span className="px-1 text-xs text-muted/80">{hint}</span> : null}
    </label>
  )
}

export function TextInput({ className = '', ...props }) {
  return (
    <input
      className={`h-12 w-full rounded-2xl border border-sand/80 bg-white/80 px-4 text-ink shadow-sm outline-none transition placeholder:text-muted/50 focus:border-rose/50 focus:ring-4 focus:ring-blush/70 ${className}`}
      {...props}
    />
  )
}

export function TextArea({ className = '', ...props }) {
  const hasHeight = /(^|\s)(min-h-|h-)/.test(className)
  return (
    <textarea
      className={`w-full resize-none break-words rounded-2xl border border-sand/80 bg-white/80 px-4 py-3.5 text-[16px] leading-relaxed text-ink shadow-sm outline-none transition placeholder:text-muted/50 focus:border-rose/50 focus:ring-4 focus:ring-blush/70 ${hasHeight ? '' : 'min-h-28'} ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`h-12 w-full appearance-none rounded-2xl border border-sand/80 bg-white/80 px-4 text-ink shadow-sm outline-none transition focus:border-rose/50 focus:ring-4 focus:ring-blush/70 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  const variants = {
    primary:
      'bg-rose text-white shadow-[0_8px_20px_rgba(201,123,132,0.35)] hover:bg-rose-deep',
    gold: 'bg-gold text-white shadow-[0_8px_20px_rgba(201,163,107,0.35)] hover:brightness-95',
    ghost: 'bg-white/70 text-ink border border-sand hover:bg-nude/60',
    danger: 'bg-white text-rose-deep border border-blush hover:bg-blush/40',
    whatsapp: 'bg-whatsapp text-white shadow-[0_8px_20px_rgba(37,211,102,0.28)]',
  }

  return (
    <button
      type={type}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 font-medium active:scale-[0.98] disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function StatusBadge({ status, compact = false }) {
  const map = {
    pending: { label: 'Pendiente', className: 'bg-blush/80 text-rose-deep' },
    confirmed: { label: 'Confirmada', className: 'bg-[#dce8df]/80 text-sage' },
    finalizada: { label: 'Finalizada', className: 'bg-[#dce8df]/80 text-sage' },
    completed: { label: 'Finalizada', className: 'bg-[#dce8df]/80 text-sage' },
    cancelled: { label: 'Cancelada', className: 'bg-sand text-muted' },
  }
  const item = map[status] || map.pending
  return (
    <span
      className={`rounded-full font-semibold ${item.className} ${
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {item.label}
    </span>
  )
}

export function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="fade-in mx-auto max-w-xs px-4 py-16 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-blush/70 text-rose">
        {Icon ? <Icon size={28} /> : null}
      </div>
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
    </div>
  )
}

export function Fab({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Agregar"
      className="fixed right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-rose text-white shadow-[0_12px_28px_rgba(201,123,132,0.45)] active:scale-95"
      style={{ bottom: 'calc(5.75rem + env(safe-area-inset-bottom))' }}
    >
      {children}
    </button>
  )
}
