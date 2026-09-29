import { supabase } from './supabase.js'

export const FN_NOT_DEPLOYED_HINT =
  'Похоже, Edge Function «create-student» не задеплоена. Откройте Supabase Dashboard → Edge Functions → New Function с именем create-student, вставьте код из supabase/functions/create-student/index.ts и нажмите Deploy.'

export function genPassword(length = 10) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  let out = ''
  for (const n of arr) out += chars[n % chars.length]
  return out
}

export function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke('create-student', { body })
  if (error) {
    const status = error.context?.status ?? error.status
    if (status === 404) throw new Error(FN_NOT_DEPLOYED_HINT)
    let detail = ''
    try {
      const raw = await error.context?.json?.()
      detail = raw?.message || raw?.error || ''
    } catch {
      // тело ответа не JSON (например, HTML) — идём дальше
    }
    const base = detail || error.message || ''
    if (/not found|failed to (send|fetch)|fetch failed|network|load failed/i.test(base)) {
      throw new Error(FN_NOT_DEPLOYED_HINT)
    }
    throw new Error(base || 'Не удалось выполнить запрос')
  }
  if (data && (data.error || data.ok === false)) {
    throw new Error(data.message || data.error || 'Не удалось выполнить запрос')
  }
  return data || {}
}

export function createStudentAccess({ studentId, email, password }) {
  return invoke({ action: 'create', studentId, email, password })
}

export function resetStudentPassword({ studentId, password }) {
  return invoke({ action: 'reset-password', studentId, password })
}
