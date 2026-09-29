import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '../auth/useAuth.js'
import { supabase } from '../lib/supabase.js'

export default function StudentHome() {
  const { user, profile, logout } = useAuth()
  const [studentName, setStudentName] = useState('')

  useEffect(() => {
    if (!profile?.student_id) return
    let mounted = true
    supabase
      .from('students')
      .select('name')
      .eq('id', profile.student_id)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted && data) setStudentName(data.name)
      })
    return () => {
      mounted = false
    }
  }, [profile?.student_id])

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="brand auth-brand">
          <span className="brand-mark">S</span>
          <span className="brand-name">Stepler Hub</span>
        </div>
        <h1>Привет{studentName ? `, ${studentName}` : ''}!</h1>
        <p className="muted small">
          Вы вошли как ученик ({user?.email || profile?.email || '—'}). Личный раздел с программой
          и прогрессом появится здесь позже — пока все материалы выдаёт преподаватель.
        </p>
        <button type="button" className="btn btn-ghost" onClick={logout}>
          <LogOut size={16} /> Выйти
        </button>
      </div>
    </div>
  )
}
