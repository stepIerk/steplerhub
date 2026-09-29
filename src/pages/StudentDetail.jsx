import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarPlus, Pencil, Trash2 } from 'lucide-react'
import { lessonStats, useStore } from '../store/hooks.js'
import { EmptyState, Modal, ProgressBar, StatusBadge } from '../components/ui.jsx'

const EMPTY_FORM = { name: '', grade: '', contacts: '', goal: '' }

function formatDate(value) {
  return value
    ? new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'
}

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useStore()
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const student = state.students.find((s) => s.id === id)

  function openEdit() {
    setForm({ ...EMPTY_FORM, ...student })
    setEditOpen(true)
  }

  function closeEdit() {
    setEditOpen(false)
  }

  const stats = useMemo(() => lessonStats(state, id), [state, id])
  const progressMap = state.progress[id] || {}

  const sessions = useMemo(
    () =>
      state.sessions
        .filter((s) => s.studentId === id)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [state.sessions, id],
  )

  const sortedLessons = useMemo(
    () => [...state.lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [state.lessons],
  )

  if (!student) {
    return (
      <div className="page">
        <EmptyState
          title="Ученик не найден"
          action={
            <Link className="btn btn-primary btn-sm" to="/students">
              К списку
            </Link>
          }
        />
      </div>
    )
  }

  function setStatus(lessonId, status) {
    dispatch({ type: 'progress/set', studentId: id, lessonId, status })
  }

  function submitEdit(event) {
    event.preventDefault()
    if (!form.name.trim()) return
    dispatch({ type: 'student/save', student: { ...form, id, name: form.name.trim() } })
    closeEdit()
  }

  function removeStudent() {
    if (confirm(`Удалить ученика «${student.name}»? Весь прогресс и занятия будут удалены.`)) {
      dispatch({ type: 'student/delete', id })
      navigate('/students')
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <div className="head-left">
          <Link className="icon-btn" to="/students" title="Назад">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="muted small">
              {student.grade || 'Класс не указан'}
              {student.contacts ? ` · ${student.contacts}` : ''}
            </p>
            <h1>{student.name}</h1>
          </div>
        </div>
        <div className="head-actions">
          <button type="button" className="btn btn-ghost" onClick={openEdit}>
            <Pencil size={16} /> Изменить
          </button>
          <button type="button" className="btn btn-danger-ghost" onClick={removeStudent}>
            <Trash2 size={16} /> Удалить
          </button>
        </div>
      </header>

      <section className="cards cards-2">
        <div className="card stat wide">
          <div>
            <p className="stat-value">{stats.percent}%</p>
            <p className="stat-label">Прогресс по программе</p>
          </div>
          <ProgressBar value={stats.percent} />
          <div className="stat-chips">
            <span className="chip done">{stats.done} готово</span>
            <span className="chip progress">{stats.inProgress} в процессе</span>
            <span className="chip todo">{stats.left} осталось</span>
          </div>
        </div>
        <div className="card stat wide">
          <div>
            <p className="stat-value">{sessions.length}</p>
            <p className="stat-label">Занятий проведено</p>
          </div>
          {student.goal && <p className="muted small">Цель: {student.goal}</p>}
          <Link className="btn btn-ghost btn-sm" to={`/sessions?new=1&student=${id}`}>
            <CalendarPlus size={15} /> Записать занятие
          </Link>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Программа ученика</h2>
          <Link className="link" to={`/program`}>
            Открыть программу
          </Link>
        </div>
        {!sortedLessons.length ? (
          <EmptyState
            title="Программа пуста"
            action={
              <Link className="btn btn-primary btn-sm" to="/lessons/new">
                Создать урок
              </Link>
            }
          />
        ) : (
          <ul className="list">
            {sortedLessons.map((lesson) => {
              const entry = progressMap[lesson.id]
              return (
                <li className="lesson-row" key={lesson.id}>
                  <Link className="lesson-main" to={`/lessons/${lesson.id}`}>
                    <span className="lesson-index">{lesson.order}</span>
                    <span className="lesson-body">
                      <span className="row-title">{lesson.title}</span>
                      <span className="muted small">
                        {lesson.block || 'Без блока'}
                        {entry?.note ? ` · ${entry.note.slice(0, 60)}` : ''}
                      </span>
                    </span>
                  </Link>
                  <StatusBadge status={entry?.status || 'todo'} />
                  <label className="field select compact-select">
                    <select
                      aria-label={`Статус урока ${lesson.title}`}
                      value={entry?.status || 'todo'}
                      onChange={(e) => setStatus(lesson.id, e.target.value)}
                    >
                      <option value="todo">Не начато</option>
                      <option value="in_progress">В процессе</option>
                      <option value="done">Готово</option>
                    </select>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>История занятий</h2>
          <Link className="link" to={`/sessions?new=1&student=${id}`}>
            Записать
          </Link>
        </div>
        {sessions.length ? (
          <ul className="list">
            {sessions.map((session) => {
              const lessonTitles = state.lessons
                .filter((l) => session.lessonIds?.includes(l.id))
                .map((l) => l.title)
              return (
                <li className="list-row static session-row" key={session.id}>
                  <div>
                    <p className="row-title">{formatDate(session.date)}</p>
                    <p className="muted small">
                      {lessonTitles.length ? lessonTitles.join(', ') : 'Без привязки к уроку'}
                    </p>
                    {session.homework && (
                      <p className="small">ДЗ: {session.homework}</p>
                    )}
                    {session.note && <p className="muted small">{session.note}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState title="Занятий пока нет" hint="Записывайте каждую встречу в журнал" />
        )}
      </section>

      <Modal
        open={editOpen}
        title="Изменить ученика"
        onClose={closeEdit}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={closeEdit}>
              Отмена
            </button>
            <button type="submit" form="student-edit-form" className="btn btn-primary">
              Сохранить
            </button>
          </>
        }
      >
        <form id="student-edit-form" className="form-grid" onSubmit={submitEdit}>
          <label className="field span-2">
            <span className="field-label">Имя</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">Класс</span>
            <input
              type="text"
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">Контакты</span>
            <input
              type="text"
              value={form.contacts}
              onChange={(e) => setForm({ ...form, contacts: e.target.value })}
            />
          </label>
          <label className="field span-2">
            <span className="field-label">Цель</span>
            <input
              type="text"
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
            />
          </label>
        </form>
      </Modal>
    </div>
  )
}
