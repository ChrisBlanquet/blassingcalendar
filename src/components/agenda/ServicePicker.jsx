import { useMemo, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { InsetModal, SearchField } from '../InsetModal'
import { CategoryBadge, CategoryChips } from '../CategoryChips'
import { Button } from '../ui'
import { formatMoney } from '../../lib/money'
import { useCategories } from '../../hooks/useCategories'
import { SERVICE_KIND, serviceCategory } from '../../lib/services'
import { QuickServiceSheet } from './QuickServiceSheet'

export function ServicePicker({
  title,
  searchPlaceholder,
  items,
  selectedIds = [],
  onToggle,
  onCreated,
  onClose,
  defaultKind = SERVICE_KIND.principal,
  emptyText,
  emptyHint,
}) {
  const { categories } = useCategories()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [creating, setCreating] = useState(false)
  const selected = selectedIds.length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      const name = String(item.name || '').toLowerCase()
      const matchesQuery = !q || name.includes(q)
      const matchesCategory = category === 'all' || serviceCategory(item, categories) === category
      return matchesQuery && matchesCategory
    })
  }, [items, query, category, categories])

  return (
    <>
      <InsetModal
        title={title}
        onClose={onClose}
        nested
        search={<SearchField value={query} onChange={setQuery} placeholder={searchPlaceholder} />}
        filters={<CategoryChips value={category} onChange={setCategory} />}
        footer={
          <Button className="flex h-12 w-full min-w-0 justify-center rounded-2xl" onClick={onClose}>
            <span className="truncate text-center">
              {selected ? `Listo · ${selected} seleccionado${selected === 1 ? '' : 's'}` : 'Listo'}
            </span>
          </Button>
        }
      >
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-dashed border-rose/40 bg-blush/40 px-3.5 text-left text-rose-deep active:scale-[0.99]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-rose">
              <Plus size={20} />
            </span>
            <span>
              <span className="block font-semibold">Crear nuevo servicio o complemento al instante</span>
              <span className="block text-xs text-muted">Nombre, categoría, duración y precio</span>
            </span>
          </button>

          {items.length === 0 ? (
            <p className="px-1 py-6 text-center text-sm text-muted">{emptyText}</p>
          ) : filtered.length === 0 ? (
            <p className="px-1 py-6 text-center text-sm text-muted">{emptyHint || 'No hay coincidencias.'}</p>
          ) : (
            <ul className="overflow-hidden rounded-[22px] border border-nude bg-white">
              {filtered.map((item) => {
                const active = selectedIds.includes(item.id)
                return (
                  <li key={item.id} className="border-b border-nude last:border-b-0">
                    <button
                      type="button"
                      onClick={() => onToggle(item.id)}
                      className="flex min-h-16 w-full items-center gap-3 px-3.5 py-3 text-left active:bg-nude/50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-ink">{item.name}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                          <CategoryBadge categoryId={serviceCategory(item, categories)} categories={categories} />
                          <span>{item.duration} min</span>
                          <span className="font-medium text-ink">{formatMoney(item.price)}</span>
                        </span>
                      </span>
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                          active ? 'border-rose bg-rose text-white' : 'border-sand bg-white text-transparent'
                        }`}
                        aria-hidden="true"
                      >
                        <Check size={15} strokeWidth={3} />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </InsetModal>

      {creating ? (
        <QuickServiceSheet
          defaultKind={defaultKind}
          onCreated={(service) => {
            onCreated?.(service)
            setCategory('all')
            setQuery('')
          }}
          onClose={() => setCreating(false)}
        />
      ) : null}
    </>
  )
}
