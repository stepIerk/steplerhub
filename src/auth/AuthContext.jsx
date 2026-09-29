import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './context.js'
import { isConfigured, supabase } from '../lib/supabase.js'

const AUTH_ERRORS = {
  'Invalid login credentials': 'Неверный email или пароль',
  'Email not confirmed': 'Email не подтверждён. Подтвердите пользователя в Dashboard → Authentication',
  'User not found': 'Пользователь не найден',
}

function friendlyError(message) {
  if (!message) return 'Не удалось войти'
  return AUTH_ERRORS[message] || message
}

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, student_id')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) {
    // Запасной путь: триггер мог не сработать для старых пользователей
    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId, role: 'student' })
      .select('id, email, role, student_id')
      .single()
    if (insertError) throw insertError
    return created
  }
  return data
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(() => isConfigured)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    setProfileLoading(true)
    setProfileError('')
    try {
      setProfile(await fetchProfile(userId))
    } catch (err) {
      setProfile(null)
      setProfileError(err.message || 'Не удалось загрузить профиль')
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isConfigured) return
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session || null)
      setAuthLoading(false)
      loadProfile(data.session?.user?.id)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted) return
      setSession(next || null)
      loadProfile(next?.user?.id)
    })
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const login = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw new Error(friendlyError(error.message))
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      profile,
      role: profile?.role || null,
      authLoading,
      profileLoading,
      profileError,
      login,
      logout,
      refreshProfile: () => loadProfile(session?.user?.id),
    }),
    [session, profile, authLoading, profileLoading, profileError, login, logout, loadProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
