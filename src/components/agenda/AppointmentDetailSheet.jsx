import { deleteDoc, doc } from 'firebase/firestore'
import { Check, Phone, Pencil } from 'lucide-react'
import { isCancelled, isFinished } from '../../lib/appointmentStatus'
import { Sheet } from '../Sheet'
import { Button, StatusBadge } from '../ui'
import { WhatsAppIcon } from '../WhatsAppIcon'
import { StaffBadge, StaffDot } from '../staff/StaffBadge'
import { ChargeTicket } from './ChargeTicket'
import { useConfirm } from '../../hooks/useConfirm.jsx'
import { db } from '../../firebase'
import { requireAuthUid } from '../../lib/authGuard'
import { formatDayLabel, formatTime, toDate } from '../../lib/dates'
import { formatPhoneDisplay, telHref } from '../../lib/phone'
import { getAppointmentServices } from '../../lib/services'
import { resolveStaff } from '../../lib/staff'

export function AppointmentDetailSheet({
  appointment,
  staff = [],
  onClose,
  onEdit,
  onWhatsApp,
  onFinalize,
  nested = false,
}) {
  const [confirm, confirmDialog] = useConfirm()
  const start = toDate(appointment.startAt)
  const end = toDate(appointment.endAt)
  const member = resolveStaff(appointment, staff)
  const items = getAppointmentServices(appointment)
  const total = appointment.total ?? 0
  const deposit = appointment.deposit ?? 0
  const phone = appointment.clientPhone
  const callUrl = telHref(phone)
  const canContact = Boolean(phone) && !isCancelled(appointment.status)
  const canFinalize = Boolean(onFinalize) && !isFinished(appointment.status) && !isCancelled(appointment.status)
  const notes = String(appointment.notes || '').trim()

  async function remove() {
    const uid = requireAuthUid()
    if (!uid) return
    const accepted = await confirm({
      title: '¿Eliminar cita?',
      message: 'Esta acción no se puede deshacer. Se liberará el horario de la agenda.',
      confirmLabel: 'Eliminar',
      destructive: true,
    })
    if (!accepted) return
    await deleteDoc(doc(db, 'users', uid, 'appointments', appointment.id))
    onClose()
  }

  return (
    <>
      <Sheet
        nested={nested}
        title="Detalle de la cita"
        onClose={onClose}
        footer={
          isCancelled(appointment.status) ? null : (
            <div className="space-y-2">
              {canFinalize ? (
                <Button variant="ghost" className="w-full" onClick={() => onFinalize(appointment)}>
                  <Check size={16} />
                  Finalizar cita
                </Button>
              ) : null}
              <Button className="w-full" onClick={onEdit}>
                <Pencil size={16} />
                Editar cita
              </Button>
              <Button variant="danger" className="w-full" onClick={remove}>
                Eliminar cita
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-4">
          <header className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Fecha y horario</p>
                <p className="mt-0.5 font-display text-[26px] leading-none capitalize text-ink">
                  {start ? formatDayLabel(start) : 'Cita'}
                </p>
                <p className="mt-1.5 text-[17px] font-semibold text-ink">
                  {start ? formatTime(start) : '—'} – {end ? formatTime(end) : '—'}
                </p>
              </div>
              <StatusBadge status={appointment.status} />
            </div>

            <div className="flex items-center gap-3 rounded-[22px] bg-white px-3.5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Clienta</p>
                <p className="truncate text-[17px] font-semibold text-ink">{appointment.clientName}</p>
                {phone ? (
                  <p className="text-sm text-muted">{formatPhoneDisplay(phone)}</p>
                ) : null}
              </div>
              {canContact ? (
                <div className="flex shrink-0 gap-2">
                  {callUrl ? (
                    <a
                      href={callUrl}
                      className="grid h-11 w-11 place-items-center rounded-full bg-nude text-ink"
                      aria-label="Llamar"
                    >
                      <Phone size={18} />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onWhatsApp(appointment)}
                    className="grid h-11 w-11 place-items-center rounded-full bg-whatsapp text-white"
                    aria-label="WhatsApp"
                  >
                    <WhatsAppIcon size={18} />
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-3 rounded-[22px] bg-white px-3.5 py-3">
              <StaffDot color={member.color} name={member.name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Atendida por</p>
                <p className="truncate font-semibold text-ink">{member.name}</p>
              </div>
              <StaffBadge name={member.name} color={member.color} compact />
            </div>
          </header>

          <ChargeTicket items={items} total={total} deposit={deposit} />

          <section className="rounded-[22px] bg-nude/55 px-4 py-3.5">
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
              Notas / Preferencias de diseño
            </p>
            {notes ? (
              <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">{notes}</p>
            ) : (
              <p className="mt-2 text-[15px] leading-relaxed text-muted">Sin notas de diseño</p>
            )}
          </section>
        </div>
      </Sheet>
      {confirmDialog}
    </>
  )
}
