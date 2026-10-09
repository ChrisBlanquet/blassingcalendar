import { useMemo, useState } from 'react'
import { addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { ChevronRight, Phone, Plus, Users } from 'lucide-react'
import { AppointmentDetailSheet } from '../components/agenda/AppointmentDetailSheet'
import { AppointmentSheet } from '../components/agenda/AppointmentSheet'
import { ClientProfile } from '../components/clients/ClientProfile'
import { PhoneField } from '../components/PhoneField'
import { Button, EmptyState, Fab, Field, TextInput } from '../components/ui'
import { Sheet } from '../components/Sheet'
import { useAuth } from '../context/AuthContext'
import { useCollection, userCol } from '../hooks/useCollection'
import { useStaff } from '../hooks/useStaff'
import { db } from '../firebase'
import { useConfirm } from '../hooks/useConfirm.jsx'
import { APPOINTMENT_STATUS } from '../lib/appointmentStatus'
import { requireAuthUid, SESSION_EXPIRED_MESSAGE } from '../lib/authGuard'
import { formatPhoneDisplay, isValidLocalPhone, toLocalDigits, toStoredPhone } from '../lib/phone'
import { visitLabel, visitStats } from '../lib/visits'
import {
  appointmentMessageVars,
  buildWhatsAppUrl,
  fillTemplate,
  greetingMessage,
  openWhatsAppLink,
} from '../lib/whatsapp'

const emptyClient = { name: '', local: '' }

export function Clients() {
  const { profile: business } = useAuth()
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

  const liveProfile = profile ? items.find((item) => item.id === profile.id) || profile : null
  const detailAppointment = detailId ? appointments.find((apt) => apt.id === detailId) : null
  const editingAppointment =
    editor && editor !== 'new' ? appointments.find((apt) => apt.id === (editor.id || editor)) || editor : null

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (client) =>
        client.name.toLowerCase().includes(q) || String(client.phone || '').includes(q),
    )
  }, [items, queryText])

  function openNew() {
    setEditing(null)
    setForm(emptyClient)
    setOpen(true)
  }

  function openEdit(client) {
    setEditing(client)
    setForm({ name: client.name, local: toLocalDigits(client.phone) })
    setOpen(true)
  }

  async function save() {
    if (!form.name.trim() || !isValidLocalPhone(form.local)) return
    const uid = requireAuthUid()
    if (!uid) {
      setError(SESSION_EXPIRED_MESSAGE)
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      phone: toStoredPhone(form.local),
    }
    try {
      if (editing) {
        await updateDoc(doc(db, 'users', uid, 'clients', editing.id), payload)
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
    const uid = requireAuthUid()
    if (!uid) {
      setError(SESSION_EXPIRED_MESSAGE)
      return
    }
    const accepted = await confirm({
      title: '¿Eliminar clienta?',
      message: `Se eliminará a ${client.name} del directorio. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    })
    if (!accepted) return
    await deleteDoc(doc(db, 'users', uid, 'clients', client.id))
    setOpen(false)
    if (profile?.id === client.id) setProfile(null)
  }

  function openClientWhatsApp(client) {
    openWhatsAppLink(buildWhatsAppUrl(client.phone, greetingMessage(client.name)))
  }

  function openAppointmentWhatsApp(appointment) {
    const message = fillTemplate(
      business?.whatsappTemplate,
      appointmentMessageVars(appointment, business?.businessName),
    )
    openWhatsAppLink(buildWhatsAppUrl(appointment.clientPhone, message))
  }

  async function finalizeAppointment(appointment) {
    if (!appointment?.id) return
    const uid = requireAuthUid()
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'appointments', appointment.id), {
      status: APPOINTMENT_STATUS.finished,
    })
  }

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
                    <p className="flex items-center gap-1.5 text-sm text-muted">
                      <Phone size={14} />
                      {formatPhoneDisplay(client.phone)}
                    </p>
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
        />
      ) : null}

      {detailAppointment ? (
        <AppointmentDetailSheet
          nested
          appointment={detailAppointment}
          staff={staff}
          onClose={() => setDetailId(null)}
          onEdit={() => setEditor(detailAppointment)}
          onWhatsApp={openAppointmentWhatsApp}
          onFinalize={finalizeAppointment}
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
                disabled={saving || !form.name.trim() || !isValidLocalPhone(form.local)}
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
          <div className="space-y-3">
            {error ? (
              <p className="rounded-2xl bg-blush/80 px-3 py-2 text-sm text-rose-deep">{error}</p>
            ) : null}
            <Field label="Nombre">
              <TextInput
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="María López"
              />
            </Field>
            <PhoneField
              value={form.local}
              onChange={(local) => setForm((f) => ({ ...f, local }))}
            />
          </div>
        </Sheet>
      ) : null}
      {confirmDialog}
    </div>
  )
}
