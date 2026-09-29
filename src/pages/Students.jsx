import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Trash2, UserPlus, Users } from 'lucide-react'
import { lessonStats, useStore } from '../store/hooks.js'
import { EmptyState, Modal, ProgressBar } from '../components/ui.jsx'
import { uid } from '../store/storage.js'

const EMPTY_FORM = { name: '', grade: '', contacts: '', goal: '', email: '' }

export default function Students() {
  const { state, dispatch } = useStore()
  const [params, setParams] = useSearchParams()
  const open = params.get('new') === '1'
  const [form, setForm] = useState(EMPTY_FORM)
  const [query, setQuery] = useState('')

  function openModal() {
    setForm(EMPTY_FORM)
    params.set('new', '1')
    setParams(params, { replace: true })
  }

  function closeModal() {
    setForm(EMPTY_FORM)
    params.delete('new')
    setParams(params, { replace: true })
  }

  const list = state.students.filter((s) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      s.name.toLowerCase().includes(q) ||
      (s.grade || '').toLowerCase().includes(q) ||
      (s.goal || '').toLowerCase().includes(q)
    )
  })

  function submit(event) {
    event.preventDefault()
    if (!form.name.trim()) return
    dispatch({
      type: 'student/save',
      student: {
        ...form,
        name: form.name.trim(),
        id: uid('student'),
        createdAt: Date.now(),
      },
    })
    setForm(EMPTY_FORM)
    closeModal()
  }

  function remove(student) {
    if (confirm(`Удалить ученика «${student.name}»? Прогресс и занятия будут удалены.`)) {
      dispatch({ type: 'student/delete', id: student.id })
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Ученики</h1>
          <p className="muted">{state.students.length} человек</p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn btn-primary" onClick={openModal}>
            <UserPlus size={16} /> Добавить
          </button>
        </div>
      </header>

      <section className="card">
        <div className="toolbar">
          <label className="field search grow">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Поиск по имени, классу, цели…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        {!state.students.length ? (
          <EmptyState
            title="Учеников пока нет"
            hint="Добавьте ученика, чтобы отмечать прогресс по программе"
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={openModal}>
                <UserPlus size={15} /> Добавить ученика
              </button>
            }
          />
        ) : !list.length ? (
          <EmptyState title="Ничего не найдено" hint="Измените запрос" />
        ) : (
          <ul className="list">
            {list.map((student) => {
              const stats = lessonStats(state, student.id)
              return (
                <li className="student-row" key={student.id}>
                  <Link className="student-main" to={`/students/${student.id}`}>
                    <span className="avatar">{student.name.slice(0, 1).toUpperCase()}</span>
                    <span className="lesson-body">
                      <span className="row-title">{student.name}</span>
                      <span className="muted small">
                        {student.grade || 'Класс не указан'}
                        {student.goal ? ` · ${student.goal}` : ''}
                      </span>
                      <span className="student-progress">
                        <ProgressBar value={stats.percent} />
                        <span className="percent small">
                          {stats.done}/{stats.total} · {stats.percent}%
                        </span>
                      </span>
                    </span>
                  </Link>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="icon-btn danger"
                      title="Удалить"
                      onClick={() => remove(student)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Modal
        open={open}
        title="Новый ученик"
        onClose={closeModal}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={closeModal}>
              Отмена
            </button>
            <button type="submit" form="student-form" className="btn btn-primary">
              <Users size={16} /> Добавить
            </button>
          </>
        }
      >
        <form id="student-form" className="form-grid" onSubmit={submit}>
          <label className="field span-2">
            <span className="field-label">Имя</span>
            <input
              type="text"
              autoFocus
              required
              value={form.name}
              placeholder="Алексей Иванов"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">Класс</span>
            <input
              type="text"
              value={form.grade}
              placeholder="9 класс"
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">Контакты</span>
            <input
              type="text"
              value={form.contacts}
              placeholder="телефон / телеграм"
              onChange={(e) => setForm({ ...form, contacts: e.target.value })}
            />
          </label>
          <label className="field span-2">
            <span className="field-label">Email для входа (необязательно)</span>
            <input
              type="email"
              value={form.email}
              placeholder="student@example.com"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="field span-2">
            <span className="field-label">Цель</span>
            <input
              type="text"
              value={form.goal}
              placeholder="Подготовка к ОГЭ, цель — 4+"
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
            />
          </label>
        </form>
      </Modal>
    </div>
  )
}
