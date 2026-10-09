import { Sparkles } from 'lucide-react'
import { extraLabel, serviceKind, SERVICE_KIND, serviceSummary, sumServices } from '../../lib/services'
import { formatMoney, formatSignedMoney, pendingBalance, priceAdjustment, toNumber } from '../../lib/money'

export function ChargeTicket({ items = [], total, deposit }) {
  const summary = serviceSummary({ services: items })
  const principals = summary.principals?.length
    ? summary.principals
    : summary.items.filter((item) => serviceKind(item) !== SERVICE_KIND.addon)
  const addons = summary.addons || summary.items.filter((item) => serviceKind(item) === SERVICE_KIND.addon)
  const catalogSum = sumServices(items).price
  const charged = toNumber(total)
  const paid = toNumber(deposit)
  const balance = pendingBalance(charged, paid)
  const adjustment = priceAdjustment(catalogSum, charged)

  return (
    <section className="shrink-0 overflow-hidden rounded-[22px] border border-nude bg-white">
      <div className="border-b border-dashed border-sand px-4 py-3">
        <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Desglose</p>
        <p className="text-sm text-muted">
          {summary.label}
          {summary.extra > 0 ? ` · ${extraLabel(summary.extra, summary.extraKind)}` : ''}
        </p>
      </div>
      <div className="space-y-2 px-4 py-3">
        {principals.map((item) => (
          <div key={item.id || item.name} className="flex items-start justify-between gap-3 text-[15px]">
            <span className="min-w-0 break-words text-ink">{item.name}</span>
            <span className="shrink-0 font-medium text-ink">{formatMoney(item.price)}</span>
          </div>
        ))}
        {addons.length ? (
          addons.map((item) => (
            <div key={item.id || item.name} className="flex items-start justify-between gap-3 text-[15px]">
              <span className="min-w-0 break-words text-muted">+ {item.name}</span>
              <span className="shrink-0 text-muted">{formatMoney(item.price)}</span>
            </div>
          ))
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
