import { useState } from 'react'
import { addDoc, serverTimestamp } from 'firebase/firestore'
import { InsetModal } from '../InsetModal'
import { InstagramField } from '../InstagramField'
import { PhoneField } from '../PhoneField'
import { Button, Field, TextInput } from '../ui'
import { userCol } from '../../hooks/useCollection'
import { requireAuthUid, SESSION_EXPIRED_MESSAGE } from '../../lib/authGuard'
import { cleanInstagram } from '../../lib/instagram'
import { isValidLocalPhone, toStoredPhone } from '../../lib/phone'

export function QuickClientSheet({ onCreated, onClose }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isValidPhone = !phone || isValidLocalPhone(phone)
  const canSave = Boolean(name.trim()) && isValidPhone

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
      phone: phone ? toStoredPhone(phone) : '',
      instagram: cleanInstagram(instagram),
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
      <div className="space-y-3.5">
        {error ? (
          <p className="rounded-2xl bg-blush/80 px-3 py-2 text-sm text-rose-deep">{error}</p>
        ) : null}
        <div className="space-y-1.5">
          <label className="block px-1 text-[11px] font-semibold tracking-wide text-muted uppercase">
            NOMBRE
          </label>
          <TextInput
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre de la clienta"
          />
        </div>
        <PhoneField
          value={phone}
          onChange={setPhone}
          label="TELÉFONO (OPCIONAL)"
        />
        <InstagramField
          value={instagram}
          onChange={setInstagram}
          label="INSTAGRAM (OPCIONAL)"
        />
      </div>
    </InsetModal>
  )
}
