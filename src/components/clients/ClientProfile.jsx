import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Pencil, Phone, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { DEFAULT_HISTORY_FILTERS, HistoryFilterSheet, historyFiltersActive } from './HistoryFilterSheet'
import { StatusBadge } from '../ui'
import { InstagramIcon } from '../InstagramIcon'
import { WhatsAppIcon } from '../WhatsAppIcon'
import { StaffBadge } from '../staff/StaffBadge'
import { isFinished } from '../../lib/appointmentStatus'
import { appointmentMonthKey, formatMonthTitle, formatShortDate, formatTime, toDate } from '../../lib/dates'
import { cleanInstagram, openInstagramProfile } from '../../lib/instagram'
import { formatMoney, toNumber } from '../../lib/money'
import { formatPhoneDisplay, isValidLocalPhone, telHref } from '../../lib/phone'
import { extraLabel, serviceSummary } from '../../lib/services'
import { appointmentStaffId } from '../../lib/conflicts'
import { resolveStaff } from '../../lib/staff'
import { visitStats } from '../../lib/visits'

export function ClientProfile({
  client,
  appointments = [],
  staff = [],
  onClose,
  onEdit,
  onWhatsApp,
  onOpenAppointment,
  onDelete,
}) {
  const stats = visitStats(appointments, client)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filters, setFilters] = useState(DEFAULT_HISTORY_FILTERS)
  const phone = formatPhoneDisplay(client.phone)
  const instagramUser = cleanInstagram(client.instagram)
  const callUrl = telHref(client.phone)
  const canWhatsApp = isValidLocalPhone(client.phone)
  const hasPhone = Boolean(client.phone)
  const hasInstagram = Boolean(instagramUser)
  const initial = (client.name || '?').slice(0, 1).toUpperCase()
  const hasActiveFilters = historyFiltersActive(filters)

  const monthOptions = useMemo(() => {
    const seen = new Map()
    for (const appointment of stats.all) {
      const date = toDate(appointment.startAt)
      const id = appointmentMonthKey(appointment.startAt)
      if (!date || !id || seen.has(id)) continue
      seen.set(id, {
        id,
        label: formatMonthTitle(date).replace(/^./, (char) => char.toUpperCase()),
        time: date.getTime(),
      })
    }
    return [...seen.values()].sort((a, b) => b.time - a.time)
  }, [stats.all])

  const staffOptions = useMemo(() => {
    const seen = new Map()
    for (const appointment of stats.all) {
      const member = resolveStaff(appointment, staff)
      if (!seen.has(member.id)) seen.set(member.id, member)
    }
    return [...seen.values()]
  }, [staff, stats.all])

  const visibleHistory = useMemo(() => {
    const items = stats.all.filter((appointment) => {
      if (filters.month !== 'all' && appointmentMonthKey(appointment.startAt) !== filters.month) return false
      if (filters.staffId !== 'all' && appointmentStaffId(appointment) !== filters.staffId) return false
      return true
    })
    return items.sort((a, b) => {
      if (filters.sort === 'price-desc') return toNumber(b.total) - toNumber(a.total)
      if (filters.sort === 'price-asc') return toNumber(a.total) - toNumber(b.total)
      return (toDate(b.startAt)?.getTime() || 0) - (toDate(a.startAt)?.getTime() || 0)
    })
  }, [filters, stats.all])

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-center bg-ink/25">
      <section className="flex h-full w-full max-w-md flex-col bg-pearl">
        <header className="flex shrink-0 items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))]">
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(client)}
              className="grid h-11 w-11 place-items-center rounded-full bg-nude text-rose-deep active:scale-95 transition-transform"
              aria-label="Eliminar clienta"
              title="Eliminar clienta"
            >
              <Trash2 size={18} />
            </button>
          ) : (
            <div className="h-11 w-11" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full bg-nude text-ink active:scale-95 transition-transform"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-28">
          <div className="flex flex-col items-center pb-5 text-center">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-gold-soft font-display text-[40px] leading-none text-ink">
              {initial}
            </div>
            <h2 className="mt-3 font-display text-[32px] leading-none text-ink">{client.name}</h2>
            {phone ? <p className="mt-2 text-[15px] text-muted">{phone}</p> : null}
            {instagramUser ? (
              <p className="mt-1.5 flex items-center justify-center gap-1.5 text-[15px] text-muted">
                <InstagramIcon size={15} className="text-muted/70" />
                <span>@{instagramUser}</span>
              </p>
            ) : null}
            {!phone && !instagramUser ? (
              <p className="mt-2 text-sm italic text-muted/60">Sin datos de contacto</p>
            ) : null}
          </div>

          <div
            className={`mb-5 grid gap-2 ${
              hasPhone && hasInstagram
                ? 'grid-cols-4'
                : hasPhone
                  ? 'grid-cols-3'
                  : hasInstagram
                    ? 'grid-cols-2'
                    : 'grid-cols-1'
            }`}
          >
            {hasPhone ? (
              <>
                <QuickAction
                  icon={Phone}
                  label="Llamar"
                  href={callUrl || undefined}
                  disabled={!callUrl}
                />
                <QuickAction
                  icon={WhatsAppIcon}
                  label="WhatsApp"
                  disabled={!canWhatsApp}
                  onClick={() => onWhatsApp?.(client)}
                />
              </>
            ) : null}
            {hasInstagram ? (
              <QuickAction
                icon={InstagramIcon}
                label="Instagram"
                onClick={() => openInstagramProfile(instagramUser)}
              />
            ) : null}
            <QuickAction icon={Pencil} label="Editar" onClick={onEdit} />
          </div>

          <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-[22px] border border-nude bg-white">
            <Metric value={String(stats.visits)} label="Visitas finalizadas" />
            <Metric value={formatMoney(stats.spent)} label="Total invertido" last />
          </div>

          <section>
            <div className="mb-2 flex items-center gap-2 px-1">
              <h3 className="min-w-0 flex-1 text-[13px] font-semibold tracking-wide text-muted uppercase">
                Historial de citas
              </h3>
              {stats.all.length ? (
                <button
                  type="button"
                  onClick={() => setFilterOpen(true)}
                  className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-nude hover:text-ink"
                  aria-label="Filtros del historial"
                >
                  <SlidersHorizontal size={16} />
                  {hasActiveFilters ? (
                    <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-rose ring-2 ring-pearl" />
                  ) : null}
                </button>
              ) : null}
            </div>
            {stats.all.length === 0 ? (
              <p className="rounded-[22px] border border-dashed border-sand/80 bg-white/60 px-4 py-8 text-center text-sm text-muted/70">
                Aún no registra visitas finalizadas
              </p>
            ) : visibleHistory.length === 0 ? (
              <p className="rounded-[22px] border border-dashed border-sand/80 bg-white/60 px-4 py-8 text-center text-sm text-muted/70">
                No hay citas con este filtro
              </p>
            ) : (
              <ul className="overflow-hidden rounded-[22px] border border-nude bg-white">
                {visibleHistory.map((appointment) => (
                  <HistoryRow
                    key={appointment.id}
                    appointment={appointment}
                    staff={staff}
                    onOpen={() => onOpenAppointment?.(appointment)}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>

      {filterOpen ? (
        <HistoryFilterSheet
          months={monthOptions}
          staff={staffOptions}
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_HISTORY_FILTERS)}
          onClose={() => setFilterOpen(false)}
        />
      ) : null}
    </div>,
    document.body,
  )
}

function QuickAction({ icon: Icon, label, href, onClick, disabled, external = false }) {
  const className = `flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-[20px] bg-white ${
    disabled ? 'pointer-events-none opacity-40' : 'active:bg-nude/50'
  }`
  const content = (
    <>
      <span className="grid h-10 w-10 place-items-center rounded-full bg-nude text-ink">
        <Icon size={18} />
      </span>
      <span className="text-[12px] font-semibold text-ink">{label}</span>
    </>
  )
  if (href) {
    return (
      <a
        href={href}
        className={className}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {content}
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {content}
    </button>
  )
}

function Metric({ value, label, last = false }) {
  return (
    <div className={`px-4 py-3.5 ${last ? '' : 'border-r border-nude'}`}>
      <p className="truncate text-[22px] font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-[12px] text-muted">{label}</p>
    </div>
  )
}

function HistoryRow({ appointment, staff, onOpen }) {
  const start = toDate(appointment.startAt)
  const services = serviceSummary(appointment)
  const member = resolveStaff(appointment, staff)
  const finished = isFinished(appointment.status)

  return (
    <li className="border-b border-nude/70 last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start justify-between gap-3 px-3.5 py-3 text-left active:bg-nude/40"
      >
        <div className="min-w-0">
          <p className="text-[15px] font-semibold capitalize text-ink">
            {start ? formatShortDate(start) : 'Cita'}
          </p>
          <p className="mt-0.5 truncate text-sm text-ink">
            {services.label}
            {services.extra > 0 ? ` · ${extraLabel(services.extra, services.extraKind)}` : ''}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <StaffBadge name={member.name} color={member.color} compact />
            {start ? <span className="text-[12px] text-muted">{formatTime(start)}</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="text-[15px] font-semibold text-ink">{formatMoney(appointment.total)}</p>
          <StatusBadge status={finished ? 'finalizada' : appointment.status} compact />
        </div>
      </button>
    </li>
  )
}
