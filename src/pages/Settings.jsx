import { useRef, useState } from 'react'
import { Database, Download, Palette, RotateCcw, Trash2, Upload } from 'lucide-react'
import { useStore } from '../store/hooks.js'
import { exportState, parseStateFile, STORAGE_KEY } from '../store/storage.js'
import { readMarkdownFile } from '../lib/markdown.js'

const THEMES = [
  { value: 'auto', label: 'Системная' },
  { value: 'light', label: 'Светлая' },
  { value: 'dark', label: 'Тёмная' },
]

export default function Settings() {
  const { state, dispatch } = useStore()
  const importRef = useRef(null)
  const [message, setMessage] = useState('')

  function handleImport(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    readMarkdownFile(file)
      .then((text) => {
        const next = parseStateFile(text)
        const ok = confirm(
          `Загрузить данные из файла?\nУроков: ${next.lessons.length}, учеников: ${next.students.length}, занятий: ${next.sessions.length}.\n\nТекущие данные будут заменены.`,
        )
        if (!ok) return
        dispatch({ type: 'state/import', state: next })
        setMessage('Данные импортированы')
      })
      .catch((err) => setMessage(`Ошибка: ${err.message || 'не удалось прочитать файл'}`))
  }

  function handleReset() {
    if (!confirm('Вернуть демо-данные? Текущие уроки и записи будут заменены.')) return
    dispatch({ type: 'state/reset' })
    setMessage('Возвращены демо-данные')
  }

  function handleClear() {
    if (!confirm('Удалить ВСЕ данные: уроки, учеников, прогресс и журнал?')) return
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
          <p className="muted">Оформление, бэкапы и управление данными</p>
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
            <Palette size={17} /> Тема оформления
          </h2>
        </div>
        <div className="segmented">
          {THEMES.map((theme) => (
            <button
              key={theme.value}
              type="button"
              className={state.settings.theme === theme.value ? 'active' : ''}
              onClick={() => dispatch({ type: 'settings/patch', patch: { theme: theme.value } })}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>
            <Download size={17} /> Бэкап данных
          </h2>
        </div>
        <p className="muted small">
          Данные хранятся в этом браузере ({size} КБ). Выгружайте файл периодически — так вы
          сможете перенести работу на другое устройство или восстановить после очистки истории.
        </p>
        <div className="stat-chips">
          <span className="chip">{state.lessons.length} уроков</span>
          <span className="chip">{state.students.length} учеников</span>
          <span className="chip">{state.sessions.length} занятий</span>
        </div>
        <div className="head-actions wrap">
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
