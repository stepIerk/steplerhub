import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '../auth/useAuth.js'
import { isConfigured } from '../lib/supabase.js'

export default function Login() {
  const { session, role, authLoading, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!authLoading && session) {
    return <Navigate to={role === 'student' ? '/student' : '/'} replace />
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Не удалось войти')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="brand auth-brand">
          <span className="brand-mark">S</span>
          <span className="brand-name">steptutlib</span>
        </div>
        <h1>Вход</h1>
        <p className="muted small">
          Войдите с email и паролем, выданными преподавателем.
        </p>

        {!isConfigured ? (
          <p className="notice" role="alert">
            Нет подключения к Supabase: заполните `.env.local` по образцу `.env.example`.
          </p>
        ) : (
          <form className="stack" onSubmit={submit}>
            <label className="field">
              <span className="field-label">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Пароль</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-primary" disabled={busy}>
              <LogIn size={16} /> {busy ? 'Входим…' : 'Войти'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
