import { useState } from 'react'
import { addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { Sheet } from '../Sheet'
import { Button, Field, TextInput } from '../ui'
import { useCategories } from '../../hooks/useCategories'
import { userCol } from '../../hooks/useCollection'
import { db } from '../../firebase'
import { requireAuthUid, SESSION_EXPIRED_MESSAGE } from '../../lib/authGuard'
import { EMOJI_PRESETS } from '../../lib/categories'

export function CategoryFormSheet({ editing = null, onClose }) {
  const { categories } = useCategories()
  const [form, setForm] = useState({
    name: editing?.name || '',
    emoji: editing?.emoji || '✨',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      emoji: String(form.emoji || '✨').trim() || '✨',
      short: form.name.trim().split('/')[0].trim(),
    }
    try {
      if (editing) {
        await updateDoc(doc(db, 'users', uid, 'categories', editing.id), payload)
      } else {
        await addDoc(userCol(uid, 'categories'), {
          ...payload,
          order: categories.length,
          createdAt: serverTimestamp(),
        })
      }
      onClose()
    } catch (err) {
      setError(err.message || 'No se pudo guardar la categoría.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      nested
      title={editing ? 'Editar categoría' : 'Nueva categoría'}
      onClose={onClose}
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
        <Field label="Nombre">
          <TextInput
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Manos / Gelish"
          />
        </Field>
        <Field label="Emoji (opcional)">
          <TextInput
            value={form.emoji}
            maxLength={4}
            onChange={(event) => setForm((prev) => ({ ...prev, emoji: event.target.value }))}
            placeholder="💅"
          />
        </Field>
        <div className="flex flex-wrap gap-2 px-1">
          {EMOJI_PRESETS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, emoji }))}
              className={`grid h-11 w-11 place-items-center rounded-2xl text-xl ${
                form.emoji === emoji ? 'bg-ink text-white' : 'bg-nude'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  )
}

export async function deleteCategory(category, confirm) {
  const uid = requireAuthUid()
  if (!uid) return false
  const accepted = await confirm({
    title: '¿Eliminar categoría?',
    message: `Se quitará “${category.name}”. Los servicios que la usaban quedarán sin esta etiqueta.`,
    confirmLabel: 'Eliminar',
    destructive: true,
  })
  if (!accepted) return false
  await deleteDoc(doc(db, 'users', uid, 'categories', category.id))
  return true
}
