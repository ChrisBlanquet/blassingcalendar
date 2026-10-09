import { X } from 'lucide-react'

export function Sheet({ title, onClose, children, footer, headerAction = null, nested = false }) {
  return (
    <div
      className={`fixed inset-0 flex flex-col justify-end bg-ink/25 backdrop-blur-[2px] ${
        nested ? 'z-[75]' : 'z-50'
      }`}
    >
      <button className="flex-1" aria-label="Cerrar" onClick={onClose} />
      <section className="sheet-enter max-h-[92dvh] overflow-y-auto rounded-t-[28px] bg-pearl shadow-[0_-12px_40px_rgba(61,43,36,0.12)]">
        <div className="sticky top-0 z-10 bg-pearl/95 pt-2 backdrop-blur">
          <div className="mx-auto mb-1 h-1.5 w-10 rounded-full bg-sand" />
          <div className="flex items-center gap-2 px-5 pb-3 pt-2">
            <h2 className="min-w-0 flex-1 truncate font-display text-[28px] leading-none text-ink">{title}</h2>
            {headerAction}
            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-nude text-ink"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="px-5 pb-4">{children}</div>
        {footer ? (
          <div className="sticky bottom-0 space-y-2 border-t border-nude bg-pearl/95 px-5 pt-4 pb-[max(16px,calc(env(safe-area-inset-bottom)+10px))] backdrop-blur">
            {footer}
          </div>
        ) : null}
      </section>
    </div>
  )
}
