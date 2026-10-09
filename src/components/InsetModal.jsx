import { Search, X } from 'lucide-react'

export function InsetModal({ title, onClose, children, footer, search, filters, nested = false }) {
  const zClass = nested === 'deep' ? 'z-[80]' : nested ? 'z-[75]' : 'z-50'

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-ink/40 backdrop-blur-md ${zClass}`}
      style={{
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        paddingLeft: 12,
        paddingRight: 12,
      }}
      onClick={onClose}
    >
      <section
        className="inset-enter flex h-auto max-h-[85vh] w-full max-w-md min-h-0 flex-col overflow-hidden rounded-[28px] bg-pearl shadow-[0_20px_50px_rgba(61,43,36,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 border-b border-nude/80 bg-pearl px-4 pb-3 pt-3">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="min-w-0 flex-1 font-display text-[26px] leading-none text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-nude text-ink"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
          {search}
          {filters}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">{children}</div>
        {footer ? (
          <div className="w-full shrink-0 border-t border-nude bg-pearl p-4">{footer}</div>
        ) : null}
      </section>
    </div>
  )
}

export function SearchField({ value, onChange, placeholder }) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-2xl bg-nude/80 px-3 focus-within:ring-4 focus-within:ring-blush/70">
      <Search size={18} className="shrink-0 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted/50"
      />
    </label>
  )
}
