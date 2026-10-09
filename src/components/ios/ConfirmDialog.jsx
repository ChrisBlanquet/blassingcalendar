import { createPortal } from 'react-dom'

export function ConfirmDialog({
  open,
  title,
  message,
  cancelLabel = 'Cancelar',
  confirmLabel = 'Confirmar',
  destructive = false,
  onCancel,
  onConfirm,
}) {
  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/40 px-8 backdrop-blur-sm fade-in"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="alert-pop w-full max-w-sm overflow-hidden rounded-3xl bg-pearl shadow-[0_20px_50px_rgba(61,43,36,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 pb-4 pt-6 text-center">
          <h3 id="confirm-title" className="text-[19px] font-semibold leading-tight text-ink">
            {title}
          </h3>
          {message ? (
            <p id="confirm-message" className="mt-2 text-[15px] leading-relaxed text-muted">
              {message}
            </p>
          ) : null}
        </div>
        <div className="border-t border-nude/90">
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-12 w-full px-4 py-3 text-[17px] font-semibold active:bg-nude/40 ${
              destructive ? 'text-[#c42b4a]' : 'text-rose'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 w-full border-t border-nude/90 px-4 py-3 text-[17px] font-medium text-[#5c534e] active:bg-nude/40"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
