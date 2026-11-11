import { useEffect, useState } from 'react'
import { AlertCircle, Bell, BellRing, Check, Clock, RefreshCw } from 'lucide-react'
import { Switch } from '../ui'
import { TimeWheelSheet } from '../agenda/TimeWheelSheet'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
  sendTestNotification,
  watchNotificationPermission,
} from '../../lib/notifications'

const NOTIFICATION_HOURS = Array.from({ length: 18 }, (_, index) =>
  String(6 + index).padStart(2, '0'),
)

function formatTime12h(timeStr) {
  if (!timeStr) return '12:00 PM'
  const [h, m] = String(timeStr).split(':')
  const hour = parseInt(h, 10)
  if (isNaN(hour)) return timeStr
  const period = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  const minute = m ? m.padStart(2, '0') : '00'
  return `${String(h12).padStart(2, '0')}:${minute} ${period}`
}

export function NotificationSettings() {
  const { profile, updateBusiness } = useAuth()
  const { showToast } = useToast()

  const rawNotifications = profile?.notifications || DEFAULT_NOTIFICATION_SETTINGS
  const [enabled, setEnabled] = useState(Boolean(rawNotifications.enabled))
  const [firstTime, setFirstTime] = useState(rawNotifications.reminderTimes?.[0] || '13:00')
  const [hasSecond, setHasSecond] = useState(Boolean(rawNotifications.reminderTimes?.[1]))
  const [secondTime, setSecondTime] = useState(rawNotifications.reminderTimes?.[1] || '17:00')
  const [permission, setPermission] = useState('default')
  const [testing, setTesting] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [timePicker, setTimePicker] = useState(null) // 'first' | 'second' | null

  // Sincronizar estado cuando el perfil de Firestore cambie
  useEffect(() => {
    if (profile?.notifications) {
      setEnabled(Boolean(profile.notifications.enabled))
      setFirstTime(profile.notifications.reminderTimes?.[0] || '13:00')
      setHasSecond(Boolean(profile.notifications.reminderTimes?.[1]))
      setSecondTime(profile.notifications.reminderTimes?.[1] || '17:00')
    }
  }, [profile?.notifications])

  // Escuchar permisos en vivo
  useEffect(() => {
    setPermission(getNotificationPermission())
    const unsubscribe = watchNotificationPermission((newPerm) => {
      setPermission(newPerm)
    })
    return unsubscribe
  }, [])

  async function persistSettings(newValues = {}) {
    const nextEnabled = newValues.enabled !== undefined ? newValues.enabled : enabled
    const nextFirst = newValues.firstTime !== undefined ? newValues.firstTime : firstTime
    const nextHasSecond = newValues.hasSecond !== undefined ? newValues.hasSecond : hasSecond
    const nextSecond = newValues.secondTime !== undefined ? newValues.secondTime : secondTime

    const reminderTimes = nextHasSecond && nextSecond ? [nextFirst, nextSecond] : [nextFirst]
    const existingTokens = profile?.notifications?.fcmTokens || []

    const payload = {
      notifications: {
        enabled: nextEnabled,
        reminderTimes,
        fcmTokens: existingTokens,
      },
    }

    try {
      await updateBusiness(payload)
    } catch (err) {
      console.error('Error al guardar configuración de notificaciones:', err)
      showToast('No se pudo guardar la configuración', 'error')
    }
  }

  async function handleToggleMain(next) {
    setEnabled(next)
    await persistSettings({ enabled: next })
    if (next && permission !== 'granted' && isNotificationSupported()) {
      handleRequestPermission()
    }
  }

  async function handleToggleSecond(next) {
    setHasSecond(next)
    await persistSettings({ hasSecond: next })
  }

  async function handleFirstTimeChange(val) {
    setFirstTime(val)
    await persistSettings({ firstTime: val })
  }

  async function handleSecondTimeChange(val) {
    setSecondTime(val)
    await persistSettings({ secondTime: val })
  }

  async function handleRequestPermission() {
    setRequesting(true)
    try {
      const { status, subscription } = await requestNotificationPermission()
      setPermission(status)

      if (status === 'granted') {
        showToast('✓ Notificaciones activadas')
        if (subscription) {
          const subString = JSON.stringify(subscription)
          const currentTokens = profile?.notifications?.fcmTokens || []
          if (!currentTokens.includes(subString)) {
            const nextTokens = [...currentTokens, subString]
            await updateBusiness({
              notifications: {
                ...(profile?.notifications || DEFAULT_NOTIFICATION_SETTINGS),
                fcmTokens: nextTokens,
              },
            })
          }
        }
      } else if (status === 'denied') {
        showToast('Las notificaciones están bloqueadas en tu navegador', 'error')
      }
    } finally {
      setRequesting(false)
    }
  }

  async function handleTestNotification() {
    if (permission !== 'granted') {
      await handleRequestPermission()
      return
    }

    setTesting(true)
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tiempo de espera agotado al enviar notificación')), 3500),
      )
      await Promise.race([sendTestNotification(), timeoutPromise])
      showToast('✓ Notificación de prueba enviada')
    } catch (err) {
      console.warn('Error al enviar prueba:', err)
      showToast(err.message || 'No se pudo mostrar la notificación', 'error')
    } finally {
      setTesting(false)
    }
  }

  const isGranted = permission === 'granted'
  const isDenied = permission === 'denied'
  const isSupported = isNotificationSupported()

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold tracking-wide text-gold uppercase">Notificaciones</p>
        {isGranted ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-2.5 py-0.5 text-[11px] font-semibold text-[#2e7d32]">
            <Check size={12} strokeWidth={2.8} />
            Notificaciones activas
          </span>
        ) : isDenied ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-deep">
            <AlertCircle size={12} />
            Permiso bloqueado
          </span>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[24px] border border-nude bg-white/80 shadow-[0_8px_24px_rgba(61,43,36,0.04)]">
        {/* Toggle principal estilo iOS */}
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold text-ink">
              Resumen de citas del día siguiente
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              Aviso automático con el conteo de citas agendadas para mañana.
            </p>
          </div>
          <Switch
            checked={enabled}
            onChange={handleToggleMain}
            label="Resumen de citas del día siguiente"
          />
        </div>

        {/* Opciones desplegables cuando está activo */}
        {enabled ? (
          <div className="border-t border-nude/70 bg-[#faf6f2]/50 p-4 space-y-4">
            {/* Horarios de aviso con selector táctil estilo iOS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-medium text-ink">Primer recordatorio</span>
                <button
                  type="button"
                  onClick={() => setTimePicker('first')}
                  className="flex items-center gap-2 rounded-2xl border border-nude/80 bg-white px-3.5 py-2 text-ink shadow-[0_2px_8px_rgba(61,43,36,0.03)] active:scale-[0.97] hover:border-sand transition-all"
                >
                  <Clock size={15} className="text-rose" />
                  <span className="font-semibold text-[15px] tracking-tight text-ink">
                    {formatTime12h(firstTime)}
                  </span>
                </button>
              </div>

              {/* Segundo recordatorio opcional */}
              <div className="space-y-2.5 border-t border-nude/50 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-ink">Segundo recordatorio (opcional)</p>
                    <p className="text-xs text-muted">Aviso vespertino de refuerzo</p>
                  </div>
                  <Switch
                    checked={hasSecond}
                    onChange={handleToggleSecond}
                    label="Segundo recordatorio"
                  />
                </div>

                {hasSecond ? (
                  <div className="flex items-center justify-between gap-3 pl-1 pt-1">
                    <span className="text-xs text-muted">Horario de aviso:</span>
                    <button
                      type="button"
                      onClick={() => setTimePicker('second')}
                      className="flex items-center gap-2 rounded-2xl border border-nude/80 bg-white px-3.5 py-2 text-ink shadow-[0_2px_8px_rgba(61,43,36,0.03)] active:scale-[0.97] hover:border-sand transition-all"
                    >
                      <Clock size={15} className="text-rose" />
                      <span className="font-semibold text-[15px] tracking-tight text-ink">
                        {formatTime12h(secondTime)}
                      </span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Texto explicativo tenue */}
            <p className="text-[12px] leading-relaxed text-muted/80">
              Recibirás una notificación push con el conteo de citas agendadas para el día de mañana a las horas elegidas.
            </p>

            {/* Estado de permisos y acciones */}
            <div className="border-t border-nude/60 pt-3 space-y-2.5">
              {/* Si los permisos están bloqueados en el navegador */}
              {isDenied ? (
                <div className="rounded-2xl border border-rose/30 bg-rose/5 p-3 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-rose-deep">
                    <AlertCircle size={15} />
                    <span>Permisos desactivados en este dispositivo</span>
                  </div>
                  <p className="text-muted leading-relaxed">
                    Para volver a activarlos, pulsa el ícono de ajustes o candado 🔒 junto a la dirección y cambia <strong>Notificaciones</strong> a <strong>Permitir</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const current = getNotificationPermission()
                      setPermission(current)
                      if (current === 'granted') {
                        showToast('✓ Permisos concedidos')
                      } else {
                        showToast('Permiso pendiente de habilitar', 'error')
                      }
                    }}
                    className="inline-flex items-center gap-1.5 font-semibold text-rose hover:underline"
                  >
                    <RefreshCw size={13} />
                    Volver a comprobar permisos
                  </button>
                </div>
              ) : !isGranted ? (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  disabled={requesting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(201,123,132,0.3)] active:scale-[0.98] transition-all"
                >
                  <Bell size={16} />
                  {requesting ? 'Solicitando permiso…' : 'Activar notificaciones en este dispositivo'}
                </button>
              ) : null}

              {/* Botón para probar la notificación */}
              {isGranted ? (
                <button
                  type="button"
                  onClick={handleTestNotification}
                  disabled={testing}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sand/80 bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm active:scale-[0.98] hover:bg-nude/40 transition-all"
                >
                  <BellRing size={16} className="text-rose" />
                  {testing ? 'Enviando prueba…' : 'Probar notificación ahora'}
                </button>
              ) : null}

              {!isSupported ? (
                <p className="text-[11px] text-center text-muted/70">
                  En iOS, instala la app en tu pantalla de inicio para recibir notificaciones.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* Selector modal estilo rueda iOS para los horarios */}
      {timePicker === 'first' ? (
        <TimeWheelSheet
          title="Primer recordatorio"
          value={firstTime}
          hours={NOTIFICATION_HOURS}
          onSelect={(val) => {
            handleFirstTimeChange(val)
            setTimePicker(null)
          }}
          onClose={() => setTimePicker(null)}
        />
      ) : null}

      {timePicker === 'second' ? (
        <TimeWheelSheet
          title="Segundo recordatorio"
          value={secondTime}
          hours={NOTIFICATION_HOURS}
          onSelect={(val) => {
            handleSecondTimeChange(val)
            setTimePicker(null)
          }}
          onClose={() => setTimePicker(null)}
        />
      ) : null}
    </section>
  )
}
