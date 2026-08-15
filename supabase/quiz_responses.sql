-- ═══════════════════════════════════════════════════
-- Strike IQ — tabla del quiz funnel (10 preguntas, onboarding)
-- Ejecutar en el SQL Editor del panel de Supabase.
--
-- Sigue el patrón de 'sesiones': columnas en español y usuario_id apuntando
-- a la tabla 'usuarios'. Una fila por quiz completado.
--
-- OJO: el quiz se responde ANTES de registrarse, así que la app guarda la
-- respuesta en local y la sube en cuanto hay sesión (flushPendingQuiz).
-- ═══════════════════════════════════════════════════

create table if not exists public.quiz_responses (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references public.usuarios (id) on delete cascade,
  fecha       timestamptz not null default now(),
  idioma      text,
  version     integer not null default 2,

  -- Perfil calculado a partir de las respuestas
  bucket      text not null,
  -- Puntos por perfil, tal cual los calcula la app (para poder recalcular
  -- buckets a futuro sin perder el detalle)
  puntos      jsonb,

  -- Las 10 respuestas, una columna por pregunta
  objetivo    text,
  disciplina  text,
  experiencia text,
  frecuencia  text,
  equipo      text,
  lugar       text,
  duracion    text,
  debilidad   text,
  medir       text,
  motivacion  text,

  created_at  timestamptz not null default now()
);

-- Un quiz por usuario. Si algún día se reabre el funnel, quita este índice
-- o súbele la versión y cambia a (usuario_id, version).
create unique index if not exists quiz_responses_usuario_uniq
  on public.quiz_responses (usuario_id);

create index if not exists quiz_responses_bucket_idx
  on public.quiz_responses (bucket);

-- ── RLS: cada usuario sólo ve y escribe lo suyo ──
alter table public.quiz_responses enable row level security;

drop policy if exists "quiz_insert_propio" on public.quiz_responses;
create policy "quiz_insert_propio"
  on public.quiz_responses for insert
  to authenticated
  with check (auth.uid() = usuario_id);

drop policy if exists "quiz_select_propio" on public.quiz_responses;
create policy "quiz_select_propio"
  on public.quiz_responses for select
  to authenticated
  using (auth.uid() = usuario_id);

drop policy if exists "quiz_update_propio" on public.quiz_responses;
create policy "quiz_update_propio"
  on public.quiz_responses for update
  to authenticated
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ── Consulta útil: reparto de perfiles ──
-- select bucket, count(*) as usuarios,
--        round(100.0 * count(*) / sum(count(*)) over (), 1) as pct
-- from public.quiz_responses
-- group by bucket
-- order by usuarios desc;
