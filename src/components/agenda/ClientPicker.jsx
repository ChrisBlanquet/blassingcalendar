import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { InsetModal, SearchField } from '../InsetModal'
import { InstagramIcon } from '../InstagramIcon'
import { ClientAvatar } from './PickerRow'
import { cleanInstagram } from '../../lib/instagram'
import { formatPhoneDisplay, toLocalDigits } from '../../lib/phone'

export function ClientPicker({ clients, onSelect, onCreateNew, onClose }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const digits = toLocalDigits(query)
    const cleanQ = q.replace(/^@/, '')
    if (!q) return clients
    return clients.filter((client) => {
      const name = (client.name || '').toLowerCase()
      const phone = String(client.phone || '')
      const instagram = String(client.instagram || '').toLowerCase()
      return (
        name.includes(q) ||
        (digits && phone.includes(digits)) ||
        phone.includes(q) ||
        instagram.includes(cleanQ)
      )
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
          placeholder="Buscar por nombre, teléfono o Instagram..."
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
            <span className="block text-xs text-muted">Nombre y contacto al instante</span>
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
                    {client.phone && client.instagram ? (
                      <span className="flex items-center gap-1.5 truncate text-sm text-muted">
                        <span>{formatPhoneDisplay(client.phone)}</span>
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-nude/70 px-1.5 py-0.5 text-[11px] font-medium text-muted">
                          <InstagramIcon size={11} className="shrink-0 text-muted/70" />
                          <span className="max-w-[100px] truncate">@{cleanInstagram(client.instagram)}</span>
                        </span>
                      </span>
                    ) : client.phone ? (
                      <span className="block truncate text-sm text-muted">{formatPhoneDisplay(client.phone)}</span>
                    ) : client.instagram ? (
                      <span className="flex items-center gap-1 truncate text-sm text-muted">
                        <InstagramIcon size={12} className="shrink-0 text-muted/70" />
                        <span>@{cleanInstagram(client.instagram)}</span>
                      </span>
                    ) : (
                      <span className="block text-sm italic text-muted/60">Sin datos de contacto</span>
                    )}
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
