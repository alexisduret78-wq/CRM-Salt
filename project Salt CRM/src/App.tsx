import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/Layout'
import Login from '@/pages/Login'
import Prospection from '@/pages/Prospection'

function LoadingScreen() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
      Chargement…
    </div>
  )
}

export default function App() {
  const { session, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/prospection" replace />} />
        <Route path="/prospection" element={<Prospection />} />
        <Route path="/login" element={<Navigate to="/prospection" replace />} />
        <Route path="*" element={<Navigate to="/prospection" replace />} />
      </Routes>
    </Layout>
  )
}
