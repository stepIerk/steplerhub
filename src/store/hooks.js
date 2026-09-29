import { useContext } from 'react'
import { StoreContext } from './context.js'

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

function progressFor(state, studentId) {
  return state.progress[studentId] || {}
}

export function lessonStats(state, studentId) {
  const total = state.lessons.length
  const map = progressFor(state, studentId)
  let done = 0
  let inProgress = 0
  for (const lesson of state.lessons) {
    const entry = map[lesson.id]
    if (!entry) continue
    if (entry.status === 'done') done += 1
    else if (entry.status === 'in_progress') inProgress += 1
  }
  return {
    total,
    done,
    inProgress,
    left: total - done - inProgress,
    percent: total ? Math.round((done / total) * 100) : 0,
  }
}

export function overallPercent(state) {
  const students = state.students.length
  const total = students * state.lessons.length
  if (!total) return 0
  let done = 0
  for (const student of state.students) {
    const map = progressFor(state, student.id)
    for (const lesson of state.lessons) {
      if (map[lesson.id]?.status === 'done') done += 1
    }
  }
  return Math.round((done / total) * 100)
}
