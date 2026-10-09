import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { Check, ChevronLeft, Clock, Scissors, Sparkles, UserPlus, X } from 'lucide-react'
import { Button, Field, TextArea, TextInput } from '../ui'
import { WhatsAppIcon } from '../WhatsAppIcon'
import { StaffDot } from '../staff/StaffBadge'
import { appointmentMessageVars, buildWhatsAppUrl, fillTemplate, openWhatsAppLink } from '../../lib/whatsapp'
import { useConfirm } from '../../hooks/useConfirm.jsx'
import { useAuth } from '../../context/AuthContext'
import { useStaff } from '../../hooks/useStaff'
import { userCol } from '../../hooks/useCollection'
import { db } from '../../firebase'
import { requireAuthUid, SESSION_EXPIRED_MESSAGE } from '../../lib/authGuard'
import { conflictMessage, findOverlappingAppointment } from '../../lib/conflicts'
import {
  combineDateAndTime,
  computeEnd,
  dateInputValue,
  formatDayLabel,
  formatTime,
  timeInputValue,
  toDate,
} from '../../lib/dates'
import { APPOINTMENT_STATUS, editorStatus } from '../../lib/appointmentStatus'
import { formatMoney, pendingBalance, toNumber } from '../../lib/money'
import {
  extraLabel,
  getAppointmentServices,
  serviceCategory,
  serviceKind,
  SERVICE_KIND,
  serviceSummary,
  splitCatalog,
  sumServices,
} from '../../lib/services'
import { OWNER_STAFF_ID, resolveStaff, STAFF_COLORS } from '../../lib/staff'
import { useCategories } from '../../hooks/useCategories'
import { ChargeTicket } from './ChargeTicket'
import { ClientPicker } from './ClientPicker'
import { QuickClientSheet } from './QuickClientSheet'
import { CompactCalendar } from './CompactCalendar'
import { ClientAvatar, GroupedPicker, PickerRow } from './PickerRow'
import { ServicePicker } from './ServicePicker'
import { StaffPicker } from './StaffPicker'
import { TimeWheelSheet } from './TimeWheelSheet'

const emptyForm = {
  clientId: '',
  staffId: OWNER_STAFF_ID,
  principalIds: [],
  addonIds: [],
  date: dateInputValue(new Date()),
  time: '10:00',
  duration: 60,
  total: '',
  deposit: '',
  notes: '',
  status: 'pending',
}

const stepTitles = ['Clienta y servicio', 'Fecha y horario', 'Detalles y pago']

function splitSelectedIds(items, fallbackId) {
  const valid = items.filter((item) => item.id && item.id !== 'legacy')
  const principals = valid.filter((item) => serviceKind(item) === SERVICE_KIND.principal)
  const addons = valid.filter((item) => serviceKind(item) === SERVICE_KIND.addon)
  if (!principals.length && fallbackId) return { principalIds: [fallbackId], addonIds: addons.map((item) => item.id) }
  return {
    principalIds: principals.map((item) => item.id),
    addonIds: addons.map((item) => item.id),
  }
}

function formFromAppointment(appointment, initialDate) {
  if (!appointment) {
    return {
      ...emptyForm,
      date: dateInputValue(initialDate || new Date()),
    }
  }
  const start = toDate(appointment.startAt) || new Date()
  const existing = getAppointmentServices(appointment)
  return {
    clientId: appointment.clientId || '',
    staffId: appointment.staffId || OWNER_STAFF_ID,
    ...splitSelectedIds(existing, appointment.serviceId),
    date: dateInputValue(start),
    time: timeInputValue(start),
    duration: toNumber(appointment.duration) || 60,
    total: appointment.total ?? '',
    deposit: appointment.deposit ?? '',
    notes: appointment.notes || '',
    status: editorStatus(appointment.status),
  }
}

export function AppointmentSheet({ appointment, clients, services, appointments = [], initialDate, onClose, nested = false }) {
  const { profile } = useAuth()
  const { staff } = useStaff()
  const { categories } = useCategories()
  const [form, setForm] = useState(() => formFromAppointment(appointment, initialDate))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [picker, setPicker] = useState(null)
  const [creatingClient, setCreatingClient] = useState(false)
  const [extraServices, setExtraServices] = useState([])
  const [extraClients, setExtraClients] = useState([])
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState('next')
  const [confirm, confirmDialog] = useConfirm()

  useEffect(() => {
    setStep(0)
    setPicker(null)
    setCreatingClient(false)
    setExtraServices([])
    setExtraClients([])
    setForm(formFromAppointment(appointment, initialDate))
  }, [appointment, initialDate])

  const clientCatalog = useMemo(() => {
    const byId = new Map()
    for (const item of [...clients, ...extraClients]) byId.set(item.id, item)
    return [...byId.values()]
  }, [clients, extraClients])
  const selectedClient = clientCatalog.find((c) => c.id === form.clientId)
  const catalog = useMemo(() => {
    const byId = new Map()
    for (const item of [...services, ...extraServices]) byId.set(item.id, item)
    return [...byId.values()]
  }, [services, extraServices])
  const { principals, addons } = splitCatalog(catalog)
  const selectedServices = [
    ...catalog.filter((service) => (form.principalIds || []).includes(service.id)),
    ...catalog.filter((service) => (form.addonIds || []).includes(service.id)),
  ]
  const staffList = staff.length
    ? staff
    : [{ id: OWNER_STAFF_ID, name: 'Dueña', color: STAFF_COLORS[0], role: 'owner' }]
  const assignedStaff = resolveStaff({ staffId: form.staffId }, staffList)
  const selectedPrincipals = catalog.filter((service) => (form.principalIds || []).includes(service.id))
  const selectedAddons = catalog.filter((service) => (form.addonIds || []).includes(service.id))
  const principalLabel = selectedPrincipals.map((service) => service.name).join(', ')
  const addonLabel = !selectedAddons.length
    ? ''
    : selectedAddons.length === 1
      ? `+ ${selectedAddons[0].name} (1)`
      : `+ ${selectedAddons.map((service) => service.name).join(', ')} (${selectedAddons.length})`
  const startAt = useMemo(() => combineDateAndTime(form.date, form.time), [form.date, form.time])
  const catalogTotals = sumServices(selectedServices)
  const duration = Math.max(1, toNumber(form.duration) || catalogTotals.duration || 60)
  const endAt = computeEnd(startAt, duration)
  const balance = pendingBalance(form.total, form.deposit)
  const clientLabel = selectedClient?.name

  const canStep1 = (form.principalIds || []).length > 0 && Boolean(form.clientId)

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function applySelection(principalIds, addonIds, catalogItems = catalog) {
    const next = [
      ...catalogItems.filter((service) => principalIds.includes(service.id)),
      ...catalogItems.filter((service) => addonIds.includes(service.id)),
    ]
    const totals = sumServices(next)
    return {
      principalIds,
      addonIds,
      total: totals.price,
      duration: totals.duration || 60,
    }
  }

  function selectCreatedService(service) {
    setExtraServices((prev) => (prev.some((item) => item.id === service.id) ? prev : [...prev, service]))
    setForm((prev) => {
      const catalogItems = [...catalog.filter((item) => item.id !== service.id), service]
      if (serviceKind(service) === SERVICE_KIND.addon) {
        const addonIds = prev.addonIds?.includes(service.id)
          ? prev.addonIds
          : [...(prev.addonIds || []), service.id]
        return { ...prev, ...applySelection(prev.principalIds || [], addonIds, catalogItems) }
      }
      const principalIds = prev.principalIds?.includes(service.id)
        ? prev.principalIds
        : [...(prev.principalIds || []), service.id]
      return { ...prev, ...applySelection(principalIds, prev.addonIds || [], catalogItems) }
    })
  }

  function togglePrincipal(serviceId) {
    setForm((prev) => {
      const current = prev.principalIds || []
      const principalIds = current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId]
      return { ...prev, ...applySelection(principalIds, prev.addonIds || []) }
    })
  }

  function toggleAddon(serviceId) {
    setForm((prev) => {
      const current = prev.addonIds || []
      const addonIds = current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId]
      return { ...prev, ...applySelection(prev.principalIds || [], addonIds) }
    })
  }

  function goTo(nextStep) {
    setDirection(nextStep > step ? 'next' : 'prev')
    setStep(nextStep)
    setError('')
  }

  async function requestSave() {
    if (!canStep1) return
    const overlap = findOverlappingAppointment(appointments, startAt, endAt, appointment?.id, form.staffId)
    if (overlap) {
      const overlapStaff = resolveStaff(overlap, staff)
      const accepted = await confirm({
        title: 'Horario ocupado',
        message: conflictMessage(overlap, overlapStaff.name),
        confirmLabel: 'Continuar de todos modos',
      })
      if (!accepted) return
    }
    persist()
  }

  async function persist() {
    const uid = requireAuthUid()
    if (!uid) {
      setError(SESSION_EXPIRED_MESSAGE)
      return
    }

    setSaving(true)
    setError('')
    try {
      const clientId = form.clientId
      const clientName = selectedClient?.name || appointment?.clientName || ''
      const clientPhone = selectedClient?.phone || appointment?.clientPhone || ''

      const payload = {
        clientId,
        clientName,
        clientPhone,
        staffId: assignedStaff.id,
        staffName: assignedStaff.name,
        staffColor: assignedStaff.color || STAFF_COLORS[0],
        services: selectedServices.map((service) => ({
          id: service.id,
          name: service.name,
          price: toNumber(service.price),
          duration: toNumber(service.duration),
          kind: serviceKind(service),
          category: serviceCategory(service, categories),
        })),
        serviceId: selectedServices[0].id,
        serviceName: selectedServices.map((service) => service.name).join(' + '),
        duration,
        startAt,
        endAt,
        total: toNumber(form.total),
        deposit: toNumber(form.deposit),
        balance,
        notes: form.notes.trim(),
        status: form.status,
      }

      if (appointment) {
        await updateDoc(doc(db, 'users', uid, 'appointments', appointment.id), payload)
      } else {
        await addDoc(userCol(uid, 'appointments'), {
          ...payload,
          createdAt: serverTimestamp(),
        })
      }
      onClose()
    } catch (err) {
      setError(err.message || 'No se pudo guardar la cita.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!appointment) return
    const uid = requireAuthUid()
    if (!uid) {
      setError(SESSION_EXPIRED_MESSAGE)
      return
    }
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

  const summary = serviceSummary({
    services: selectedServices,
    serviceName: selectedServices.map((s) => s.name).join(' + '),
  })

  const statusOptions = [
    { id: APPOINTMENT_STATUS.pending, label: 'Pendiente', icon: Clock, className: 'bg-[#f8e8d0] text-[#b87a2a]' },
    { id: APPOINTMENT_STATUS.confirmed, label: 'Confirmada', icon: Check, className: 'bg-[#dce8df] text-sage' },
    { id: APPOINTMENT_STATUS.finished, label: 'Finalizada', icon: Check, className: 'bg-[#dce8df] text-sage' },
  ]
  if (form.status === APPOINTMENT_STATUS.cancelled) {
    statusOptions.push({ id: APPOINTMENT_STATUS.cancelled, label: 'Cancelada', icon: X, className: 'bg-sand text-muted' })
  }

  return createPortal(
    <>
      <div className={`fixed inset-0 flex justify-center bg-ink/25 ${nested === 'deep' ? 'z-[80]' : nested ? 'z-[70]' : 'z-50'}`}>
      <div className="flex h-full w-full max-w-md flex-col bg-pearl">
        <header className="shrink-0 px-4 pb-1 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="mb-1.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => (step === 0 ? onClose() : goTo(step - 1))}
              className="inline-flex h-10 items-center gap-0.5 pr-2 text-[16px] font-medium text-rose"
            >
              <ChevronLeft size={20} />
              Volver
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full bg-nude text-ink"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
          <div className="mb-1.5 flex gap-1.5 px-1">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  index <= step ? 'bg-rose' : 'bg-nude'
                }`}
              />
            ))}
          </div>
          <h2 className="px-1 font-display text-[24px] leading-none text-ink">{stepTitles[step]}</h2>
        </header>

        <div className="relative min-h-0 flex-1 overflow-hidden px-4 pt-2">
          <div key={step} className={`h-full overflow-y-auto ${direction === 'next' ? 'wizard-next' : 'wizard-prev'}`}>
            {step === 0 ? (
              <div className="flex h-full flex-col gap-3 overflow-hidden">
                {catalog.length === 0 ? (
                  <p className="rounded-2xl bg-blush/70 px-3 py-2 text-sm text-rose-deep">
                    Crea un servicio desde el catálogo o con “+ Crear” al elegir.
                  </p>
                ) : null}
                <GroupedPicker>
                  <PickerRow
                    grouped
                    label="Clienta"
                    value={clientLabel}
                    placeholder="Buscar o crear clienta"
                    onClick={() => setPicker('client')}
                    avatar={
                      clientLabel ? (
                        <ClientAvatar name={clientLabel} size={36} />
                      ) : (
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-nude text-muted">
                          <UserPlus size={16} />
                        </span>
                      )
                    }
                  />
                  <PickerRow
                    grouped
                    label="Atendida por"
                    value={assignedStaff.name}
                    placeholder="Dueña"
                    onClick={() => setPicker('staff')}
                    avatar={<StaffDot color={assignedStaff.color} name={assignedStaff.name} size={36} />}
                  />
                  <PickerRow
                    grouped
                    label="Servicios principales"
                    value={principalLabel}
                    placeholder="Elegir servicios"
                    onClick={() => setPicker('principals')}
                    avatar={
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-blush text-rose">
                        <Scissors size={16} />
                      </span>
                    }
                  />
                  <PickerRow
                    grouped
                    label="Complementos / Extras"
                    value={addonLabel}
                    placeholder="Sin complementos"
                    onClick={() => setPicker('addons')}
                    avatar={
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-soft/70 text-gold">
                        <Sparkles size={16} />
                      </span>
                    }
                  />
                </GroupedPicker>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="flex flex-col gap-5 pb-4">
                <CompactCalendar value={form.date} onSelect={(date) => setField('date', date)} />

                <div className="overflow-hidden rounded-[22px] bg-white">
                  <button
                    type="button"
                    onClick={() => setPicker('time')}
                    className="flex min-h-14 w-full items-center gap-3 px-4 text-left"
                  >
                    <span className="shrink-0 text-[16px] text-ink">Hora de inicio</span>
                    <span className="min-w-0 flex-1 text-center text-[20px] font-semibold tracking-wide text-rose">
                      {form.time}
                    </span>
                  </button>
                  <div className="ml-4 h-px bg-nude" />
                  <label className="flex min-h-14 items-center gap-3 px-4">
                    <span className="shrink-0 text-[16px] text-ink">Duración</span>
                    <span className="flex h-11 min-w-0 flex-1 items-center rounded-2xl bg-nude/60 px-3">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="1"
                        value={form.duration}
                        onChange={(event) => setField('duration', event.target.value)}
                        className="h-full min-w-0 flex-1 bg-transparent text-center text-[20px] font-semibold text-ink outline-none"
                      />
                      <span className="pl-2 text-sm font-medium text-muted">min</span>
                    </span>
                  </label>
                </div>

                <div className="rounded-2xl bg-nude/70 px-4 py-3 text-center text-sm text-muted">
                  Termina aprox. a las <strong className="text-ink">{formatTime(endAt)}</strong> · {duration} min
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="flex flex-col gap-2 pb-4">
                <div className="rounded-[18px] border border-nude bg-white px-3.5 py-2.5">
                  <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Resumen</p>
                  <p className="font-semibold text-ink">{clientLabel}</p>
                  <p className="text-sm text-muted">Atendida por {assignedStaff.name}</p>
                  <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
                    <span>{summary.label}</span>
                    {summary.extra > 0 ? (
                      <span className="rounded-full bg-nude px-2 py-0.5 text-[11px] font-semibold text-ink">
                        {extraLabel(summary.extra, summary.extraKind)}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-ink">
                    {formatDayLabel(startAt)} · {form.time}–{formatTime(endAt)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Costo total" hint="Ajusta si hay extra">
                    <TextInput
                      className="h-11"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={form.total}
                      onChange={(e) => setField('total', e.target.value)}
                    />
                  </Field>
                  <Field label="Anticipo">
                    <TextInput
                      className="h-11"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={form.deposit}
                      onChange={(e) => setField('deposit', e.target.value)}
                    />
                  </Field>
                </div>

                <ChargeTicket items={selectedServices} total={form.total} deposit={form.deposit} />

                <Field label="Notas y referencias de diseño (opcional)">
                  <TextArea
                    className="min-h-[110px] px-4 py-3.5"
                    rows={4}
                    value={form.notes}
                    onChange={(e) => setField('notes', e.target.value)}
                    placeholder="Ej. francesa con efecto cromo, cristales en anular…"
                  />
                </Field>

                <div className={`grid gap-2 ${statusOptions.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {statusOptions.map((item) => {
                    const Icon = item.icon
                    const active = form.status === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setField('status', item.id)}
                        className={`flex h-11 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold ${item.className} ${
                          active ? 'ring-2 ring-ink/15' : 'opacity-70'
                        }`}
                      >
                        <Icon size={16} />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <footer className="safe-bottom shrink-0 space-y-2 px-4 pt-2">
          {error ? (
            <p className="rounded-2xl bg-blush/80 px-3 py-2 text-sm text-rose-deep">{error}</p>
          ) : null}
          {step === 0 ? (
            <>
              <div className="rounded-2xl bg-nude/70 px-4 py-2.5 text-center text-sm text-ink">
                <span className="font-semibold">{catalogTotals.duration || 0} min</span>
                <span className="mx-2 text-muted">·</span>
                <span className="font-semibold">{formatMoney(catalogTotals.price)}</span>
              </div>
              <Button className="w-full" onClick={() => goTo(1)} disabled={!canStep1}>
                Siguiente: Elegir horario →
              </Button>
            </>
          ) : null}
          {step === 1 ? (
            <Button className="w-full" onClick={() => goTo(2)}>
              Siguiente: Detalles y pago →
            </Button>
          ) : null}
          {step === 2 ? (
            <>
              <Button className="w-full" onClick={requestSave} disabled={saving || !canStep1}>
                {saving ? 'Guardando…' : appointment ? 'Guardar cambios' : 'Agendar Cita'}
              </Button>
              {appointment ? (
                <div className="flex gap-2">
                  {appointment.clientPhone && appointment.status !== 'cancelled' ? (
                    <Button
                      variant="whatsapp"
                      className="min-h-11 flex-1"
                      onClick={() => {
                        const message = fillTemplate(
                          profile?.whatsappTemplate,
                          appointmentMessageVars(appointment, profile?.businessName),
                        )
                        openWhatsAppLink(buildWhatsAppUrl(appointment.clientPhone, message))
                      }}
                    >
                      <WhatsAppIcon size={16} />
                      WhatsApp
                    </Button>
                  ) : null}
                  <Button variant="danger" className="min-h-11 flex-1" onClick={remove}>
                    Eliminar
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </footer>
      </div>
      </div>

      {picker === 'time' ? (
        <TimeWheelSheet
          value={form.time}
          onSelect={(time) => setField('time', time)}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {picker === 'client' ? (
        <ClientPicker
          clients={clientCatalog}
          onSelect={(client) => {
            setForm((prev) => ({ ...prev, clientId: client.id }))
            setPicker(null)
          }}
          onCreateNew={() => setCreatingClient(true)}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {creatingClient ? (
        <QuickClientSheet
          onCreated={(client) => {
            setExtraClients((prev) => (prev.some((item) => item.id === client.id) ? prev : [...prev, client]))
            setForm((prev) => ({ ...prev, clientId: client.id }))
            setPicker(null)
          }}
          onClose={() => setCreatingClient(false)}
        />
      ) : null}

      {picker === 'staff' ? (
        <StaffPicker
          staff={staffList}
          selectedId={form.staffId}
          onSelect={(staffId) => setField('staffId', staffId)}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {picker === 'principals' ? (
        <ServicePicker
          title="Servicios principales"
          searchPlaceholder="Buscar servicio..."
          items={principals}
          selectedIds={form.principalIds || []}
          onToggle={togglePrincipal}
          onCreated={selectCreatedService}
          defaultKind={SERVICE_KIND.principal}
          onClose={() => setPicker(null)}
          emptyText="No hay servicios principales. Crea uno al instante."
          emptyHint="No hay coincidencias en esta categoría."
        />
      ) : null}

      {picker === 'addons' ? (
        <ServicePicker
          title="Complementos / Extras"
          searchPlaceholder="Buscar complemento..."
          items={addons}
          selectedIds={form.addonIds || []}
          onToggle={toggleAddon}
          onCreated={selectCreatedService}
          defaultKind={SERVICE_KIND.addon}
          onClose={() => setPicker(null)}
          emptyText="Aún no hay complementos. Crea uno al instante o déjalo vacío."
          emptyHint="No hay coincidencias en esta categoría."
        />
      ) : null}

      {confirmDialog}
    </>,
    document.body,
  )
}
