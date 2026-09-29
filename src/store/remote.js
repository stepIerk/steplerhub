import { supabase } from '../lib/supabase.js'
import { loadState, STORAGE_KEY } from './storage.js'

// ---------- маппинг строк БД <-> объекты приложения ----------

function lessonToRow(ownerId, lesson) {
  return {
    id: lesson.id,
    owner_id: ownerId,
    title: lesson.title,
    block: lesson.block || '',
    grade: lesson.grade || '',
    order: Number(lesson.order) || 0,
    tags: lesson.tags || [],
    markdown: lesson.markdown || '',
    updated_at: new Date().toISOString(),
  }
}

function studentToRow(ownerId, student) {
  return {
    id: student.id,
    owner_id: ownerId,
    name: student.name,
    grade: student.grade || '',
    contacts: student.contacts || '',
    goal: student.goal || '',
    email: student.email || '',
  }
}

function sessionToRow(ownerId, session) {
  return {
    id: session.id,
    owner_id: ownerId,
    student_id: session.studentId,
    date: session.date,
    lesson_ids: session.lessonIds || [],
    homework: session.homework || '',
    note: session.note || '',
    minutes: Number(session.minutes) || 0,
  }
}

function rowToLesson(row) {
  return {
    id: row.id,
    title: row.title,
    block: row.block || '',
    grade: row.grade || '',
    order: row.order ?? 0,
    tags: row.tags || [],
    markdown: row.markdown || '',
    createdAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
    updatedAt: row.updated_at ? Date.parse(row.updated_at) : Date.now(),
  }
}

function rowToStudent(row) {
  return {
    id: row.id,
    name: row.name,
    grade: row.grade || '',
    contacts: row.contacts || '',
    goal: row.goal || '',
    email: row.email || '',
    authUserId: row.auth_user_id || null,
    createdAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
  }
}

function rowToSession(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    date: row.date,
    lessonIds: row.lesson_ids || [],
    homework: row.homework || '',
    note: row.note || '',
    minutes: row.minutes ?? 60,
  }
}

// ---------- загрузка ----------

export async function loadAll(ownerId) {
  const [lessonsRes, studentsRes, progressRes, sessionsRes] = await Promise.all([
    supabase.from('lessons').select('*').eq('owner_id', ownerId).order('order'),
    supabase.from('students').select('*').eq('owner_id', ownerId).order('created_at'),
    supabase.from('progress').select('*').eq('owner_id', ownerId),
    supabase.from('sessions').select('*').eq('owner_id', ownerId).order('date', { ascending: false }),
  ])
  for (const res of [lessonsRes, studentsRes, progressRes, sessionsRes]) {
    if (res.error) throw new Error(res.error.message)
  }

  const progress = {}
  for (const row of progressRes.data || []) {
    if (!progress[row.student_id]) progress[row.student_id] = {}
    progress[row.student_id][row.lesson_id] = {
      status: row.status,
      note: row.note || '',
      updatedAt: row.updated_at ? Date.parse(row.updated_at) : Date.now(),
    }
  }

  return {
    version: 1,
    lessons: (lessonsRes.data || []).map(rowToLesson),
    students: (studentsRes.data || []).map(rowToStudent),
    progress,
    sessions: (sessionsRes.data || []).map(rowToSession),
  }
}

// ---------- запись ----------

export async function wipeOwner(ownerId) {
  const tables = ['sessions', 'progress', 'students', 'lessons']
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('owner_id', ownerId)
    if (error) throw new Error(error.message)
  }
}

export async function bulkInsert(ownerId, state, mode = 'insert') {
  const query = (table, rows) => {
    if (!rows.length) return Promise.resolve({ error: null })
    return mode === 'upsert'
      ? supabase.from(table).upsert(rows, { onConflict: 'id' })
      : supabase.from(table).insert(rows)
  }

  const lessonRows = (state.lessons || []).map((l) => lessonToRow(ownerId, l))
  const studentRows = (state.students || []).map((s) => studentToRow(ownerId, s))
  const sessionRows = (state.sessions || []).map((s) => sessionToRow(ownerId, s))
  const progressRows = []
  for (const [studentId, map] of Object.entries(state.progress || {})) {
    for (const [lessonId, entry] of Object.entries(map || {})) {
      if (!entry || !entry.status || entry.status === 'todo') continue
      progressRows.push({
        student_id: studentId,
        lesson_id: lessonId,
        owner_id: ownerId,
        status: entry.status,
        note: entry.note || '',
        updated_at: new Date().toISOString(),
      })
    }
  }

  const results = await Promise.all([
    query('lessons', lessonRows),
    query('students', studentRows),
    query('sessions', sessionRows),
    query('progress', progressRows),
  ])
  for (const res of results) {
    if (res.error) throw new Error(res.error.message)
  }
}

/** Применяет одно действие к Supabase. getState() — актуальный локальный стейт для слияний. */
export async function applyRemote(ownerId, action, getState) {
  switch (action.type) {
    case 'lesson/save': {
      const { error } = await supabase
        .from('lessons')
        .upsert(lessonToRow(ownerId, action.lesson), { onConflict: 'id' })
      if (error) throw new Error(error.message)
      return
    }
    case 'lesson/delete': {
      const { error } = await supabase.from('lessons').delete().eq('id', action.id)
      if (error) throw new Error(error.message)
      return
    }
    case 'student/save': {
      const { error } = await supabase
        .from('students')
        .upsert(studentToRow(ownerId, action.student), { onConflict: 'id' })
      if (error) throw new Error(error.message)
      return
    }
    case 'student/delete': {
      const { error } = await supabase.from('students').delete().eq('id', action.id)
      if (error) throw new Error(error.message)
      return
    }
    case 'progress/set': {
      if (!action.status || action.status === 'todo') {
        const { error } = await supabase
          .from('progress')
          .delete()
          .eq('student_id', action.studentId)
          .eq('lesson_id', action.lessonId)
        if (error) throw new Error(error.message)
        return
      }
      const prev = getState().progress[action.studentId]?.[action.lessonId]
      const { error } = await supabase.from('progress').upsert(
        {
          student_id: action.studentId,
          lesson_id: action.lessonId,
          owner_id: ownerId,
          status: action.status,
          note: prev?.note || '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,lesson_id' },
      )
      if (error) throw new Error(error.message)
      return
    }
    case 'progress/note': {
      const prev = getState().progress[action.studentId]?.[action.lessonId]
      const { error } = await supabase.from('progress').upsert(
        {
          student_id: action.studentId,
          lesson_id: action.lessonId,
          owner_id: ownerId,
          status: prev?.status || 'in_progress',
          note: action.note,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,lesson_id' },
      )
      if (error) throw new Error(error.message)
      return
    }
    case 'session/save': {
      const { error } = await supabase
        .from('sessions')
        .upsert(sessionToRow(ownerId, action.session), { onConflict: 'id' })
      if (error) throw new Error(error.message)
      return
    }
    case 'session/delete': {
      const { error } = await supabase.from('sessions').delete().eq('id', action.id)
      if (error) throw new Error(error.message)
      return
    }
    default:
      return
  }
}

// ---------- миграция из localStorage ----------

export function readLocalBackup() {
  return loadState()
}

export function clearLocalBackup() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export async function migrateLocalToCloud(ownerId) {
  const local = loadState()
  if (!local) throw new Error('Локальные данные не найдены')
  await bulkInsert(ownerId, local, 'upsert')
  return {
    lessons: local.lessons.length,
    students: local.students.length,
    sessions: local.sessions.length,
  }
}
