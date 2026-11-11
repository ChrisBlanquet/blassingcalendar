import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { NotificationSettings } from '../components/settings/NotificationSettings'
import { StaffSection } from '../components/staff/StaffSection'
import { Button, Field, TextArea, TextInput } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { requireAuthUid, SESSION_EXPIRED_MESSAGE } from '../lib/authGuard'
import { DEFAULT_WHATSAPP_TEMPLATE, sanitizeWhatsAppTemplate } from '../lib/whatsapp'

export function Settings() {
  const { profile, updateBusiness, logout, user } = useAuth()
  const [businessName, setBusinessName] = useState(profile?.businessName || '')
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    sanitizeWhatsAppTemplate(profile?.whatsappTemplate),
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setBusinessName(profile?.businessName || '')
    setWhatsappTemplate(sanitizeWhatsAppTemplate(profile?.whatsappTemplate))
  }, [profile])

  const [error, setError] = useState('')

  async function save() {
    if (!requireAuthUid()) {
      setError(SESSION_EXPIRED_MESSAGE)
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateBusiness({
        businessName: businessName.trim() || 'Mi Estudio',
        whatsappTemplate: sanitizeWhatsAppTemplate(whatsappTemplate),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
    } catch (err) {
      setError(err.message || 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 px-5 pt-4">
      <section className="rounded-[24px] border border-nude bg-white/80 p-4 shadow-[0_8px_24px_rgba(61,43,36,0.04)]">
        <p className="text-xs font-semibold tracking-wide text-gold uppercase">Cuenta</p>
        <p className="mt-1 text-sm text-muted">{user?.email}</p>
      </section>

      {error ? (
        <p className="rounded-2xl bg-blush/80 px-3 py-2 text-sm text-rose-deep">{error}</p>
      ) : null}

      <section className="space-y-3 rounded-[24px] border border-nude bg-white/80 p-4 shadow-[0_8px_24px_rgba(61,43,36,0.04)]">
        <Field label="Nombre del estudio">
          <TextInput
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Blessing Nails"
          />
        </Field>
        <Field
          label="Plantilla de WhatsApp"
          hint="Placeholders: {cliente} {servicio} {fecha} {hora} {saldo}"
        >
          <TextArea
            value={whatsappTemplate}
            onChange={(e) => setWhatsappTemplate(e.target.value)}
            rows={8}
          />
        </Field>
        <Button className="w-full" onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : saved ? 'Cambios guardados' : 'Guardar configuración'}
        </Button>
      </section>

      <NotificationSettings />

      <StaffSection />

      <Button variant="danger" className="w-full" onClick={logout}>
        <LogOut size={18} />
        Cerrar sesión
      </Button>
    </div>
  )
}
