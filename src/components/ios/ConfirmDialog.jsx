import { createPortal } from 'react-dom'

export function ConfirmDialog({
  open,
  title,
  message,
  cancelLabel = 'Cancelar',
  confirmLabel = 'Confirmar',
  destructive = false,
  confirmTone = 'primary',
  onCancel,
  onConfirm,
}) {
  if (!open) return null

  const isDestructive = destructive || confirmTone === 'destructive'
  const isSage = confirmTone === 'sage' || confirmTone === 'success'

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/40 px-6 backdrop-blur-sm transition-opacity duration-200 fade-in"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="alert-pop w-full max-w-[330px] overflow-hidden rounded-[26px] border border-nude/70 bg-pearl shadow-[0_24px_50px_rgba(61,43,36,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 pb-4 pt-6 text-center">
          <h3 id="confirm-title" className="text-[18px] font-semibold leading-tight text-ink">
            {title}
          </h3>
          {message ? (
            <p id="confirm-message" className="mt-2 text-[14px] leading-relaxed text-muted">
              {message}
            </p>
          ) : null}
        </div>
        <div className="border-t border-nude/80">
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-12 w-full px-4 py-3 text-[16px] font-semibold active:bg-nude/40 transition-colors ${
              isDestructive
                ? 'text-[#d32f2f]'
                : isSage
                  ? 'text-sage'
                  : 'text-rose'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 w-full border-t border-nude/80 px-4 py-3 text-[16px] font-medium text-[#786b63] active:bg-nude/40 transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
