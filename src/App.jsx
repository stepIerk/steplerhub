import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import { useAuth } from './auth/useAuth.js'
import { RequireAuth } from './auth/RequireAuth.jsx'
import { CloudProvider } from './store/CloudProvider.jsx'
import { useStore } from './store/hooks.js'
import { applyTheme, getTheme } from './lib/theme.js'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Program from './pages/Program.jsx'
import LessonView from './pages/LessonView.jsx'
import LessonEditor from './pages/LessonEditor.jsx'
import Students from './pages/Students.jsx'
import StudentDetail from './pages/StudentDetail.jsx'
import Sessions from './pages/Sessions.jsx'
import Settings from './pages/Settings.jsx'
import Login from './pages/Login.jsx'
import StudentHome from './pages/StudentHome.jsx'

function SyncBanner() {
  const { cloudError, loadError, loading, reload } = useStore()
  if (loading) return null
  if (loadError) {
    return (
      <div className="notice notice-error" role="alert">
        <span>Не удалось загрузить данные: {loadError}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>
          Повторить
        </button>
      </div>
    )
  }
  if (cloudError) {
    return (
      <div className="notice notice-error" role="alert">
        <span>{cloudError} Локальные изменения показаны, но не сохранены в облаке.</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>
          Обновить
        </button>
      </div>
    )
  }
  return null
}

function TeacherRoutes() {
  const { loading } = useStore()
  if (loading) {
    return (
      <div className="page">
        <p className="muted">Загрузка данных…</p>
      </div>
    )
  }
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/program" element={<Program />} />
      <Route path="/lessons/new" element={<LessonEditor />} />
      <Route path="/lessons/:id" element={<LessonView />} />
      <Route path="/lessons/:id/edit" element={<LessonEditor />} />
      <Route path="/students" element={<Students />} />
      <Route path="/students/:id" element={<StudentDetail />} />
      <Route path="/sessions" element={<Sessions />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function TeacherApp() {
  const { user } = useAuth()
  return (
    <CloudProvider ownerId={user.id}>
      <Layout>
        <div className="page">
          <SyncBanner />
        </div>
        <TeacherRoutes />
      </Layout>
    </CloudProvider>
  )
}

function TeacherGate() {
  return (
    <RequireAuth roles={['teacher']}>
      <TeacherApp />
    </RequireAuth>
  )
}

export default function App() {
  useEffect(() => {
    applyTheme(getTheme())
  }, [])

  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/student"
            element={
              <RequireAuth roles={['student']}>
                <StudentHome />
              </RequireAuth>
            }
          />
          <Route path="/*" element={<TeacherGate />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
