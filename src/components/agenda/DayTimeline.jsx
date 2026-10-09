import { CalendarDays, Check } from 'lucide-react'
import { EmptyState, StatusBadge } from '../ui'
import { WhatsAppIcon } from '../WhatsAppIcon'
import { StaffBadge } from '../staff/StaffBadge'
import { isCancelled, isFinished } from '../../lib/appointmentStatus'
import { formatTime, toDate } from '../../lib/dates'
import { extraLabel, serviceSummary } from '../../lib/services'
import { resolveStaff } from '../../lib/staff'

export function DayTimeline({ appointments, staff = [], onOpen, onWhatsApp, onFinalize }) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Día libre"
        text="No hay citas este día. Toca + para agendar a una clienta."
      />
    )
  }

  const ordered = [...appointments].sort((a, b) => {
    const aDone = isFinished(a.status) ? 1 : 0
    const bDone = isFinished(b.status) ? 1 : 0
    if (aDone !== bDone) return aDone - bDone
    return (toDate(a.startAt)?.getTime() || 0) - (toDate(b.startAt)?.getTime() || 0)
  })

  return (
    <div className="space-y-3 px-5 pb-6">
      {ordered.map((apt) => (
        <AppointmentCard
          key={apt.id}
          apt={apt}
          staff={staff}
          onOpen={() => onOpen(apt)}
          onWhatsApp={() => onWhatsApp(apt)}
          onFinalize={() => onFinalize?.(apt)}
        />
      ))}
    </div>
  )
}

function AppointmentCard({ apt, staff, onOpen, onWhatsApp, onFinalize }) {
  const start = toDate(apt.startAt)
  const services = serviceSummary(apt)
  const member = resolveStaff(apt, staff)
  const duration = Number(apt.duration) || 60
  const finished = isFinished(apt.status)
  const cancelled = isCancelled(apt.status)
  const showWhatsApp = Boolean(apt.clientPhone) && !cancelled
  const showFinalize = Boolean(onFinalize) && !finished && !cancelled

  return (
    <article
      className={`fade-in overflow-hidden rounded-[24px] border shadow-[0_10px_24px_rgba(61,43,36,0.05)] ${cardTone(apt.status)}`}
    >
      <button type="button" className="w-full p-4 text-left" onClick={onOpen}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <p className="font-display text-[32px] leading-none text-ink">{formatTime(start)}</p>
              <span className="text-sm text-muted">{duration} min</span>
            </div>
            <h3 className="mt-1 truncate text-[17px] font-medium text-ink">{apt.clientName}</h3>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StaffBadge name={member.name} color={member.color} compact />
            <StatusBadge status={finished ? 'finalizada' : apt.status} compact />
          </div>
        </div>
        <p className="mt-2 truncate text-sm text-muted">
          {services.label}
          {services.extra > 0 ? ` · ${extraLabel(services.extra, services.extraKind)}` : ''}
        </p>
      </button>
      {showWhatsApp || showFinalize ? (
        <div className={`grid gap-2 px-4 pb-4 ${showWhatsApp && showFinalize ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {showWhatsApp ? (
            <button
              type="button"
              onClick={onWhatsApp}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-whatsapp text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,211,102,0.28)] active:scale-[0.98]"
            >
              <WhatsAppIcon size={16} />
              WhatsApp
            </button>
          ) : null}
          {showFinalize ? (
            <button
              type="button"
              onClick={onFinalize}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-sand bg-white text-sm font-semibold text-sage active:scale-[0.98]"
            >
              <Check size={16} strokeWidth={2.4} />
              Finalizar
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

function cardTone(status) {
  if (isFinished(status)) return 'border-[#c9ddd0] bg-[#f3f8f4] opacity-75'
  if (isCancelled(status)) return 'border-sand bg-[#f4efe9] opacity-70'
  return 'border-blush bg-white'
}
