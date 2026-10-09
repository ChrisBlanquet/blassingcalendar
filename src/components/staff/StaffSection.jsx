import { useState } from 'react'
import { addDoc, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { Button, Field, TextInput } from '../ui'
import { Sheet } from '../Sheet'
import { useAuth } from '../../context/AuthContext'
import { useStaff } from '../../hooks/useStaff'
import { userCol } from '../../hooks/useCollection'
import { db } from '../../firebase'
import { useConfirm } from '../../hooks/useConfirm.jsx'
import { requireAuthUid, SESSION_EXPIRED_MESSAGE } from '../../lib/authGuard'
import { isOwnerStaff, nextStaffColor, OWNER_STAFF_ID, STAFF_COLORS } from '../../lib/staff'
import { StaffDot } from './StaffBadge'

const emptyMember = { name: '', color: STAFF_COLORS[1] }

export function StaffSection() {
  const { user, profile } = useAuth()
  const { staff, loading } = useStaff()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyMember)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirm, confirmDialog] = useConfirm()

  function openNew() {
    setEditing(null)
    setForm({ name: '', color: nextStaffColor(staff) })
    setError('')
    setOpen(true)
  }

  function openEdit(member) {
    setEditing(member)
    setForm({ name: member.name || '', color: member.color || STAFF_COLORS[0] })
    setError('')
    setOpen(true)
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
      color: form.color || STAFF_COLORS[0],
    }
    try {
      if (editing) {
        await updateDoc(doc(db, 'users', uid, 'staff', editing.id), payload)
      } else {
        await addDoc(userCol(uid, 'staff'), {
          ...payload,
          role: 'staff',
          createdAt: serverTimestamp(),
        })
      }
      setOpen(false)
    } catch (err) {
      setError(err.message || 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(member) {
    if (isOwnerStaff(member)) return
    const uid = requireAuthUid()
    if (!uid) {
      setError(SESSION_EXPIRED_MESSAGE)
      return
    }
    const accepted = await confirm({
      title: '¿Eliminar del equipo?',
      message: `Se quitará a “${member.name}” del equipo. Las citas ya asignadas conservarán su nombre.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    })
    if (!accepted) return
    await deleteDoc(doc(db, 'users', uid, 'staff', member.id))
  }

  async function restoreOwner() {
    if (!user) return
    await setDoc(
      doc(db, 'users', user.uid, 'staff', OWNER_STAFF_ID),
      {
        name: profile?.ownerName || 'Dueña',
        color: STAFF_COLORS[0],
        role: 'owner',
        createdAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  return (
    <section className="space-y-3 rounded-[24px] border border-nude bg-white/80 p-4 shadow-[0_8px_24px_rgba(61,43,36,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-gold uppercase">Equipo / Empleadas</p>
          <p className="mt-1 text-sm text-muted">Colaboradoras y el color de su agenda.</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blush text-rose"
          aria-label="Agregar empleada"
        >
          <Plus size={18} />
        </button>
      </div>

      {loading ? <p className="py-4 text-center text-sm text-muted">Cargando equipo…</p> : null}

      {!loading && staff.length === 0 ? (
        <button
          type="button"
          onClick={restoreOwner}
          className="flex w-full items-center gap-3 rounded-2xl bg-nude/70 px-3 py-3 text-left"
        >
          <Users size={18} className="text-muted" />
          <span className="text-sm text-muted">Crear perfil de la dueña</span>
        </button>
      ) : (
        <ul className="space-y-2">
          {staff.map((member) => (
            <li key={member.id} className="flex items-center gap-3 rounded-[18px] bg-nude/45 px-3 py-2.5">
              <StaffDot color={member.color} name={member.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{member.name}</p>
                <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                  {isOwnerStaff(member) ? 'Dueña / administradora' : 'Colaboradora'}
                </p>
              </div>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink"
                onClick={() => openEdit(member)}
                aria-label="Editar"
              >
                <Pencil size={15} />
              </button>
              {isOwnerStaff(member) ? null : (
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full bg-blush/70 text-rose-deep"
                  onClick={() => remove(member)}
                  aria-label="Eliminar"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <Sheet
          nested
          title={editing ? (isOwnerStaff(editing) ? 'Editar dueña' : 'Editar colaboradora') : 'Nueva empleada'}
          onClose={() => setOpen(false)}
          footer={
            <Button className="w-full" onClick={save} disabled={saving || !form.name.trim()}>
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
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={editing && isOwnerStaff(editing) ? 'Dueña' : 'Nombre de la colaboradora'}
              />
            </Field>
            <div className="space-y-1.5">
              <p className="px-1 text-sm font-medium text-muted">Color de agenda</p>
              <div className="flex flex-wrap gap-2.5 px-1">
                {STAFF_COLORS.map((color) => {
                  const active = form.color === color
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, color }))}
                      className={`h-10 w-10 rounded-full ${active ? 'ring-2 ring-ink ring-offset-2' : ''}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Color ${color}`}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </Sheet>
      ) : null}
      {confirmDialog}
    </section>
  )
}
