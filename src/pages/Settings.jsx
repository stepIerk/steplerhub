import { useRef, useState } from 'react'
import {
  CloudUpload,
  Database,
  Download,
  LogOut,
  Palette,
  RotateCcw,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import { useAuth } from '../auth/useAuth.js'
import { useStore } from '../store/hooks.js'
import { exportState, parseStateFile, STORAGE_KEY } from '../store/storage.js'
import { clearLocalBackup, migrateLocalToCloud, readLocalBackup } from '../store/remote.js'
import { getTheme, setTheme } from '../lib/theme.js'
import { readMarkdownFile } from '../lib/markdown.js'

const THEMES = [
  { value: 'auto', label: 'Системная' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
]

function localBackupInfo() {
  const backup = readLocalBackup()
  if (!backup) return null
  const lessons = backup.lessons?.length || 0
  const students = backup.students?.length || 0
  const sessions = backup.sessions?.length || 0
  if (!lessons && !students && !sessions) return null
  return { lessons, students, sessions }
}

export default function Settings() {
  const { state, dispatch, reload } = useStore()
  const { user, profile, logout } = useAuth()
  const importRef = useRef(null)
  const [theme, setThemeState] = useState(getTheme())
  const [message, setMessage] = useState('')
  const [backup, setBackup] = useState(localBackupInfo)
  const [busy, setBusy] = useState(false)

  function changeTheme(value) {
    setTheme(value)
    setThemeState(value)
  }

  async function handleMigrate() {
    if (!backup) return
    const ok = confirm(
      `Перенести локальные данные в Supabase?\nУроков: ${backup.lessons}, учеников: ${backup.students}, занятий: ${backup.sessions}.\n\nЛокальная копия после переноса будет удалена (бэкап можно сделать кнопкой «Экспорт JSON»).`,
    )
    if (!ok) return
    setBusy(true)
    try {
      const counts = await migrateLocalToCloud(user.id)
      clearLocalBackup()
      setBackup(null)
      await reload()
      setMessage(
        `Перенесено: уроков — ${counts.lessons}, учеников — ${counts.students}, занятий — ${counts.sessions}`,
      )
    } catch (err) {
      setMessage(`Ошибка переноса: ${err.message || 'не удалось записать в Supabase'}`)
    } finally {
      setBusy(false)
    }
  }

  function handleImport(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    readMarkdownFile(file)
      .then((text) => {
        const next = parseStateFile(text)
        const ok = confirm(
          `Загрузить данные из файла в Supabase?\nУроков: ${next.lessons.length}, учеников: ${next.students.length}, занятий: ${next.sessions.length}.\n\nТекущие облачные данные будут заменены.`,
        )
        if (!ok) return
        dispatch({ type: 'state/import', state: next })
        setMessage('Данные импортированы в Supabase')
      })
      .catch((err) => setMessage(`Ошибка: ${err.message || 'не удалось прочитать файл'}`))
  }

  function handleReset() {
    if (!confirm('Вернуть демо-данные? Текущие облачные уроки и записи будут заменены.')) return
    dispatch({ type: 'state/reset' })
    setMessage('Возвращены демо-данные')
  }

  function handleClear() {
    if (!confirm('Удалить ВСЕ облачные данные: уроки, учеников, прогресс и журнал?')) return
    dispatch({ type: 'state/clear' })
    setMessage('Все данные удалены')
  }

  const size = (() => {
    try {
      return (new Blob([localStorage.getItem(STORAGE_KEY) || '']).size / 1024).toFixed(1)
    } catch {
      return '0'
    }
  })()

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Настройки</h1>
          <p className="muted">Аккаунт, оформление, бэкапы и управление данными</p>
        </div>
      </header>

      {message && (
        <div className="notice" role="status">
          {message}
          <button type="button" className="icon-btn" onClick={() => setMessage('')}>
            ✕
          </button>
        </div>
      )}

      <section className="card">
        <div className="card-head">
          <h2>
            <User size={17} /> Аккаунт
          </h2>
        </div>
        <p className="small">
          {user?.email || profile?.email || '—'}
          <span className="muted"> · роль: {profile?.role === 'teacher' ? 'преподаватель' : 'ученик'}</span>
        </p>
        <div className="head-actions wrap" style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            <LogOut size={16} /> Выйти
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>
            <Palette size={17} /> Тема оформления
          </h2>
        </div>
        <div className="segmented">
          {THEMES.map((item) => (
            <button
              key={item.value}
              type="button"
              className={theme === item.value ? 'active' : ''}
              onClick={() => changeTheme(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="muted small" style={{ marginTop: 8 }}>
          Тема хранится на этом устройстве.
        </p>
      </section>

      {backup && (
        <section className="card">
          <div className="card-head">
            <h2>
              <CloudUpload size={17} /> Локальные данные
            </h2>
          </div>
          <p className="muted small">
            В этом браузере найдены данные старой версии (уроков: {backup.lessons}, учеников:{' '}
            {backup.students}, занятий: {backup.sessions}). Перенесите их в Supabase одной кнопкой.
          </p>
          <div className="head-actions wrap" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={handleMigrate}
            >
              <CloudUpload size={16} /> {busy ? 'Переносим…' : 'Перенести в Supabase'}
            </button>
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h2>
            <Download size={17} /> Бэкап данных
          </h2>
        </div>
        <p className="muted small">
          Данные хранятся в Supabase и доступны с любого устройства после входа. Старая локальная
          копия в браузере: {size} КБ. Периодически выгружайте JSON-файл на всякий случай.
        </p>
        <div className="stat-chips" style={{ marginTop: 10 }}>
          <span className="chip">{state.lessons.length} уроков</span>
          <span className="chip">{state.students.length} учеников</span>
          <span className="chip">{state.sessions.length} занятий</span>
        </div>
        <div className="head-actions wrap" style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-primary" onClick={() => exportState(state)}>
            <Download size={16} /> Экспорт JSON
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => importRef.current?.click()}>
            <Upload size={16} /> Импорт JSON
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={handleImport}
          />
        </div>
      </section>

      <section className="card danger-zone">
        <div className="card-head">
          <h2>
            <Database size={17} /> Опасная зона
          </h2>
        </div>
        <div className="head-actions wrap">
          <button type="button" className="btn btn-ghost" onClick={handleReset}>
            <RotateCcw size={16} /> Демо-данные
          </button>
          <button type="button" className="btn btn-danger" onClick={handleClear}>
            <Trash2 size={16} /> Удалить всё
          </button>
        </div>
      </section>
    </div>
  )
}
