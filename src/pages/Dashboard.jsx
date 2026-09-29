import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CalendarPlus, GraduationCap, Plus, Search, UserPlus } from 'lucide-react'
import { lessonStats, overallPercent, useStore } from '../store/hooks.js'
import { EmptyState, ProgressBar } from '../components/ui.jsx'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function Dashboard() {
  const { state } = useStore()
  const [query, setQuery] = useState('')

  const percent = overallPercent(state)

  const filteredLessons = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return state.lessons
      .filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          (l.block || '').toLowerCase().includes(q) ||
          (l.markdown || '').toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [query, state.lessons])

  const recentSessions = useMemo(
    () =>
      [...state.sessions]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 5),
    [state.sessions],
  )

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Панель</h1>
          <p className="muted">Обзор программы, учеников и занятий</p>
        </div>
        <div className="head-actions">
          <Link className="btn btn-ghost" to="/lessons/new">
            <Plus size={16} /> Урок
          </Link>
          <Link className="btn btn-ghost" to="/sessions?new=1">
            <CalendarPlus size={16} /> Занятие
          </Link>
          <Link className="btn btn-primary" to="/students?new=1">
            <UserPlus size={16} /> Ученик
          </Link>
        </div>
      </header>

      <section className="cards">
        <div className="card stat">
          <div className="stat-icon">
            <GraduationCap size={18} />
          </div>
          <div>
            <p className="stat-value">{state.students.length}</p>
            <p className="stat-label">Учеников</p>
          </div>
        </div>
        <div className="card stat">
          <div className="stat-icon">
            <BookOpen size={18} />
          </div>
          <div>
            <p className="stat-value">{state.lessons.length}</p>
            <p className="stat-label">Уроков в программе</p>
          </div>
        </div>
        <div className="card stat">
          <div className="stat-icon">
            <CalendarPlus size={18} />
          </div>
          <div>
            <p className="stat-value">{state.sessions.length}</p>
            <p className="stat-label">Занятий в журнале</p>
          </div>
        </div>
        <div className="card stat">
          <div className="stat-icon accent">
            <span className="stat-percent">{percent}%</span>
          </div>
          <div>
            <p className="stat-value">Прогресс</p>
            <p className="stat-label">Средний по всем ученикам</p>
          </div>
          <ProgressBar value={percent} className="stat-progress" />
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Поиск по урокам</h2>
        </div>
        <label className="field search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder="Название, блок или содержание…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {query.trim() &&
          (filteredLessons.length ? (
            <ul className="list">
              {filteredLessons.map((lesson) => (
                <li key={lesson.id}>
                  <Link className="list-row" to={`/lessons/${lesson.id}`}>
                    <div>
                      <p className="row-title">{lesson.title}</p>
                      <p className="muted small">
                        {lesson.block || 'Без блока'}
                        {lesson.grade ? ` · ${lesson.grade}` : ''}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Ничего не найдено" hint="Попробуйте другой запрос" />
          ))}
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Ученики</h2>
            <Link className="link" to="/students">
              Все
            </Link>
          </div>
          {state.students.length ? (
            <ul className="list">
              {state.students.slice(0, 6).map((student) => {
                const stats = lessonStats(state, student.id)
                return (
                  <li key={student.id}>
                    <Link className="list-row" to={`/students/${student.id}`}>
                      <div>
                        <p className="row-title">{student.name}</p>
                        <p className="muted small">
                          {student.grade || 'Класс не указан'} · {stats.done} из {stats.total}
                        </p>
                      </div>
                      <div className="row-side">
                        <span className="percent">{stats.percent}%</span>
                        <ProgressBar value={stats.percent} />
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState
              title="Учеников пока нет"
              hint="Добавьте первого ученика, чтобы отмечать прогресс"
              action={
                <Link className="btn btn-primary btn-sm" to="/students?new=1">
                  <UserPlus size={15} /> Добавить ученика
                </Link>
              }
            />
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Последние занятия</h2>
            <Link className="link" to="/sessions">
              Все
            </Link>
          </div>
          {recentSessions.length ? (
            <ul className="list">
              {recentSessions.map((session) => {
                const student = state.students.find((s) => s.id === session.studentId)
                return (
                  <li key={session.id} className="list-row static">
                    <div>
                      <p className="row-title">{student?.name || 'Ученик удалён'}</p>
                      <p className="muted small">
                        {formatDate(session.date)}
                        {session.homework ? ` · ДЗ: ${session.homework.slice(0, 40)}` : ''}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState
              title="Занятий пока нет"
              hint="Отмечайте каждое занятие — история сохранится в журнале"
              action={
                <Link className="btn btn-primary btn-sm" to="/sessions?new=1">
                  <CalendarPlus size={15} /> Записать занятие
                </Link>
              }
            />
          )}
        </section>
      </div>
    </div>
  )
}
