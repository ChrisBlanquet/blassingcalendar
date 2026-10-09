import { useCategories } from '../hooks/useCategories'

export function CategoryChips({
  value,
  onChange,
  categories: categoriesProp,
  showAll = true,
  allLabel = 'Todos',
  className = '',
}) {
  const { categories: fromHook } = useCategories()
  const categories = categoriesProp || fromHook

  return (
    <div className={`chip-scroll -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-0.5 ${className}`}>
      {showAll ? (
        <Chip active={value === 'all'} onClick={() => onChange('all')}>
          {allLabel}
        </Chip>
      ) : null}
      {categories.map((category) => (
        <Chip key={category.id} active={value === category.id} onClick={() => onChange(category.id)}>
          <span aria-hidden="true">{category.emoji}</span>
          {category.short}
        </Chip>
      ))}
    </div>
  )
}

export function CategoryField({ value, onChange, categories: categoriesProp }) {
  const { categories: fromHook } = useCategories()
  const categories = categoriesProp || fromHook

  return (
    <div className="space-y-1.5">
      <p className="px-1 text-sm font-medium text-muted">Categoría</p>
      {categories.length === 0 ? (
        <p className="rounded-2xl bg-nude/70 px-3 py-2 text-sm text-muted">
          Crea una categoría en la pestaña Servicios.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Chip key={category.id} active={value === category.id} onClick={() => onChange(category.id)} wrap>
              <span aria-hidden="true">{category.emoji}</span>
              {category.short}
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}

export function CategoryBadge({ categoryId, categories: categoriesProp }) {
  const { categories: fromHook } = useCategories()
  const categories = categoriesProp || fromHook
  const category = categories.find((item) => item.id === categoryId)
  if (!category) return null
  return (
    <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-nude px-2 py-0.5 text-[11px] font-semibold text-muted">
      <span aria-hidden="true">{category.emoji}</span>
      {category.short}
    </span>
  )
}

function Chip({ active, onClick, children, wrap = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-3.5 text-sm font-semibold transition ${
        wrap ? '' : 'whitespace-nowrap'
      } ${active ? 'bg-ink text-white' : 'bg-nude text-ink'}`}
    >
      {children}
    </button>
  )
}
