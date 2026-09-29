import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarPlus, Pencil, Search, Trash2 } from 'lucide-react'
import { useStore } from '../store/hooks.js'
import { EmptyState, Modal } from '../components/ui.jsx'
import { uid } from '../store/storage.js'

const EMPTY_FORM = {
  date: '',
  studentId: '',
  lessonIds: [],
  homework: '',
  note: '',
  minutes: 60,
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Sessions() {
  const { state, dispatch } = useStore()
  const [params, setParams] = useSearchParams()
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(() => {
    const initial = new URLSearchParams(window.location.search)
    if (initial.get('new') !== '1') return EMPTY_FORM
    return {
      ...EMPTY_FORM,
      date: today(),
      studentId: initial.get('student') || state.students[0]?.id || '',
    }
  })
  const [query, setQuery] = useState('')
  const [studentFilter, setStudentFilter] = useState('')

  const open = params.get('new') === '1'

  function closeModal() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    params.delete('new')
    params.delete('student')
    setParams(params, { replace: true })
  }

  const sorted = useMemo(
    () => [...state.sessions].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [state.sessions],
  )

  const list = sorted.filter((session) => {
    if (studentFilter && session.studentId !== studentFilter) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    const student = state.students.find((s) => s.id === session.studentId)
    const lessonTitles = state.lessons
      .filter((l) => session.lessonIds?.includes(l.id))
      .map((l) => l.title)
    return [student?.name, session.homework, session.note, ...lessonTitles]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  })

  function toggleLesson(lessonId) {
    setForm((prev) => ({
      ...prev,
      lessonIds: prev.lessonIds.includes(lessonId)
        ? prev.lessonIds.filter((id) => id !== lessonId)
        : [...prev.lessonIds, lessonId],
    }))
  }

  function openCreate() {
    setForm({ ...EMPTY_FORM, date: today(), studentId: state.students[0]?.id || '' })
    setEditingId(null)
    params.set('new', '1')
    setParams(params)
  }

  function openEdit(session) {
    setForm({ ...EMPTY_FORM, ...session, date: session.date || today() })
    setEditingId(session.id)
    params.set('new', '1')
    setParams(params)
  }

  function submit(event) {
    event.preventDefault()
    if (!form.studentId) {
      alert('Сначала добавьте ученика')
      return
    }
    dispatch({
      type: 'session/save',
      session: {
        ...form,
        minutes: Number(form.minutes) || 0,
        id: editingId || uid('session'),
      },
    })
    closeModal()
  }

  function remove(session) {
    if (confirm('Удалить запись о занятии?')) {
      dispatch({ type: 'session/delete', id: session.id })
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Журнал занятий</h1>
          <p className="muted">{state.sessions.length} записей</p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <CalendarPlus size={16} /> Записать занятие
          </button>
        </div>
      </header>

      <section className="card">
        <div className="toolbar">
          <label className="field search grow">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Поиск: ученик, урок, ДЗ…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="field select">
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
            >
              <option value="">Все ученики</option>
              {state.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!state.sessions.length ? (
          <EmptyState
            title="Журнал пуст"
            hint="После занятия записывайте, что прошли и что задали"
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
                <CalendarPlus size={15} /> Записать занятие
              </button>
            }
          />
        ) : !list.length ? (
          <EmptyState title="Ничего не найдено" hint="Измените запрос или фильтр" />
        ) : (
          <ul className="list">
            {list.map((session) => {
              const student = state.students.find((s) => s.id === session.studentId)
              const lessons = state.lessons.filter((l) => session.lessonIds?.includes(l.id))
              return (
                <li className="session-card" key={session.id}>
                  <div className="session-top">
                    <div>
                      <p className="row-title">
                        {student ? (
                          <Link className="link" to={`/students/${student.id}`}>
                            {student.name}
                          </Link>
                        ) : (
                          'Ученик удалён'
                        )}
                      </p>
                      <p className="muted small">
                        {formatDate(session.date)}
                        {session.minutes ? ` · ${session.minutes} мин` : ''}
                      </p>
                    </div>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        title="Редактировать"
                        onClick={() => openEdit(session)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        title="Удалить"
                        onClick={() => remove(session)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {lessons.length > 0 && (
                    <p className="session-line">
                      <strong>Прошли:</strong> {lessons.map((l) => l.title).join(', ')}
                    </p>
                  )}
                  {session.homework && (
                    <p className="session-line">
                      <strong>ДЗ:</strong> {session.homework}
                    </p>
                  )}
                  {session.note && (
                    <p className="session-line muted">
                      <strong>Заметка:</strong> {session.note}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Modal
        open={open}
        title={editingId ? 'Изменить занятие' : 'Новое занятие'}
        onClose={closeModal}
        wide
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={closeModal}>
              Отмена
            </button>
            <button type="submit" form="session-form" className="btn btn-primary">
              Сохранить
            </button>
          </>
        }
      >
        <form id="session-form" className="stack" onSubmit={submit}>
          <div className="form-grid">
            <label className="field">
              <span className="field-label">Дата</span>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">Ученик</span>
              <select
                required
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              >
                <option value="">— выберите —</option>
                {state.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Длительность, мин</span>
              <input
                type="number"
                min="0"
                step="5"
                value={form.minutes}
                onChange={(e) => setForm({ ...form, minutes: e.target.value })}
              />
            </label>
          </div>

          <fieldset className="field">
            <legend className="field-label">Уроки на занятии</legend>
            {state.lessons.length ? (
              <div className="chips">
                {state.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    className={`chip selectable${
                      form.lessonIds.includes(lesson.id) ? ' selected' : ''
                    }`}
                    onClick={() => toggleLesson(lesson.id)}
                  >
                    {lesson.title}
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted small">
                Уроков пока нет — <Link className="link" to="/lessons/new">создайте</Link>.
              </p>
            )}
          </fieldset>

          <label className="field">
            <span className="field-label">Домашнее задание</span>
            <textarea
              rows={3}
              value={form.homework}
              placeholder="Стр. 42, № 15–20"
              onChange={(e) => setForm({ ...form, homework: e.target.value })}
            />
          </label>

          <label className="field">
            <span className="field-label">Заметка</span>
            <textarea
              rows={3}
              value={form.note}
              placeholder="Что получилось, над чем работаем дальше"
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </label>
        </form>
      </Modal>
    </div>
  )
}
