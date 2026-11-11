import { useMemo, useState } from 'react'
import { deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { Check, Pencil, Phone } from 'lucide-react'
import { APPOINTMENT_STATUS, isCancelled, isFinished } from '../../lib/appointmentStatus'
import { Sheet } from '../Sheet'
import { Button, StatusBadge } from '../ui'
import { ConfirmDialog } from '../ios/ConfirmDialog'
import { InstagramIcon } from '../InstagramIcon'
import { WhatsAppIcon } from '../WhatsAppIcon'
import { StaffBadge, StaffDot } from '../staff/StaffBadge'
import { ChargeTicket } from './ChargeTicket'
import { useConfirm } from '../../hooks/useConfirm.jsx'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useCollection } from '../../hooks/useCollection'
import { db } from '../../firebase'
import { requireAuthUid } from '../../lib/authGuard'
import { formatDayLabel, formatTime, toDate } from '../../lib/dates'
import { cleanInstagram } from '../../lib/instagram'
import { copyReminderAndOpenInstagram, resolveAppointmentClient } from '../../lib/clientContact'
import { formatPhoneDisplay, telHref } from '../../lib/phone'
import { getAppointmentServices } from '../../lib/services'
import { resolveStaff } from '../../lib/staff'

export function AppointmentDetailSheet({
  appointment,
  staff = [],
  clients = [],
  onClose,
  onEdit,
  onWhatsApp,
  onInstagram,
  onFinalize,
  onCopyTemplate,
  nested = false,
}) {
  const { profile } = useAuth()
  const { showToast } = useToast()
  const [confirm, confirmDialog] = useConfirm()
  const [appointmentToFinish, setAppointmentToFinish] = useState(null)
  const start = toDate(appointment.startAt)
  const end = toDate(appointment.endAt)
  const member = resolveStaff(appointment, staff)
  const items = getAppointmentServices(appointment)
  const total = appointment.total ?? 0
  const deposit = appointment.deposit ?? 0

  const { items: allClients } = useCollection('clients', 'name', 'asc')
  const clientList = clients && clients.length ? clients : allClients

  const {
    client,
    name: clientName,
    phone,
    hasPhone,
    instagramUser,
  } = useMemo(() => resolveAppointmentClient(appointment, clientList), [appointment, clientList])

  const callUrl = telHref(phone)
  const canFinalize = !isFinished(appointment.status) && !isCancelled(appointment.status)
  const notes = String(appointment.notes || '').trim()

  async function handleConfirmFinishInternal() {
    if (!appointmentToFinish?.id) return
    const uid = requireAuthUid()
    if (!uid) return

    const targetId = appointmentToFinish.id
    setAppointmentToFinish(null)

    try {
      await updateDoc(doc(db, 'users', uid, 'appointments', targetId), {
        status: APPOINTMENT_STATUS.finished,
      })
      showToast('¡Cita concluida y agregada al historial!')
    } catch (err) {
      console.error('Error al finalizar la cita:', err)
      showToast('No se pudo finalizar la cita', 'error')
    }
  }

  async function handleInstagramClick() {
    if (onInstagram) {
      onInstagram(appointment)
      return
    }
    await copyReminderAndOpenInstagram({
      appointment,
      clients: clientList,
      template: profile?.whatsappTemplate,
      businessName: profile?.businessName,
      showToast,
    })
  }

  async function remove() {
    const uid = requireAuthUid()
    if (!uid) return

    const clientName = appointment.clientName || 'la clienta'
    const time = formatTime(toDate(appointment.startAt)) || 'la hora agendada'

    const accepted = await confirm({
      title: '¿Eliminar cita de la agenda?',
      message: `Esta acción no se puede deshacer. Se cancelará y borrará la cita de ${clientName} de las ${time}.`,
      confirmLabel: 'Eliminar definitivamente',
      cancelLabel: 'Cancelar',
      destructive: true,
      confirmTone: 'destructive',
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
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    if (onFinalize) {
                      onFinalize(appointment)
                    } else {
                      setAppointmentToFinish(appointment)
                    }
                  }}
                >
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
                <p className="truncate text-[17px] font-semibold text-ink">{clientName}</p>
                {phone && instagramUser ? (
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    <span>{formatPhoneDisplay(phone)}</span>
                    <span className="text-muted/40">•</span>
                    <span className="inline-flex items-center gap-1">
                      <InstagramIcon size={11} className="text-muted/70" />
                      <span>@{instagramUser}</span>
                    </span>
                  </div>
                ) : phone ? (
                  <p className="text-sm text-muted">{formatPhoneDisplay(phone)}</p>
                ) : instagramUser ? (
                  <p className="flex items-center gap-1.5 text-sm text-muted">
                    <InstagramIcon size={14} className="shrink-0 text-muted/70" />
                    <span className="truncate">@{instagramUser}</span>
                  </p>
                ) : (
                  <p className="text-sm italic text-muted/60">Sin datos de contacto</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {hasPhone && callUrl ? (
                  <a
                    href={callUrl}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-nude text-ink shadow-sm transition-transform active:scale-95"
                    aria-label="Llamar"
                    title="Llamar"
                  >
                    <Phone size={17} />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => showToast('Sin número registrado')}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-300 opacity-60 cursor-not-allowed transition-transform active:scale-95"
                    aria-label="Sin número"
                    title="Sin número registrado"
                  >
                    <Phone size={17} />
                  </button>
                )}

                {hasPhone ? (
                  <button
                    type="button"
                    onClick={() => onWhatsApp(appointment)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp text-white shadow-sm transition-transform active:scale-95"
                    aria-label="WhatsApp"
                    title="WhatsApp"
                  >
                    <WhatsAppIcon size={17} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => showToast('Sin número registrado')}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-300 opacity-60 cursor-not-allowed transition-transform active:scale-95"
                    aria-label="Sin WhatsApp"
                    title="Sin número registrado"
                  >
                    <WhatsAppIcon size={17} />
                  </button>
                )}

                {instagramUser ? (
                  <button
                    type="button"
                    onClick={handleInstagramClick}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-sm transition-transform active:scale-95"
                    aria-label="Instagram"
                    title={`Instagram: @${instagramUser}`}
                  >
                    <InstagramIcon size={18} className="text-white" strokeWidth={2.2} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => showToast('Sin Instagram registrado')}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-300 opacity-40 cursor-not-allowed transition-transform active:scale-95"
                    aria-label="Sin Instagram"
                    title="Sin Instagram registrado"
                  >
                    <InstagramIcon size={18} className="text-stone-300" />
                  </button>
                )}
              </div>
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
      <ConfirmDialog
        open={Boolean(appointmentToFinish)}
        title="¿Confirmar que la cita concluyó?"
        message={
          appointmentToFinish
            ? `¿Deseas marcar la cita de ${appointmentToFinish.clientName || 'la clienta'} como finalizada? Se sumará a sus visitas completadas.`
            : ''
        }
        confirmLabel="Sí, finalizar"
        cancelLabel="Cancelar"
        confirmTone="sage"
        onConfirm={handleConfirmFinishInternal}
        onCancel={() => setAppointmentToFinish(null)}
      />
      {confirmDialog}
    </>
  )
}
