import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useAuth } from './context/AuthContext'
import { Agenda } from './pages/Agenda'
import { Auth } from './pages/Auth'
import { Clients } from './pages/Clients'
import { Services } from './pages/Services'
import { Settings } from './pages/Settings'
import { BrandMark } from './components/BrandMark'
import { StandaloneNavGuard } from './components/StandaloneNavGuard'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-pearl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="text-center">
          <div className="mb-3 flex justify-center">
            <BrandMark />
          </div>
          <p className="font-display text-3xl text-ink">Blessing</p>
          <p className="mt-1 text-sm text-muted">Preparando tu agenda…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <StandaloneNavGuard />
      <Routes>
        <Route path="/entrar" element={<Auth />} />
        <Route element={user ? <Layout /> : <Navigate to="/entrar" replace />}>
          <Route path="/" element={<Agenda />} />
          <Route path="/servicios" element={<Services />} />
          <Route path="/clientas" element={<Clients />} />
          <Route path="/ajustes" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? '/' : '/entrar'} replace />} />
      </Routes>
    </>
  )
}
