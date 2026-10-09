import { Check } from 'lucide-react'
import { Sheet } from '../Sheet'
import { Button } from '../ui'
import { isOwnerStaff } from '../../lib/staff'

export const DEFAULT_HISTORY_FILTERS = {
  month: 'all',
  staffId: 'all',
  sort: 'recent',
}

const SORTS = [
  { id: 'recent', label: 'Más recientes primero', prefix: '\u{1F4C5}' },
  { id: 'price-desc', label: 'Precio: Mayor a menor', prefix: '\u{1F4B0}' },
  { id: 'price-asc', label: 'Precio: Menor a mayor', prefix: '\u{1F3F7}\uFE0F' },
]

export function historyFiltersActive(filters = DEFAULT_HISTORY_FILTERS) {
  return filters.month !== 'all' || filters.staffId !== 'all' || filters.sort !== 'recent'
}

export function HistoryFilterSheet({
  months = [],
  staff = [],
  filters,
  onChange,
  onReset,
  onClose,
}) {
  const hasActive = historyFiltersActive(filters)

  function setFilter(key, value) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <Sheet
      nested
      title="Filtros del historial"
      onClose={onClose}
      headerAction={
        <button
          type="button"
          onClick={onReset}
          disabled={!hasActive}
          className={`h-11 shrink-0 px-1.5 text-[16px] font-semibold transition-colors ${
            hasActive ? 'text-rose' : 'pointer-events-none text-muted/40'
          }`}
        >
          Restablecer
        </button>
      }
      footer={
        <Button className="flex h-12 w-full justify-center" onClick={onClose}>
          Listo
        </Button>
      }
    >
      <div className="space-y-4">
        <FilterGroup title="Por mes">
          <OptionRow
            label="Todos los meses"
            active={filters.month === 'all'}
            onClick={() => setFilter('month', 'all')}
          />
          {months.map((month) => (
            <OptionRow
              key={month.id}
              label={month.label}
              active={filters.month === month.id}
              onClick={() => setFilter('month', month.id)}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="Atendida por">
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

        <FilterGroup title="Ordenar por">
          {SORTS.map((item) => (
            <OptionRow
              key={item.id}
              label={`${item.prefix} ${item.label}`}
              active={filters.sort === item.id}
              onClick={() => setFilter('sort', item.id)}
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
