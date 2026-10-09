import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { Button, Field, TextInput } from '../components/ui'
import { mapAuthError, useAuth } from '../context/AuthContext'

export function Auth() {
  const { user, loading, login, register, loginWithGoogle, authError, setAuthError } = useAuth()
  const [mode, setMode] = useState('login')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    businessName: '',
    email: '',
    password: '',
    confirm: '',
  })

  if (!loading && user) return <Navigate to="/" replace />

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setAuthError('')
    try {
      if (mode === 'register') {
        if (form.password !== form.confirm) {
          setAuthError('Las contraseñas no coinciden.')
          return
        }
        await register({
          email: form.email.trim(),
          password: form.password,
          businessName: form.businessName.trim() || 'Mi Estudio',
        })
      } else {
        await login(form.email.trim(), form.password)
      }
    } catch (error) {
      setAuthError(mapAuthError(error))
    } finally {
      setBusy(false)
    }
  }

  async function onGoogle() {
    setBusy(true)
    try {
      await loginWithGoogle()
    } catch (error) {
      setAuthError(mapAuthError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-[linear-gradient(180deg,#faf7f5_0%,#f4d4d6_42%,#f3e6dc_100%)] px-5 pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-1 flex-col justify-center pt-[max(2rem,env(safe-area-inset-top))] pb-8">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <BrandMark size={72} />
          </div>
          <p className="text-[11px] font-semibold tracking-[0.28em] text-gold uppercase">
            Estudio de uñas
          </p>
          <h1 className="font-display mt-1 text-5xl text-ink">Blessing</h1>
          <p className="mt-2 text-sm text-muted">Agenda, clientas y recordatorios en un toque.</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_16px_40px_rgba(61,43,36,0.08)] backdrop-blur"
        >
          <div className="mb-2 grid grid-cols-2 rounded-2xl bg-nude/70 p-1">
            {[
              { id: 'login', label: 'Entrar' },
              { id: 'register', label: 'Crear cuenta' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setMode(item.id)
                  setAuthError('')
                }}
                className={`h-11 rounded-xl text-sm font-medium ${
                  mode === item.id ? 'bg-white text-ink shadow-sm' : 'text-muted'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {mode === 'register' ? (
            <Field label="Nombre del estudio">
              <TextInput
                value={form.businessName}
                onChange={(e) => update('businessName', e.target.value)}
                placeholder="Blessing Nails"
                autoComplete="organization"
              />
            </Field>
          ) : null}

          <Field label="Correo">
            <TextInput
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="estudio@correo.com"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Contraseña">
            <TextInput
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </Field>
          {mode === 'register' ? (
            <Field label="Confirmar contraseña">
              <TextInput
                type="password"
                value={form.confirm}
                onChange={(e) => update('confirm', e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </Field>
          ) : null}

          {authError ? (
            <p className="rounded-2xl bg-blush/80 px-3 py-2 text-sm text-rose-deep">{authError}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear mi estudio'}
          </Button>

          <div className="flex items-center gap-3 py-1 text-xs text-muted">
            <span className="h-px flex-1 bg-sand" />
            o continúa con
            <span className="h-px flex-1 bg-sand" />
          </div>

          <Button variant="ghost" className="w-full" onClick={onGoogle} disabled={busy}>
            <GoogleMark />
            Google
          </Button>
        </form>
      </div>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5Z" />
      <path fill="#FF3D00" d="M6.3 14.7 12.9 19.6C14.7 15.1 18.9 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7Z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44Z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.6-6.1 7.2l6.2 5.2C38.4 37.7 44 33 44 24c0-1.3-.1-2.7-.4-3.5Z" />
    </svg>
  )
}
