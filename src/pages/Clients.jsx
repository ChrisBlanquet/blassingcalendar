import { useMemo, useState } from 'react'
import { addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { ChevronRight, Phone, Plus, Users } from 'lucide-react'
import { AppointmentDetailSheet } from '../components/agenda/AppointmentDetailSheet'
import { AppointmentSheet } from '../components/agenda/AppointmentSheet'
import { ClientProfile } from '../components/clients/ClientProfile'
import { InstagramField } from '../components/InstagramField'
import { InstagramIcon } from '../components/InstagramIcon'
import { PhoneField } from '../components/PhoneField'
import { Button, EmptyState, Fab, Field, TextInput } from '../components/ui'
import { ConfirmDialog } from '../components/ios/ConfirmDialog'
import { Sheet } from '../components/Sheet'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useCollection, userCol } from '../hooks/useCollection'
import { useStaff } from '../hooks/useStaff'
import { db } from '../firebase'
import { useConfirm } from '../hooks/useConfirm.jsx'
import { APPOINTMENT_STATUS } from '../lib/appointmentStatus'
import { requireAuthUid, SESSION_EXPIRED_MESSAGE } from '../lib/authGuard'
import { cascadeUpdateClientAppointments, copyReminderAndOpenInstagram, resolveAppointmentClient } from '../lib/clientContact'
import { cleanInstagram } from '../lib/instagram'
import { formatTime, toDate } from '../lib/dates'
import { formatPhoneDisplay, isValidLocalPhone, toLocalDigits, toStoredPhone } from '../lib/phone'
import { serviceSummary } from '../lib/services'
import { visitLabel, visitStats } from '../lib/visits'
import {
  appointmentMessageVars,
  buildWhatsAppUrl,
  fillTemplate,
  greetingMessage,
  openWhatsAppLink,
} from '../lib/whatsapp'

const emptyClient = { name: '', local: '', instagram: '' }

export function Clients() {
  const { profile: business } = useAuth()
  const { showToast } = useToast()
  const { items, loading } = useCollection('clients', 'name', 'asc')
  const { items: appointments } = useCollection('appointments', 'startAt', 'desc')
  const { items: services } = useCollection('services', 'name', 'asc')
  const { staff } = useStaff()
  const [queryText, setQueryText] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [profile, setProfile] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [editor, setEditor] = useState(null)
  const [form, setForm] = useState(emptyClient)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirm, confirmDialog] = useConfirm()
  const [appointmentToFinish, setAppointmentToFinish] = useState(null)

  const liveProfile = profile ? items.find((item) => item.id === profile.id) || profile : null
  const detailAppointment = detailId ? appointments.find((apt) => apt.id === detailId) : null
  const editingAppointment =
    editor && editor !== 'new' ? appointments.find((apt) => apt.id === (editor.id || editor)) || editor : null

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase()
    if (!q) return items
    const cleanQ = q.replace(/^@/, '')
    return items.filter(
      (client) =>
        client.name.toLowerCase().includes(q) ||
        String(client.phone || '').includes(q) ||
        String(client.instagram || '').toLowerCase().includes(cleanQ),
    )
  }, [items, queryText])

  function openNew() {
    setEditing(null)
    setForm(emptyClient)
    setOpen(true)
  }

  function openEdit(client) {
    setEditing(client)
    setForm({
      name: client.name || '',
      local: toLocalDigits(client.phone),
      instagram: cleanInstagram(client.instagram),
    })
    setOpen(true)
  }

  async function save() {
    const isValidPhone = !form.local || isValidLocalPhone(form.local)
    if (!form.name.trim() || !isValidPhone) return
    const uid = requireAuthUid()
    if (!uid) {
      setError(SESSION_EXPIRED_MESSAGE)
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      phone: form.local ? toStoredPhone(form.local) : '',
      instagram: cleanInstagram(form.instagram),
    }
    try {
      if (editing) {
        await updateDoc(doc(db, 'users', uid, 'clients', editing.id), payload)
        // Cascada en segundo plano para citas asociadas
        cascadeUpdateClientAppointments(uid, editing.id, payload)
      } else {
        await addDoc(userCol(uid, 'clients'), { ...payload, createdAt: serverTimestamp() })
      }
      setOpen(false)
    } catch (err) {
      setError(err.message || 'No se pudo guardar la clienta.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(client) {
    if (!client?.id) return
    const uid = requireAuthUid()
    if (!uid) {
      setError(SESSION_EXPIRED_MESSAGE)
      return
    }
    const accepted = await confirm({
      title: '¿Eliminar clienta?',
      message: `¿Estás segura de que deseas eliminar a ${client.name}? Esta acción no se puede deshacer y se perderán sus datos de contacto e historial asociado.`,
      confirmLabel: 'Eliminar definitivamente',
      cancelLabel: 'Cancelar',
      destructive: true,
      confirmTone: 'destructive',
    })
    if (!accepted) return

    try {
      await deleteDoc(doc(db, 'users', uid, 'clients', client.id))
      setOpen(false)
      if (profile?.id === client.id) setProfile(null)
      showToast('Clienta eliminada')
    } catch (err) {
      console.error('Error al eliminar clienta:', err)
      showToast('No se pudo eliminar la clienta', 'error')
    }
  }

  function openClientWhatsApp(client) {
    openWhatsAppLink(buildWhatsAppUrl(client.phone, greetingMessage(client.name)))
  }

  function openAppointmentWhatsApp(appointment) {
    const { name: clientName, phone: clientPhone } = resolveAppointmentClient(appointment, items)
    if (!clientPhone) {
      showToast('Sin número registrado', 'error')
      return
    }
    const message = fillTemplate(
      business?.whatsappTemplate,
      appointmentMessageVars({ ...appointment, clientName, clientPhone }, business?.businessName),
    )
    openWhatsAppLink(buildWhatsAppUrl(clientPhone, message))
  }

  async function openAppointmentInstagram(appointment) {
    await copyReminderAndOpenInstagram({
      appointment,
      clients: items,
      template: business?.whatsappTemplate,
      businessName: business?.businessName,
      showToast,
    })
  }

  async function handleConfirmFinish() {
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

  async function copyAppointmentTemplate(appointment) {
    const { name: clientName, phone: clientPhone } = resolveAppointmentClient(appointment, items)
    const message = fillTemplate(
      business?.whatsappTemplate,
      appointmentMessageVars({ ...appointment, clientName, clientPhone }, business?.businessName),
    )
    let copied = false
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(message)
        copied = true
      }
    } catch {
      copied = false
    }
    if (!copied) {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = message
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        textarea.remove()
      } catch {
        // ignore
      }
    }
    showToast('Mensaje copiado al portapapeles')
  }

  const isValidPhone = !form.local || isValidLocalPhone(form.local)
  const canSave = Boolean(form.name.trim()) && isValidPhone && !saving

  return (
    <div className="px-5 pt-4 pb-24">
      {error && !open ? (
        <p className="mb-3 rounded-2xl bg-blush/80 px-3 py-2 text-sm text-rose-deep">{error}</p>
      ) : null}
      <TextInput
        value={queryText}
        onChange={(e) => setQueryText(e.target.value)}
        placeholder="Buscar clienta o teléfono"
        className="mb-4"
      />

      {loading ? <p className="py-10 text-center text-muted">Cargando…</p> : null}
      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Directorio vacío"
          text="Guarda nombre y WhatsApp de tus clientas para agendarlas en un toque."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((client) => {
            const stats = visitStats(appointments, client)
            return (
              <li key={client.id}>
                <button
                  type="button"
                  onClick={() => setProfile(client)}
                  className="fade-in flex w-full items-center gap-3 rounded-[22px] border border-nude bg-white/80 p-4 text-left shadow-[0_8px_24px_rgba(61,43,36,0.04)] active:bg-nude/30"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold-soft/70 font-display text-xl text-ink">
                    {client.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-ink">{client.name}</h3>
                    {client.phone && client.instagram ? (
                      <p className="flex items-center gap-2 text-sm text-muted">
                        <span className="flex items-center gap-1.5 truncate">
                          <Phone size={14} className="shrink-0" />
                          <span>{formatPhoneDisplay(client.phone)}</span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-nude/70 px-2 py-0.5 text-xs font-medium text-muted">
                          <InstagramIcon size={12} className="shrink-0 text-muted/70" />
                          <span className="max-w-[130px] truncate">@{cleanInstagram(client.instagram)}</span>
                        </span>
                      </p>
                    ) : client.phone ? (
                      <p className="flex items-center gap-1.5 text-sm text-muted">
                        <Phone size={14} className="shrink-0" />
                        <span>{formatPhoneDisplay(client.phone)}</span>
                      </p>
                    ) : client.instagram ? (
                      <p className="flex items-center gap-1.5 text-sm text-muted">
                        <InstagramIcon size={14} className="shrink-0 text-muted/70" />
                        <span className="truncate">@{cleanInstagram(client.instagram)}</span>
                      </p>
                    ) : (
                      <p className="text-sm italic text-muted/60">Sin datos de contacto</p>
                    )}
                    <p className="mt-1 text-[12px] font-medium text-muted/80">{visitLabel(stats.visits)}</p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-muted/50" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Fab onClick={openNew}>
        <Plus />
      </Fab>

      {liveProfile ? (
        <ClientProfile
          client={liveProfile}
          appointments={appointments}
          staff={staff}
          onClose={() => setProfile(null)}
          onEdit={() => openEdit(liveProfile)}
          onWhatsApp={openClientWhatsApp}
          onOpenAppointment={(appointment) => setDetailId(appointment.id)}
          onDelete={remove}
        />
      ) : null}

      {detailAppointment ? (
        <AppointmentDetailSheet
          nested
          appointment={detailAppointment}
          staff={staff}
          clients={items}
          onClose={() => setDetailId(null)}
          onEdit={() => setEditor(detailAppointment)}
          onWhatsApp={openAppointmentWhatsApp}
          onInstagram={openAppointmentInstagram}
          onFinalize={(apt) => setAppointmentToFinish(apt)}
          onCopyTemplate={copyAppointmentTemplate}
        />
      ) : null}

      {editor ? (
        <AppointmentSheet
          nested="deep"
          appointment={editor === 'new' ? null : editingAppointment}
          clients={items}
          services={services}
          appointments={appointments}
          onClose={() => setEditor(null)}
        />
      ) : null}

      {open ? (
        <Sheet
          nested={Boolean(liveProfile)}
          title={editing ? 'Editar clienta' : 'Nueva clienta'}
          onClose={() => setOpen(false)}
          footer={
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={save}
                disabled={!canSave}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
              {editing ? (
                <Button variant="danger" className="w-full" onClick={() => remove(editing)}>
                  Eliminar clienta
                </Button>
              ) : null}
            </div>
          }
        >
          <div className="space-y-3.5">
            {error ? (
              <p className="rounded-2xl bg-blush/80 px-3 py-2 text-sm text-rose-deep">{error}</p>
            ) : null}
            <div className="space-y-1.5">
              <label className="block px-1 text-[11px] font-semibold tracking-wide text-muted uppercase">
                NOMBRE
              </label>
              <TextInput
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="María López"
              />
            </div>
            <PhoneField
              value={form.local}
              onChange={(local) => setForm((f) => ({ ...f, local }))}
              label="TELÉFONO (OPCIONAL)"
            />
            <InstagramField
              value={form.instagram}
              onChange={(instagram) => setForm((f) => ({ ...f, instagram }))}
              label="INSTAGRAM (OPCIONAL)"
            />
          </div>
        </Sheet>
      ) : null}
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
        onConfirm={handleConfirmFinish}
        onCancel={() => setAppointmentToFinish(null)}
      />
      {confirmDialog}
    </div>
  )
}
