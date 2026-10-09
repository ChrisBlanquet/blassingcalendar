import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { InsetModal, SearchField } from '../InsetModal'
import { ClientAvatar } from './PickerRow'
import { formatPhoneDisplay, toLocalDigits } from '../../lib/phone'

export function ClientPicker({ clients, onSelect, onCreateNew, onClose }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const digits = toLocalDigits(query)
    if (!q) return clients
    return clients.filter((client) => {
      const name = (client.name || '').toLowerCase()
      const phone = String(client.phone || '')
      return name.includes(q) || phone.includes(digits) || phone.includes(q)
    })
  }, [clients, query])

  return (
    <InsetModal
      title="Clienta"
      onClose={onClose}
      nested
      search={
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Buscar por nombre o teléfono..."
        />
      }
    >
      <div className="space-y-3">
        <button
          type="button"
          onClick={onCreateNew}
          className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-dashed border-rose/40 bg-blush/40 px-3.5 text-left text-rose-deep active:scale-[0.99]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-rose">
            <Plus size={20} />
          </span>
          <span>
            <span className="block font-semibold">Crear nueva clienta</span>
            <span className="block text-xs text-muted">Nombre y WhatsApp al instante</span>
          </span>
        </button>

        {filtered.length === 0 ? (
          <p className="px-1 py-8 text-center text-sm text-muted">
            No hay coincidencias. Crea una clienta nueva.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-[22px] border border-nude bg-white/85">
            {filtered.map((client) => (
              <li key={client.id} className="border-b border-nude last:border-b-0">
                <button
                  type="button"
                  onClick={() => onSelect(client)}
                  className="flex min-h-14 w-full items-center gap-3 px-3.5 py-3 text-left active:bg-blush/40"
                >
                  <ClientAvatar name={client.name} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{client.name}</span>
                    <span className="block text-sm text-muted">{formatPhoneDisplay(client.phone)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </InsetModal>
  )
}
