import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../store/hooks.js'
import Markdown from '../components/Markdown.jsx'
import { EmptyState, StatusBadge } from '../components/ui.jsx'

const STATUSES = [
  { value: 'todo', label: 'Не начато' },
  { value: 'in_progress', label: 'В процессе' },
  { value: 'done', label: 'Готово' },
]

function StatusSwitch({ value, onChange }) {
  return (
    <div className="segmented">
      {STATUSES.map((item) => (
        <button
          key={item.value}
          type="button"
          className={(value || 'todo') === item.value ? 'active' : ''}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default function LessonView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useStore()
  const [studentId, setStudentId] = useState('')
  // Данные грузятся асинхронно: если ученик не выбран, берём первого из списка
  const activeStudentId = studentId || state.students[0]?.id || ''

  const lesson = state.lessons.find((l) => l.id === id)

  const note = useMemo(() => {
    if (!lesson || !activeStudentId) return ''
    return state.progress[activeStudentId]?.[lesson.id]?.note || ''
  }, [state.progress, activeStudentId, lesson])

  if (!lesson) {
    return (
      <div className="page">
        <EmptyState
          title="Урок не найден"
          action={
            <Link className="btn btn-primary btn-sm" to="/program">
              К программе
            </Link>
          }
        />
      </div>
    )
  }

  function setStatus(status) {
    if (!activeStudentId) return
    dispatch({ type: 'progress/set', studentId: activeStudentId, lessonId: lesson.id, status })
  }

  function saveNote(event) {
    if (!activeStudentId) return
    dispatch({
      type: 'progress/note',
      studentId: activeStudentId,
      lessonId: lesson.id,
      note: event.target.value,
    })
  }

  function remove() {
    if (confirm(`Удалить урок «${lesson.title}»?`)) {
      dispatch({ type: 'lesson/delete', id: lesson.id })
      navigate('/program')
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <div className="head-left">
          <Link className="icon-btn" to="/program" title="Назад">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="muted small">
              {lesson.block || 'Без блока'}
              {lesson.grade ? ` · ${lesson.grade}` : ''}
            </p>
            <h1>{lesson.title}</h1>
          </div>
        </div>
        <div className="head-actions">
          <Link className="btn btn-ghost" to={`/lessons/${lesson.id}/edit`}>
            <Pencil size={16} /> Редактировать
          </Link>
          <button type="button" className="btn btn-danger-ghost" onClick={remove}>
            <Trash2 size={16} /> Удалить
          </button>
        </div>
      </header>

      <div className="grid-2 grid-wide">
        <article className="card lesson-card">
          <Markdown>{lesson.markdown}</Markdown>
        </article>

        <aside className="stack">
          <section className="card">
            <div className="card-head">
              <h2>
                <BookOpen size={17} /> Прогресс по уроку
              </h2>
            </div>
            {!state.students.length ? (
              <EmptyState
                title="Нет учеников"
                hint="Добавьте ученика, чтобы отмечать прогресс"
                action={
                  <Link className="btn btn-primary btn-sm" to="/students?new=1">
                    Добавить ученика
                  </Link>
                }
              />
            ) : (
              <div className="stack">
                <label className="field select">
                  <select value={activeStudentId} onChange={(e) => setStudentId(e.target.value)}>
                    {state.students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>

                <StatusSwitch
                  value={state.progress[activeStudentId]?.[lesson.id]?.status}
                  onChange={setStatus}
                />

                <label className="field textarea">
                  <span className="field-label">Заметка по ученику</span>
                  <textarea
                    rows={4}
                    value={note}
                    placeholder="Что разобрали, где ученику трудно…"
                    onChange={saveNote}
                  />
                </label>
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Статусы всех учеников</h2>
            </div>
            {state.students.length ? (
              <ul className="list compact">
                {state.students.map((s) => {
                  const status = state.progress[s.id]?.[lesson.id]?.status
                  return (
                    <li className="list-row static" key={s.id}>
                      <Link className="link" to={`/students/${s.id}`}>
                        {s.name}
                      </Link>
                      <StatusBadge status={status || 'todo'} />
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="muted small">Учеников пока нет.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
