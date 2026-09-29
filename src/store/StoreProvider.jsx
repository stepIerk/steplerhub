import { useEffect, useMemo, useReducer } from 'react'
import { StoreContext } from './context.js'
import { loadState, saveState } from './storage.js'
import { createSeedState } from './seed.js'

function getInitial() {
  const stored = loadState()
  if (stored) return stored
  const seeded = createSeedState()
  saveState(seeded)
  return seeded
}

function upsert(list, item) {
  const exists = list.some((el) => el.id === item.id)
  return exists ? list.map((el) => (el.id === item.id ? { ...el, ...item } : el)) : [...list, item]
}

function progressFor(state, studentId) {
  return state.progress[studentId] || {}
}

function reducer(state, action) {
  switch (action.type) {
    case 'lesson/save':
      return { ...state, lessons: upsert(state.lessons, action.lesson) }
    case 'lesson/delete':
      return {
        ...state,
        lessons: state.lessons.filter((l) => l.id !== action.id),
        progress: Object.fromEntries(
          Object.entries(state.progress).map(([sid, map]) => [
            sid,
            Object.fromEntries(Object.entries(map).filter(([lid]) => lid !== action.id)),
          ]),
        ),
      }
    case 'student/save':
      return { ...state, students: upsert(state.students, action.student) }
    case 'student/delete': {
      const progress = { ...state.progress }
      delete progress[action.id]
      return {
        ...state,
        students: state.students.filter((s) => s.id !== action.id),
        progress,
        sessions: state.sessions.filter((s) => s.studentId !== action.id),
      }
    }
    case 'progress/set': {
      const current = progressFor(state, action.studentId)
      const prev = current[action.lessonId]
      const next = { ...current }
      if (!action.status || action.status === 'todo') {
        delete next[action.lessonId]
      } else {
        next[action.lessonId] = {
          note: '',
          ...prev,
          status: action.status,
          updatedAt: Date.now(),
        }
      }
      return { ...state, progress: { ...state.progress, [action.studentId]: next } }
    }
    case 'progress/note': {
      const current = progressFor(state, action.studentId)
      const prev = current[action.lessonId] || { status: 'in_progress' }
      return {
        ...state,
        progress: {
          ...state.progress,
          [action.studentId]: {
            ...current,
            [action.lessonId]: { ...prev, note: action.note, updatedAt: Date.now() },
          },
        },
      }
    }
    case 'session/save':
      return { ...state, sessions: upsert(state.sessions, action.session) }
    case 'session/delete':
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.id) }
    case 'settings/patch':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'state/import':
      return action.state
    case 'state/reset':
      return createSeedState()
    case 'state/clear':
      return {
        version: 1,
        lessons: [],
        students: [],
        progress: {},
        sessions: [],
        settings: state.settings,
      }
    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitial)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    const root = document.documentElement
    const theme = state.settings.theme || 'auto'
    root.dataset.theme = theme
    root.style.colorScheme = theme === 'auto' ? 'light dark' : theme
  }, [state.settings.theme])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
