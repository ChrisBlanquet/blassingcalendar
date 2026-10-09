import { useEffect, useState } from 'react'
import { addDoc, serverTimestamp } from 'firebase/firestore'
import { InsetModal } from '../InsetModal'
import { CategoryField } from '../CategoryChips'
import { Button, Field, TextInput } from '../ui'
import { userCol } from '../../hooks/useCollection'
import { useCategories } from '../../hooks/useCategories'
import { requireAuthUid, SESSION_EXPIRED_MESSAGE } from '../../lib/authGuard'
import { toNumber } from '../../lib/money'
import {
  defaultCategoryForKind,
  SERVICE_KIND,
  serviceKind,
} from '../../lib/services'

export function QuickServiceSheet({ defaultKind = SERVICE_KIND.principal, onCreated, onClose }) {
  const { categories } = useCategories()
  const [form, setForm] = useState({
    name: '',
    price: '',
    duration: defaultKind === SERVICE_KIND.addon ? 15 : 60,
    kind: defaultKind,
    category: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      category: prev.category && categories.some((item) => item.id === prev.category)
        ? prev.category
        : defaultCategoryForKind(prev.kind, categories),
    }))
  }, [categories])

  function setKind(kind) {
    setForm((prev) => ({
      ...prev,
      kind,
      category:
        prev.category === defaultCategoryForKind(prev.kind, categories)
          ? defaultCategoryForKind(kind, categories)
          : prev.category,
      duration: prev.duration || (kind === SERVICE_KIND.addon ? 15 : 60),
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
      duration: toNumber(form.duration) || (form.kind === SERVICE_KIND.addon ? 15 : 60),
      kind: serviceKind(form),
      category: form.category || defaultCategoryForKind(form.kind, categories),
    }
    try {
      const created = await addDoc(userCol(uid, 'services'), {
        ...payload,
        createdAt: serverTimestamp(),
      })
      onCreated?.({ id: created.id, ...payload })
      onClose()
    } catch (err) {
      setError(err.message || 'No se pudo guardar el servicio.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <InsetModal
      title="Nuevo servicio"
      onClose={onClose}
      nested="deep"
      footer={
        <Button className="w-full" onClick={save} disabled={saving || !form.name.trim()}>
          {saving ? 'Guardando…' : 'Guardar y seleccionar'}
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
              { id: SERVICE_KIND.principal, label: 'Principal' },
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
            autoFocus
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder={serviceKind(form) === SERVICE_KIND.addon ? 'Efecto cromo' : 'Gelish'}
          />
        </Field>
        <CategoryField
          value={form.category}
          onChange={(category) => setForm((prev) => ({ ...prev, category }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duración (min)">
            <TextInput
              type="number"
              inputMode="numeric"
              min="1"
              value={form.duration}
              onChange={(event) => setForm((prev) => ({ ...prev, duration: event.target.value }))}
            />
          </Field>
          <Field label="Precio ($)">
            <TextInput
              type="number"
              inputMode="decimal"
              min="0"
              value={form.price}
              onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              placeholder="350"
            />
          </Field>
        </div>
      </div>
    </InsetModal>
  )
}
