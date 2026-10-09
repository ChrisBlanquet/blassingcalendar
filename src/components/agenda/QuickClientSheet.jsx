import { useState } from 'react'
import { addDoc, serverTimestamp } from 'firebase/firestore'
import { InsetModal } from '../InsetModal'
import { PhoneField } from '../PhoneField'
import { Button, Field, TextInput } from '../ui'
import { userCol } from '../../hooks/useCollection'
import { requireAuthUid, SESSION_EXPIRED_MESSAGE } from '../../lib/authGuard'
import { isValidLocalPhone, toStoredPhone } from '../../lib/phone'

export function QuickClientSheet({ onCreated, onClose }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const canSave = name.trim() && isValidLocalPhone(phone)

  async function save() {
    if (!canSave) return
    const uid = requireAuthUid()
    if (!uid) {
      setError(SESSION_EXPIRED_MESSAGE)
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      name: name.trim(),
      phone: toStoredPhone(phone),
    }
    try {
      const created = await addDoc(userCol(uid, 'clients'), {
        ...payload,
        createdAt: serverTimestamp(),
      })
      onCreated?.({ id: created.id, ...payload })
      onClose()
    } catch (err) {
      setError(err.message || 'No se pudo guardar la clienta.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <InsetModal
      title="Nueva Clienta"
      onClose={onClose}
      nested="deep"
      footer={
        <Button className="w-full" onClick={save} disabled={saving || !canSave}>
          {saving ? 'Guardando…' : 'Guardar clienta'}
        </Button>
      }
    >
      <div className="space-y-3">
        {error ? (
          <p className="rounded-2xl bg-blush/80 px-3 py-2 text-sm text-rose-deep">{error}</p>
        ) : null}
        <Field label="Nombre">
          <TextInput
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre de la clienta"
          />
        </Field>
        <PhoneField value={phone} onChange={setPhone} />
      </div>
    </InsetModal>
  )
}
