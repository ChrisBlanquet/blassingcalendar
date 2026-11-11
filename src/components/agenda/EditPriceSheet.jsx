import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { RotateCcw, X } from 'lucide-react'
import { Button } from '../ui'
import { formatMoney, toNumber } from '../../lib/money'

export function EditPriceSheet({ item, basePrice, onClose, onConfirm }) {
  if (!item) return null

  const inputRef = useRef(null)
  const initialVal = item.rawPrice !== undefined ? item.rawPrice : String(item.price ?? 0)
  const [val, setVal] = useState(initialVal)

  const catalogBase = basePrice !== undefined ? basePrice : (item.catalogPrice ?? item.price ?? 0)
  const isDifferentFromBase = toNumber(val) !== toNumber(catalogBase)

  useEffect(() => {
    // Timeout para permitir que la animación de entrada de iOS monte el DOM antes de enfocar
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }, 70)
    return () => clearTimeout(timer)
  }, [])

  function handleSave(e) {
    e?.preventDefault()
    onConfirm(val)
  }

  function handleReset() {
    setVal(String(catalogBase))
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex flex-col justify-end bg-black/40 backdrop-blur-sm transition-opacity fade-in"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-price-title"
        className="sheet-enter max-h-[90dvh] overflow-hidden rounded-t-[28px] bg-pearl shadow-[0_-12px_40px_rgba(61,43,36,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior de arrastre estilo iOS */}
        <div className="mx-auto mt-2.5 mb-1 h-1.5 w-10 rounded-full bg-sand" />

        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3 px-6 pt-2 pb-2">
          <div className="min-w-0 flex-1">
            <h2 id="edit-price-title" className="truncate font-display text-[22px] leading-tight text-ink">
              Ajustar precio de {item.name}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Precio base de catálogo: <span className="font-semibold text-ink">{formatMoney(catalogBase)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-nude text-ink active:scale-95 transition-transform"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario central con input hero destacado */}
        <form onSubmit={handleSave} className="px-6 py-4">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-sand/70 py-6 px-4 shadow-sm">
            <label htmlFor="price-hero-input" className="text-[11px] font-semibold tracking-wide text-muted uppercase mb-2">
              Precio personalizado
            </label>
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="font-display text-4xl font-semibold text-muted select-none">$</span>
              <input
                id="price-hero-input"
                ref={inputRef}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                autoFocus
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="w-48 bg-transparent text-center font-display text-5xl font-bold text-ink outline-none"
                placeholder="0"
              />
            </div>
            {isDifferentFromBase ? (
              <button
                type="button"
                onClick={handleReset}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-nude px-3 py-1 text-xs font-semibold text-rose-deep active:scale-95 transition-transform"
              >
                <RotateCcw size={12} />
                Restablecer a ${catalogBase}
              </button>
            ) : null}
          </div>

          <div className="mt-4 space-y-2">
            <Button type="submit" className="w-full">
              Confirmar precio
            </Button>
            <Button type="button" variant="ghost" className="w-full text-muted" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  )
}
