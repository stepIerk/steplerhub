import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, Plus, Search, Trash2 } from 'lucide-react'
import { useStore } from '../store/hooks.js'
import { EmptyState, StatusBadge } from '../components/ui.jsx'

export default function Program() {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [studentId, setStudentId] = useState('')
  const [open, setOpen] = useState({})

  const sorted = useMemo(
    () => [...state.lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [state.lessons],
  )

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const map = new Map()
    for (const lesson of sorted) {
      const matches =
        !q ||
        lesson.title.toLowerCase().includes(q) ||
        (lesson.block || '').toLowerCase().includes(q) ||
        (lesson.markdown || '').toLowerCase().includes(q)
      if (!matches) continue
      const key = lesson.block || 'Без блока'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(lesson)
    }
    return [...map.entries()]
  }, [sorted, query])

  const progressMap = studentId ? state.progress[studentId] || {} : null

  function removeLesson(lesson) {
    if (confirm(`Удалить урок «${lesson.title}»?`)) {
      dispatch({ type: 'lesson/delete', id: lesson.id })
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Программа</h1>
          <p className="muted">{state.lessons.length} уроков, сгруппированных по блокам</p>
        </div>
        <div className="head-actions">
          <Link className="btn btn-primary" to="/lessons/new">
            <Plus size={16} /> Новый урок
          </Link>
        </div>
      </header>

      <section className="card">
        <div className="toolbar">
          <label className="field search grow">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Поиск по программе…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="field select">
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Без ученика</option>
              {state.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!state.lessons.length ? (
          <EmptyState
            title="Программа пуста"
            hint="Добавьте урок — можно загрузить файл .md или написать текст"
            action={
              <Link className="btn btn-primary btn-sm" to="/lessons/new">
                <Plus size={15} /> Создать урок
              </Link>
            }
          />
        ) : !groups.length ? (
          <EmptyState title="Ничего не найдено" hint="Измените запрос" />
        ) : (
          <div className="groups">
            {groups.map(([block, lessons]) => {
              const isOpen = open[block] !== false
              return (
                <div className="group" key={block}>
                  <button
                    type="button"
                    className={`group-head${isOpen ? ' open' : ''}`}
                    onClick={() => setOpen((prev) => ({ ...prev, [block]: !isOpen }))}
                  >
                    <span>{block}</span>
                    <span className="group-meta">
                      {lessons.length} ур.
                      <ChevronDown size={16} />
                    </span>
                  </button>
                  {isOpen && (
                    <ul className="lesson-list">
                      {lessons.map((lesson) => {
                        const status = progressMap?.[lesson.id]?.status
                        return (
                          <li className="lesson-row" key={lesson.id}>
                            <Link className="lesson-main" to={`/lessons/${lesson.id}`}>
                              <span className="lesson-index">{lesson.order}</span>
                              <span className="lesson-body">
                                <span className="row-title">{lesson.title}</span>
                                <span className="muted small">
                                  {lesson.grade || '—'}
                                  {lesson.tags?.length ? ` · ${lesson.tags.join(', ')}` : ''}
                                </span>
                              </span>
                            </Link>
                            {progressMap && <StatusBadge status={status || 'todo'} />}
                            <div className="row-actions">
                              <button
                                type="button"
                                className="icon-btn"
                                title="Редактировать"
                                onClick={() => navigate(`/lessons/${lesson.id}/edit`)}
                              >
                                ✎
                              </button>
                              <button
                                type="button"
                                className="icon-btn danger"
                                title="Удалить"
                                onClick={() => removeLesson(lesson)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
