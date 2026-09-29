const THEME_KEY = 'steptutlib:theme'

export function getTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'auto'
  } catch {
    return 'auto'
  }
}

export function applyTheme(theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme === 'auto' ? 'light dark' : theme
}

export function setTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // ignore
  }
  applyTheme(theme)
}
