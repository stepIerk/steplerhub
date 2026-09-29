export const STORAGE_KEY = 'steptutlib:v1'

export const emptyState = {
  version: 1,
  lessons: [],
  students: [],
  progress: {},
  sessions: [],
  settings: { theme: 'auto' },
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return normalize(parsed)
  } catch {
    return null
  }
}

export function normalize(state) {
  return {
    ...emptyState,
    ...state,
    lessons: Array.isArray(state.lessons) ? state.lessons : [],
    students: Array.isArray(state.students) ? state.students : [],
    sessions: Array.isArray(state.sessions) ? state.sessions : [],
    progress:
      state.progress && typeof state.progress === 'object' ? state.progress : {},
    settings: { ...emptyState.settings, ...(state.settings || {}) },
    version: 1,
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `steptutlib-${stamp}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function parseStateFile(text) {
  const parsed = JSON.parse(text)
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Некорректный формат файла')
  }
  if (!Array.isArray(parsed.lessons) && !Array.isArray(parsed.students)) {
    throw new Error('В файле нет данных приложения')
  }
  return normalize(parsed)
}

export function uid(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}
