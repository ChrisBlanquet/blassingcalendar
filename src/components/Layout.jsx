import { CalendarDays, Scissors, Settings, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const tabs = [
  { to: '/', label: 'Agenda', icon: CalendarDays, end: true },
  { to: '/servicios', label: 'Servicios', icon: Scissors },
  { to: '/clientas', label: 'Clientas', icon: Users },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
]

export function Layout() {
  const { profile, authError } = useAuth()

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-pearl">
      <header className="sticky top-0 z-20 border-b border-nude/80 bg-pearl/90 px-5 pt-[max(12px,env(safe-area-inset-top))] pb-3 backdrop-blur-md">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-gold uppercase">Estudio</p>
        <h1 className="font-display text-[34px] leading-none text-ink">
          {profile?.businessName || 'Blessing'}
        </h1>
      </header>

      <main className="flex-1 overflow-x-hidden pb-28">
        {authError ? (
          <p className="mx-5 mt-3 rounded-2xl bg-blush/80 px-3 py-2 text-sm text-rose-deep">{authError}</p>
        ) : null}
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-nude/80 bg-pearl/95 px-3 pt-2 pb-[max(16px,calc(env(safe-area-inset-bottom)+10px))] backdrop-blur-md">
        <div className="grid grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium ${
                    isActive ? 'bg-blush/80 text-rose-deep' : 'text-muted'
                  }`
                }
              >
                <Icon size={22} />
                {tab.label}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
