import { useMemo, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { ChevronLeft, ChevronRight, Plus, SlidersHorizontal } from 'lucide-react'
import { db } from '../firebase'
import { requireAuthUid } from '../lib/authGuard'
import { APPOINTMENT_STATUS, statusMatches } from '../lib/appointmentStatus'
import { AgendaFilterSheet } from '../components/agenda/AgendaFilterSheet'
import { AppointmentDetailSheet } from '../components/agenda/AppointmentDetailSheet'
import { AppointmentSheet } from '../components/agenda/AppointmentSheet'
import { DayTimeline } from '../components/agenda/DayTimeline'
import { MonthView } from '../components/agenda/MonthView'
import { WeekGrid } from '../components/agenda/WeekGrid'
import { Fab } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useCollection } from '../hooks/useCollection'
import { useStaff } from '../hooks/useStaff'
import { appointmentStaffId } from '../lib/conflicts'
import { getAppointmentServices } from '../lib/services'
import {
  addDays,
  addMonths,
  formatDayLabel,
  formatMonthTitle,
  formatWeekRange,
  formatWeekday,
  getWeekDays,
  isInDay,
  isSameDay,
  isToday,
  startOfWeek,
  toDate,
} from '../lib/dates'
import { appointmentMessageVars, buildWhatsAppUrl, fillTemplate, openWhatsAppLink } from '../lib/whatsapp'

const views = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
]

export function Agenda() {
  const { profile } = useAuth()
  const { items: appointments } = useCollection('appointments', 'startAt', 'asc')
  const { items: clients } = useCollection('clients', 'name', 'asc')
  const { items: services } = useCollection('services', 'name', 'asc')
  const { staff } = useStaff()
  const [view, setView] = useState('day')
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [filters, setFilters] = useState({ staffId: 'all', status: 'all', serviceId: 'all' })
  const [filterOpen, setFilterOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [editor, setEditor] = useState(null)

  const hasActiveFilters =
    filters.staffId !== 'all' || filters.status !== 'all' || filters.serviceId !== 'all'

  const weekDays = useMemo(() => getWeekDays(selectedDay), [selectedDay])
  const visibleAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (filters.staffId !== 'all' && appointmentStaffId(apt) !== filters.staffId) return false
      if (filters.status !== 'all' && !statusMatches(apt.status, filters.status)) return false
      if (filters.serviceId !== 'all') {
        const items = getAppointmentServices(apt)
        const matches = items.some((item) => item.id === filters.serviceId) || apt.serviceId === filters.serviceId
        if (!matches) return false
      }
      return true
    })
  }, [appointments, filters])
  const dayAppointments = useMemo(
    () => visibleAppointments.filter((apt) => isInDay(apt.startAt, selectedDay)),
    [visibleAppointments, selectedDay],
  )
  const weekAppointments = useMemo(() => {
    const start = startOfWeek(selectedDay, { weekStartsOn: 1 })
    const end = addDays(start, 7)
    return visibleAppointments.filter((apt) => {
      const date = toDate(apt.startAt)
      return date && date >= start && date < end
    })
  }, [visibleAppointments, selectedDay])

  function shift(direction) {
    setSelectedDay((prev) => {
      if (view === 'month') return addMonths(prev, direction)
      if (view === 'week') return addDays(prev, direction * 7)
      return addDays(prev, direction)
    })
  }

  function openDay(day) {
    setSelectedDay(day)
    setView('day')
  }

  async function finalizeAppointment(appointment) {
    if (!appointment?.id) return
    const uid = requireAuthUid()
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'appointments', appointment.id), {
      status: APPOINTMENT_STATUS.finished,
    })
  }

  function openWhatsApp(appointment) {
    const message = fillTemplate(
      profile?.whatsappTemplate,
      appointmentMessageVars(appointment, profile?.businessName),
    )
    openWhatsAppLink(buildWhatsAppUrl(appointment.clientPhone, message))
  }

  const detailAppointment = detailId ? appointments.find((apt) => apt.id === detailId) : null
  const editingAppointment =
    editor && editor !== 'new' ? appointments.find((apt) => apt.id === (editor.id || editor)) || editor : null

  const title =
    view === 'day'
      ? formatDayLabel(selectedDay)
      : view === 'week'
        ? formatWeekRange(selectedDay)
        : formatMonthTitle(selectedDay)

  return (
    <div className="pt-3">
      <div className="px-5">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="grid h-11 w-11 place-items-center rounded-full bg-nude"
            aria-label="Anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="font-display text-2xl capitalize text-ink">{title}</p>
            <button type="button" className="text-xs font-medium text-rose" onClick={() => setSelectedDay(new Date())}>
              Ir a hoy
            </button>
          </div>
          <button
            type="button"
            onClick={() => shift(1)}
            className="grid h-11 w-11 place-items-center rounded-full bg-nude"
            aria-label="Siguiente"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <div className="grid min-w-0 flex-1 grid-cols-3 rounded-2xl bg-nude/80 p-1">
            {views.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`h-11 rounded-xl text-sm font-medium transition-all duration-300 ease-out ${
                  view === item.id ? 'bg-white text-ink shadow-sm' : 'text-muted'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-nude text-ink"
            aria-label="Filtros de agenda"
          >
            <SlidersHorizontal size={18} />
            {hasActiveFilters ? (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose ring-2 ring-pearl" />
            ) : null}
          </button>
        </div>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => setFilters({ staffId: 'all', status: 'all', serviceId: 'all' })}
            className="mb-3 text-sm font-semibold text-rose"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>

      {view === 'day' ? (
        <div key={selectedDay.toDateString()} className="slide-fade">
          <div className="mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {weekDays.map((day) => {
              const active = isSameDay(day, selectedDay)
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`min-w-12 rounded-2xl px-2.5 py-2 text-center transition-all duration-300 ease-out ${
                    active ? 'bg-rose text-white shadow-md' : 'bg-white text-ink'
                  } ${isToday(day) && !active ? 'ring-1 ring-gold' : ''}`}
                >
                  <span className="block text-[10px] font-semibold uppercase opacity-80">
                    {formatWeekday(day)}
                  </span>
                  <span className="font-display text-xl leading-none">{day.getDate()}</span>
                </button>
              )
            })}
          </div>
          <DayTimeline
            appointments={dayAppointments}
            staff={staff}
            onOpen={(apt) => setDetailId(apt.id)}
            onWhatsApp={openWhatsApp}
            onFinalize={finalizeAppointment}
          />
        </div>
      ) : null}

      {view === 'week' ? (
        <WeekGrid days={weekDays} appointments={weekAppointments} onOpenDay={openDay} />
      ) : null}

      {view === 'month' ? (
        <MonthView month={selectedDay} appointments={visibleAppointments} onOpenDay={openDay} />
      ) : null}

      <Fab onClick={() => setEditor('new')}>
        <Plus />
      </Fab>

      {detailAppointment ? (
        <AppointmentDetailSheet
          appointment={detailAppointment}
          staff={staff}
          onClose={() => setDetailId(null)}
          onEdit={() => setEditor(detailAppointment)}
          onWhatsApp={openWhatsApp}
          onFinalize={finalizeAppointment}
        />
      ) : null}

      {editor ? (
        <AppointmentSheet
          nested={Boolean(detailAppointment)}
          appointment={editor === 'new' ? null : editingAppointment}
          clients={clients}
          services={services}
          appointments={appointments}
          initialDate={selectedDay}
          onClose={() => setEditor(null)}
        />
      ) : null}

      {filterOpen ? (
        <AgendaFilterSheet
          staff={staff}
          services={services}
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters({ staffId: 'all', status: 'all', serviceId: 'all' })}
          onClose={() => setFilterOpen(false)}
        />
      ) : null}
    </div>
  )
}
