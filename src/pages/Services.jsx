import { useMemo, useState } from 'react'
import { addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { MoreHorizontal, Pencil, Plus, Scissors, SlidersHorizontal, Sparkles, Trash2 } from 'lucide-react'
import { Button, EmptyState, Fab, Field, TextInput } from '../components/ui'
import { Sheet } from '../components/Sheet'
import { SearchField } from '../components/InsetModal'
import { CategoryField } from '../components/CategoryChips'
import { CategoryFormSheet, deleteCategory } from '../components/categories/CategoryFormSheet'
import { ActionSheet, ActionSheetItem } from '../components/ios/ActionSheet'
import { useCategories } from '../hooks/useCategories'
import { useCollection, userCol } from '../hooks/useCollection'
import { db } from '../firebase'
import { useConfirm } from '../hooks/useConfirm.jsx'
import { requireAuthUid, SESSION_EXPIRED_MESSAGE } from '../lib/authGuard'
import { formatMoney, toNumber } from '../lib/money'
import {
  defaultCategoryForKind,
  SERVICE_KIND,
  serviceCategory,
  serviceKind,
} from '../lib/services'

function emptyService(categories = []) {
  return {
    name: '',
    price: '',
    duration: 60,
    kind: SERVICE_KIND.principal,
    category: defaultCategoryForKind(SERVICE_KIND.principal, categories),
  }
}

function countLabel(count) {
  return count === 1 ? '1 servicio' : `${count} servicios`
}

export function Services() {
  const { items, loading } = useCollection('services', 'name', 'asc')
  const { categories, loading: loadingCategories } = useCategories()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(() => emptyService())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categoryForm, setCategoryForm] = useState(null)
  const [categoryMenu, setCategoryMenu] = useState(null)
  const [filter, setFilter] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [confirm, confirmDialog] = useConfirm()

  const search = query.trim().toLowerCase()
  const groups = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        items: items.filter((service) => {
          if (serviceCategory(service, categories) !== category.id) return false
          if (!search) return true
          return String(service.name || '').toLowerCase().includes(search)
        }),
      })),
    [categories, items, search],
  )
  const visibleGroups = useMemo(() => {
    const scoped = filter === 'all' ? groups : groups.filter((group) => group.id === filter)
    return search ? scoped.filter((group) => group.items.length) : scoped
  }, [filter, groups, search])
  const hasActiveFilter = filter !== 'all'

  function openNew() {
    setEditing(null)
    setForm(emptyService(categories))
    setError('')
    setOpen(true)
  }

  function openEdit(service) {
    setEditing(service)
    setForm({
      name: service.name,
      price: service.price,
      duration: service.duration,
      kind: serviceKind(service),
      category: serviceCategory(service, categories),
    })
    setError('')
    setOpen(true)
  }

  function setKind(kind) {
    setForm((prev) => ({
      ...prev,
      kind,
      category:
        prev.category === defaultCategoryForKind(prev.kind, categories)
          ? defaultCategoryForKind(kind, categories)
          : prev.category,
    }))
  }

  async function save() {
    if (!form.name.trim()) return
    const uid = requireAuthUid()
    if (!uid) {
      setError(SESSION_EXPIRED_MESSAGE)
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      price: toNumber(form.price),
      duration: toNumber(form.duration) || 60,
      kind: serviceKind(form),
      category: form.category || defaultCategoryForKind(form.kind, categories),
    }
    try {
      if (editing) {
        await updateDoc(doc(db, 'users', uid, 'services', editing.id), payload)
      } else {
        await addDoc(userCol(uid, 'services'), { ...payload, createdAt: serverTimestamp() })
      }
      setOpen(false)
    } catch (err) {
      setError(err.message || 'No se pudo guardar el servicio.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(service) {
    const uid = requireAuthUid()
    if (!uid) {
      setError(SESSION_EXPIRED_MESSAGE)
      return
    }
    const accepted = await confirm({
      title: '¿Eliminar servicio?',
      message: `Se quitará “${service.name}” del catálogo. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    })
    if (!accepted) return
    await deleteDoc(doc(db, 'users', uid, 'services', service.id))
  }

  const busy = loading || loadingCategories

  return (
    <div className="px-4 pt-2 pb-24">
      <p className="mb-4 text-sm text-muted">Catálogo de servicios, precios y duración.</p>

      <div className="mb-6 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <SearchField value={query} onChange={setQuery} placeholder="Buscar servicio o extra..." />
        </div>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-nude text-ink"
          aria-label={hasActiveFilter ? 'Cambiar filtro de categoría' : 'Filtrar por categoría'}
        >
          <SlidersHorizontal size={18} />
          {hasActiveFilter ? (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose ring-2 ring-pearl" />
          ) : null}
        </button>
      </div>

      {busy ? <p className="py-10 text-center text-muted">Cargando…</p> : null}

      {!busy && !categories.length && !items.length ? (
        <EmptyState
          icon={Scissors}
          title="Sin servicios aún"
          text="Crea una categoría y agrega acrílico, gelish o el menú de tu estudio."
        />
      ) : null}

      {!busy && visibleGroups.length ? (
        <div className="space-y-5">
          {visibleGroups.map((group) => (
            <section
              key={group.id}
              className="overflow-hidden rounded-[22px] border border-nude bg-white shadow-[0_8px_24px_rgba(61,43,36,0.05)]"
            >
              <div className="flex items-center gap-3 px-3.5 py-3">
                <span className="text-[22px] leading-none" aria-hidden="true">
                  {group.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[17px] font-semibold tracking-tight text-ink">{group.short}</h2>
                  <p className="text-[12px] text-muted/80">{countLabel(group.items.length)}</p>
                </div>
                <button
                  type="button"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted/55 hover:bg-nude hover:text-ink"
                  onClick={() => setCategoryMenu(group)}
                  aria-label={`Opciones de ${group.name}`}
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>

              {group.items.length === 0 ? (
                <p className="mx-3.5 mb-3 rounded-xl border border-dashed border-sand/80 py-2 text-center text-[13px] text-muted/55">
                  Sin servicios aún
                </p>
              ) : (
                <ul>
                  {group.items.map((service) => (
                    <li
                      key={service.id}
                      className="flex items-center gap-3 border-t border-nude/70 px-3.5 py-2.5"
                    >
                      <div
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                          serviceKind(service) === SERVICE_KIND.addon
                            ? 'bg-gold-soft/60 text-ink/70'
                            : 'bg-blush/70 text-rose'
                        }`}
                      >
                        {serviceKind(service) === SERVICE_KIND.addon ? (
                          <Sparkles size={16} />
                        ) : (
                          <Scissors size={16} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[15px] font-semibold text-ink">{service.name}</h3>
                        <p className="text-[13px] text-muted">
                          {formatMoney(service.price)} · {service.duration} min
                        </p>
                      </div>
                      <button
                        type="button"
                        className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-nude hover:text-ink"
                        onClick={() => openEdit(service)}
                        aria-label="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="grid h-9 w-9 place-items-center rounded-full text-muted/70 hover:bg-blush/70 hover:text-rose-deep"
                        onClick={() => remove(service)}
                        aria-label="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      ) : null}

      {!busy && categories.length && !visibleGroups.length ? (
        <p className="py-10 text-center text-sm text-muted">
          {search ? 'No hay coincidencias.' : 'No hay categorías para este filtro.'}
        </p>
      ) : null}

      {open ? (
        <Sheet
          title={editing ? 'Editar servicio' : 'Nuevo servicio'}
          onClose={() => setOpen(false)}
          footer={
            <Button className="flex h-12 w-full justify-center" onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          }
        >
          <div className="space-y-3">
            {error ? (
              <p className="rounded-2xl bg-blush/80 px-3 py-2 text-sm text-rose-deep">{error}</p>
            ) : null}
            <div className="space-y-1.5">
              <p className="px-1 text-sm font-medium text-muted">Tipo</p>
              <div className="grid grid-cols-2 rounded-2xl bg-nude/80 p-1">
                {[
                  { id: SERVICE_KIND.principal, label: 'Servicio principal' },
                  { id: SERVICE_KIND.addon, label: 'Complemento' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setKind(item.id)}
                    className={`h-11 rounded-xl text-sm font-medium ${
                      serviceKind(form) === item.id ? 'bg-white text-ink shadow-sm' : 'text-muted'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Nombre">
              <TextInput
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={serviceKind(form) === SERVICE_KIND.addon ? 'Efecto cromo' : 'Acrílico esculpido'}
              />
            </Field>
            <CategoryField
              value={form.category}
              onChange={(category) => setForm((f) => ({ ...f, category }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Precio ($)">
                <TextInput
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="650"
                />
              </Field>
              <Field label="Duración (min)">
                <TextInput
                  type="number"
                  inputMode="numeric"
                  min="15"
                  step="15"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                />
              </Field>
            </div>
          </div>
        </Sheet>
      ) : null}

      <Fab onClick={() => setCreateOpen(true)}>
        <Plus />
      </Fab>

      {createOpen ? (
        <ActionSheet title="Agregar" onClose={() => setCreateOpen(false)}>
          <ActionSheetItem
            centered
            onClick={() => {
              setCreateOpen(false)
              openNew()
            }}
          >
            💅 Nuevo servicio o extra
          </ActionSheetItem>
          <ActionSheetItem
            centered
            onClick={() => {
              setCreateOpen(false)
              setCategoryForm({})
            }}
          >
            📁 Nueva categoría
          </ActionSheetItem>
        </ActionSheet>
      ) : null}

      {categoryForm ? (
        <CategoryFormSheet
          editing={categoryForm.id ? categoryForm : null}
          onClose={() => setCategoryForm(null)}
        />
      ) : null}

      {filterOpen ? (
        <ActionSheet title="Filtrar por categoría" onClose={() => setFilterOpen(false)}>
          <ActionSheetItem
            active={filter === 'all'}
            onClick={() => {
              setFilter('all')
              setFilterOpen(false)
            }}
          >
            Todas
          </ActionSheetItem>
          {categories.map((category) => (
            <ActionSheetItem
              key={category.id}
              active={filter === category.id}
              onClick={() => {
                setFilter(category.id)
                setFilterOpen(false)
              }}
            >
              {category.emoji} {category.short}
            </ActionSheetItem>
          ))}
        </ActionSheet>
      ) : null}

      {categoryMenu ? (
        <ActionSheet title={categoryMenu.name} onClose={() => setCategoryMenu(null)}>
          <ActionSheetItem
            centered
            onClick={() => {
              setCategoryForm(categoryMenu)
              setCategoryMenu(null)
            }}
          >
            Editar categoría
          </ActionSheetItem>
          <ActionSheetItem
            destructive
            onClick={() => {
              const group = categoryMenu
              setCategoryMenu(null)
              deleteCategory(group, confirm)
            }}
          >
            Eliminar
          </ActionSheetItem>
        </ActionSheet>
      ) : null}
      {confirmDialog}
    </div>
  )
}
