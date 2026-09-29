import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth.js'
import { isConfigured } from '../lib/supabase.js'

function Centered({ children }) {
  return (
    <div className="auth-wrap">
      <div className="card auth-card">{children}</div>
    </div>
  )
}

export function RequireAuth({ children, roles }) {
  const { session, role, authLoading, profileLoading, profileError } = useAuth()

  if (!isConfigured) {
    return (
      <Centered>
        <h1>Нет подключения к Supabase</h1>
        <p className="muted small">
          Создайте файл <code>.env.local</code> по образцу <code>.env.example</code> и укажите{' '}
          <code>VITE_SUPABASE_URL</code> и <code>VITE_SUPABASE_ANON_KEY</code> из настроек проекта
          (Project Settings → API), затем перезапустите dev-сервер.
        </p>
      </Centered>
    )
  }

  if (authLoading || (session && profileLoading && !role)) {
    return (
      <Centered>
        <p className="muted">Загрузка…</p>
      </Centered>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (profileError || !role) {
    return (
      <Centered>
        <h1>Нет доступа</h1>
        <p className="muted small">
          {profileError || 'Профиль пользователя не найден. Попросите преподавателя проверить вашу учётную запись.'}
        </p>
      </Centered>
    )
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to={role === 'student' ? '/student' : '/'} replace />
  }

  return children
}
