import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'

export function ActionSheet({ title, message, onClose, children }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex flex-col justify-end bg-ink/30 backdrop-blur-[2px] fade-in"
      style={{
        paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        paddingLeft: 10,
        paddingRight: 10,
      }}
    >
      <button type="button" className="min-h-0 flex-1" aria-label="Cerrar" onClick={onClose} />
      <div className="sheet-enter mx-auto flex w-full max-w-md flex-col gap-2">
        <div className="overflow-hidden rounded-[14px] bg-white/93 shadow-[0_12px_40px_rgba(61,43,36,0.16)] backdrop-blur-xl">
          {title || message ? (
            <div className="border-b border-nude/70 px-4 py-3 text-center">
              {title ? <p className="text-[13px] font-semibold text-muted">{title}</p> : null}
              {message ? <p className="mt-0.5 text-[12px] leading-snug text-muted/80">{message}</p> : null}
            </div>
          ) : null}
          <div className="max-h-[60dvh] overflow-y-auto overscroll-contain">{children}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[56px] w-full rounded-[14px] bg-white/95 text-[17px] font-semibold text-rose shadow-[0_8px_24px_rgba(61,43,36,0.08)] active:bg-nude/50"
        >
          Cancelar
        </button>
      </div>
    </div>,
    document.body,
  )
}

export function ActionSheetItem({ children, onClick, active = false, destructive = false, centered = false }) {
  const alignCenter = destructive || centered
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[54px] w-full items-center gap-3 border-b border-nude/70 px-4 last:border-b-0 active:bg-nude/40 ${
        alignCenter ? 'justify-center' : 'text-left'
      } ${destructive ? 'text-[17px] font-semibold text-[#c42b4a]' : 'text-[17px] text-ink'}`}
    >
      <span className={`${alignCenter ? '' : 'min-w-0 flex-1 truncate'} ${active ? 'font-semibold' : ''}`}>
        {children}
      </span>
      {active ? <Check size={18} className="shrink-0 text-rose" /> : null}
    </button>
  )
}
