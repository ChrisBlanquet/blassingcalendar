import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { InsetModal, SearchField } from '../InsetModal'
import { StaffDot } from '../staff/StaffBadge'
import { isOwnerStaff } from '../../lib/staff'

export function StaffPicker({ staff, selectedId, onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return staff
    return staff.filter((member) => String(member.name || '').toLowerCase().includes(q))
  }, [staff, query])

  return (
    <InsetModal
      title="Atendida por"
      onClose={onClose}
      nested
      search={<SearchField value={query} onChange={setQuery} placeholder="Buscar colaboradora..." />}
    >
      {filtered.length === 0 ? (
        <p className="px-1 py-8 text-center text-sm text-muted">No hay coincidencias.</p>
      ) : (
        <ul className="overflow-hidden rounded-[22px] border border-nude bg-white">
          {filtered.map((member) => {
            const active = member.id === selectedId
            return (
              <li key={member.id} className="border-b border-nude last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(member.id)
                    onClose()
                  }}
                  className="flex min-h-14 w-full items-center gap-3 px-3.5 py-3 text-left active:bg-nude/50"
                >
                  <StaffDot color={member.color} name={member.name} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{member.name}</span>
                    <span className="block text-sm text-muted">
                      {isOwnerStaff(member) ? 'Dueña / administradora' : 'Colaboradora'}
                    </span>
                  </span>
                  {active ? <Check size={20} className="shrink-0 text-rose" /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </InsetModal>
  )
}
