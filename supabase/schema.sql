-- ============================================================
-- steptutlib — схема базы данных для Supabase (Postgres)
-- Как применить: Supabase Dashboard → SQL Editor → New query →
-- вставить весь файл → Run.
-- ============================================================

-- ---------- 1. Таблицы ----------

create table if not exists public.students (
  id text primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  grade text not null default '',
  contacts text not null default '',
  goal text not null default '',
  email text not null default '',
  auth_user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id text primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  block text not null default '',
  grade text not null default '',
  "order" double precision not null default 0,
  tags text[] not null default '{}',
  markdown text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress (
  student_id text not null references public.students (id) on delete cascade,
  lesson_id text not null references public.lessons (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'in_progress',
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);

create table if not exists public.sessions (
  id text primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  student_id text not null references public.students (id) on delete cascade,
  date date not null default current_date,
  lesson_ids text[] not null default '{}',
  homework text not null default '',
  note text not null default '',
  minutes integer not null default 60,
  created_at timestamptz not null default now()
);

-- Профили пользователей Auth: роль и привязка к карточке ученика.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'student' check (role in ('teacher', 'student')),
  student_id text references public.students (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- 2. Индексы ----------

create index if not exists students_owner_idx on public.students (owner_id);
create index if not exists lessons_owner_idx on public.lessons (owner_id);
create index if not exists progress_owner_idx on public.progress (owner_id);
create index if not exists progress_student_idx on public.progress (student_id);
create index if not exists sessions_owner_idx on public.sessions (owner_id);
create index if not exists sessions_student_idx on public.sessions (student_id);

-- ---------- 3. Автопрофиль при создании пользователя ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 4. Хелпер «я преподаватель» (без рекурсии RLS) ----------

create or replace function public.is_teacher()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

-- ---------- 5. Row Level Security ----------

alter table public.students enable row level security;
alter table public.lessons enable row level security;
alter table public.progress enable row level security;
alter table public.sessions enable row level security;
alter table public.profiles enable row level security;

-- students
drop policy if exists students_owner_all on public.students;
create policy students_owner_all on public.students
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists students_self_read on public.students;
create policy students_self_read on public.students
  for select using (
    id = (select student_id from public.profiles where id = auth.uid())
  );

-- lessons
drop policy if exists lessons_owner_all on public.lessons;
create policy lessons_owner_all on public.lessons
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists lessons_student_read on public.lessons;
create policy lessons_student_read on public.lessons
  for select using (
    exists (
      select 1
      from public.profiles p
      join public.students s on s.id = p.student_id
      where p.id = auth.uid() and s.owner_id = public.lessons.owner_id
    )
  );

-- progress
drop policy if exists progress_owner_all on public.progress;
create policy progress_owner_all on public.progress
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists progress_self_read on public.progress;
create policy progress_self_read on public.progress
  for select using (
    student_id = (select student_id from public.profiles where id = auth.uid())
  );

-- sessions
drop policy if exists sessions_owner_all on public.sessions;
create policy sessions_owner_all on public.sessions
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists sessions_self_read on public.sessions;
create policy sessions_self_read on public.sessions
  for select using (
    student_id = (select student_id from public.profiles where id = auth.uid())
  );

-- profiles
drop policy if exists profiles_own_read on public.profiles;
create policy profiles_own_read on public.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_teacher_read on public.profiles;
create policy profiles_teacher_read on public.profiles
  for select using (public.is_teacher());

drop policy if exists profiles_own_insert on public.profiles;
create policy profiles_own_insert on public.profiles
  for insert with check (id = auth.uid() and role = 'student');

drop policy if exists profiles_teacher_update on public.profiles;
create policy profiles_teacher_update on public.profiles
  for update using (public.is_teacher())
  with check (public.is_teacher());
