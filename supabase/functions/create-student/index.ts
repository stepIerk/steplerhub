// Supabase Edge Function: создание логина/пароля для ученика.
// Деплой БЕЗ CLI: Dashboard → Edge Functions → New Function → имя
// `create-student` → вставить этот файл целиком → Deploy.
// Секреты настраивать не нужно: SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY
// уже встроены в окружение Edge Functions.
//
// Действия (поле action):
//   { action: 'create', studentId, email, password } — создать пользователя,
//     подтвердить email и привязать к карточке ученика.
//   { action: 'reset-password', studentId, password } — сменить пароль
//     уже привязанного ученика.
// Вызывать может только преподаватель (проверка роли по JWT).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Метод не поддерживается' }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !serviceKey) {
      return json({ error: 'Сервер не настроен' }, 500)
    }
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })

    // Кто вызывает? Проверяем JWT и роль преподавателя.
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    if (!token) return json({ error: 'Нет доступа: нужен вход' }, 401)
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(token)
    if (userError || !user) return json({ error: 'Нет доступа: неверный токен' }, 401)

    const { data: caller } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    if (caller?.role !== 'teacher') {
      return json({ error: 'Только преподаватель может выдавать доступы' }, 403)
    }

    const body = await req.json().catch(() => ({}))
    const { action, studentId, password } = body as {
      action?: string
      studentId?: string
      email?: string
      password?: string
    }

    if (typeof studentId !== 'string' || !studentId) {
      return json({ error: 'Не указан ученик' }, 400)
    }
    if (typeof password !== 'string' || password.length < 8) {
      return json({ error: 'Пароль должен быть не короче 8 символов' }, 400)
    }

    // Ученик должен принадлежать вызывающему преподавателю.
    const { data: student } = await admin
      .from('students')
      .select('id, owner_id, auth_user_id')
      .eq('id', studentId)
      .maybeSingle()
    if (!student || student.owner_id !== user.id) {
      return json({ error: 'Ученик не найден' }, 404)
    }

    if (action === 'reset-password') {
      if (!student.auth_user_id) {
        return json({ error: 'К ученику не привязан аккаунт' }, 400)
      }
      const { error } = await admin.auth.admin.updateUserById(student.auth_user_id, {
        password,
      })
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true })
    }

    if (action !== 'create' && action !== undefined) {
      return json({ error: 'Неизвестное действие' }, 400)
    }

    const email = (body as { email?: string }).email
    if (!isEmail(email)) {
      return json({ error: 'Некорректный email' }, 400)
    }
    const cleanEmail = email.trim().toLowerCase()

    // Не даём «перехватить» чужой аккаунт, особенно преподавателя.
    const { data: existing } = await admin
      .from('profiles')
      .select('id, role')
      .eq('email', cleanEmail)
      .maybeSingle()
    if (existing) {
      return json(
        {
          error: 'exists',
          message:
            'Пользователь с таким email уже существует. Привяжите его через «Привязать существующего».',
        },
        409,
      )
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
    })
    if (createError || !created.user) {
      const msg = createError?.message ?? 'Не удалось создать пользователя'
      const already =
        createError?.status === 422 || /already|registered|exists/i.test(msg)
      return json(
        already
          ? {
              error: 'exists',
              message:
                'Пользователь с таким email уже существует. Привяжите его через «Привязать существующего».',
            }
          : { error: msg },
        already ? 409 : 400,
      )
    }

    // Триггер handle_new_user обычно уже создал профиль; upsert — на случай гонки.
    // Роль жёстко student: чужой teacher-аккаунт мы выше уже отсекли.
    const { error: profileError } = await admin.from('profiles').upsert(
      { id: created.user.id, email: cleanEmail, role: 'student', student_id: studentId },
      { onConflict: 'id' },
    )
    if (profileError) return json({ error: profileError.message }, 500)

    const { error: linkError } = await admin
      .from('students')
      .update({ auth_user_id: created.user.id })
      .eq('id', studentId)
    if (linkError) return json({ error: linkError.message }, 500)

    return json({ ok: true, userId: created.user.id })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Внутренняя ошибка' }, 500)
  }
})
