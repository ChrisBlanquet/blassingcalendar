import { Check } from 'lucide-react'
import { Sheet } from '../Sheet'
import { Button } from '../ui'
import { isOwnerStaff } from '../../lib/staff'

const STATUSES = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'confirmed', label: 'Confirmadas' },
  { id: 'finalizada', label: 'Finalizadas' },
]

export function AgendaFilterSheet({ staff = [], services = [], filters, onChange, onClear, onClose }) {
  const hasActive =
    filters.staffId !== 'all' || filters.status !== 'all' || filters.serviceId !== 'all'

  function setFilter(key, value) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <Sheet
      title="Filtros"
      onClose={onClose}
      footer={
        <div className="space-y-2">
          {hasActive ? (
            <Button variant="ghost" className="w-full" onClick={onClear}>
              Limpiar filtros
            </Button>
          ) : null}
          <Button className="w-full" onClick={onClose}>
            Listo
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <FilterGroup title="Filtrar por empleada">
          <OptionRow
            label="Todas"
            active={filters.staffId === 'all'}
            onClick={() => setFilter('staffId', 'all')}
          />
          {staff.map((member) => (
            <OptionRow
              key={member.id}
              label={isOwnerStaff(member) ? 'Dueña' : member.name}
              color={member.color}
              active={filters.staffId === member.id}
              onClick={() => setFilter('staffId', member.id)}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Filtrar por estado">
          {STATUSES.map((item) => (
            <OptionRow
              key={item.id}
              label={item.label}
              active={filters.status === item.id}
              onClick={() => setFilter('status', item.id)}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Filtrar por trabajo / servicio">
          <OptionRow
            label="Todos los servicios"
            active={filters.serviceId === 'all'}
            onClick={() => setFilter('serviceId', 'all')}
          />
          {services.map((service) => (
            <OptionRow
              key={service.id}
              label={service.name}
              active={filters.serviceId === service.id}
              onClick={() => setFilter('serviceId', service.id)}
            />
          ))}
        </FilterGroup>
      </div>
    </Sheet>
  )
}

function FilterGroup({ title, children }) {
  return (
    <section>
      <p className="mb-2 px-1 text-[11px] font-semibold tracking-wide text-muted uppercase">{title}</p>
      <div className="overflow-hidden rounded-[22px] border border-nude bg-white">{children}</div>
    </section>
  )
}

function OptionRow({ label, active, onClick, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 w-full items-center gap-3 border-b border-nude px-3.5 text-left last:border-b-0 active:bg-nude/40"
    >
      {color ? <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} /> : null}
      <span className={`min-w-0 flex-1 truncate ${active ? 'font-semibold text-ink' : 'text-ink'}`}>{label}</span>
      {active ? <Check size={18} className="shrink-0 text-rose" /> : null}
    </button>
  )
}
