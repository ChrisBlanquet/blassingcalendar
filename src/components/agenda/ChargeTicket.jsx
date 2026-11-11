import { Pencil, Sparkles } from 'lucide-react'
import { extraLabel, serviceKind, SERVICE_KIND, serviceSummary, sumServices } from '../../lib/services'
import { formatMoney, formatSignedMoney, pendingBalance, priceAdjustment, toNumber } from '../../lib/money'

export function ChargeTicket({ items = [], total, deposit, editable = false, onEditItemPrice }) {
  const summary = serviceSummary({ services: items })
  const principals = summary.principals?.length
    ? summary.principals
    : summary.items.filter((item) => serviceKind(item) !== SERVICE_KIND.addon)
  const addons = summary.addons || summary.items.filter((item) => serviceKind(item) === SERVICE_KIND.addon)
  const catalogSum = sumServices(items).price
  const charged = total !== undefined ? toNumber(total) : catalogSum
  const paid = toNumber(deposit)
  const balance = pendingBalance(charged, paid)
  const adjustment = editable ? null : priceAdjustment(catalogSum, charged)

  return (
    <section className="shrink-0 overflow-hidden rounded-[22px] border border-nude bg-white">
      <div className="border-b border-dashed border-sand px-4 py-3">
        <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Desglose</p>
        <p className="text-sm text-muted">
          {summary.label}
          {summary.extra > 0 ? ` · ${extraLabel(summary.extra, summary.extraKind)}` : ''}
        </p>
      </div>
      <div className="space-y-1 px-4 py-3">
        {principals.map((item) => {
          const key = item.id || item.name
          return (
            <div key={key}>
              {editable ? (
                <button
                  type="button"
                  onClick={() => onEditItemPrice?.(item)}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl px-2.5 py-2 -mx-1 text-left transition-all hover:bg-pearl/80 active:bg-sand/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[15px] font-medium text-ink">{item.name}</span>
                      {item.isCustom ? (
                        <span className="rounded-full bg-gold-soft px-1.5 py-0.5 text-[10px] font-semibold text-ink uppercase tracking-wide">
                          Ajustado
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-sand/80 bg-pearl/90 px-3 py-1 shadow-sm transition-transform active:scale-95 group-hover:border-gold">
                    <span className="text-[15px] font-semibold text-ink">{formatMoney(item.price)}</span>
                    <Pencil size={12} className="text-muted/70 group-hover:text-ink transition-colors" />
                  </div>
                </button>
              ) : (
                <div className="flex items-start justify-between gap-3 text-[15px]">
                  <span className="min-w-0 break-words text-ink">{item.name}</span>
                  <span className="shrink-0 font-medium text-ink">{formatMoney(item.price)}</span>
                </div>
              )}
            </div>
          )
        })}
        {addons.length ? (
          addons.map((item) => {
            const key = item.id || item.name
            return (
              <div key={key}>
                {editable ? (
                  <button
                    type="button"
                    onClick={() => onEditItemPrice?.(item)}
                    className="group flex w-full items-center justify-between gap-3 rounded-2xl px-2.5 py-2 -mx-1 text-left transition-all hover:bg-pearl/80 active:bg-sand/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[15px] text-muted">+ {item.name}</span>
                        {item.isCustom ? (
                          <span className="rounded-full bg-gold-soft px-1.5 py-0.5 text-[10px] font-semibold text-ink uppercase tracking-wide">
                            Ajustado
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-sand/80 bg-pearl/90 px-3 py-1 shadow-sm transition-transform active:scale-95 group-hover:border-gold">
                      <span className="text-[15px] font-medium text-muted">{formatMoney(item.price)}</span>
                      <Pencil size={12} className="text-muted/70 group-hover:text-ink transition-colors" />
                    </div>
                  </button>
                ) : (
                  <div className="flex items-start justify-between gap-3 text-[15px]">
                    <span className="min-w-0 break-words text-muted">+ {item.name}</span>
                    <span className="shrink-0 text-muted">{formatMoney(item.price)}</span>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="flex items-center gap-2 pt-1 text-sm text-muted">
            <Sparkles size={14} className="text-gold" />
            Sin complementos adicionales
          </div>
        )}
        {adjustment ? (
          <div
            className={`flex items-start justify-between gap-3 text-[15px] ${
              adjustment.kind === 'discount' ? 'text-sage' : 'text-ink'
            }`}
          >
            <span className="min-w-0 break-words">{adjustment.label}</span>
            <span className="shrink-0 font-medium">{formatSignedMoney(adjustment.amount)}</span>
          </div>
        ) : null}
      </div>
      <div className="space-y-1.5 border-t border-dashed border-sand px-4 py-3 text-[15px]">
        <div className="flex justify-between text-ink">
          <span>Total</span>
          <span className="font-semibold">{formatMoney(charged)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Anticipo pagado</span>
          <span>{formatMoney(paid)}</span>
        </div>
      </div>
      <div className="border-t border-nude bg-gold-soft/35 px-4 py-3 text-center">
        <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Saldo restante</p>
        <p className="font-display text-[36px] leading-none text-ink">{formatMoney(balance)}</p>
      </div>
    </section>
  )
}
