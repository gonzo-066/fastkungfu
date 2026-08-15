-- ═══════════════════════════════════════════════════
-- Strike IQ — quiz funnel de alta (10 preguntas, metodología Ryan Levesque)
-- Ejecutar en el SQL Editor del panel de Supabase.
--
-- Sigue el patrón de 'sesiones': usuario_id apuntando a la tabla 'usuarios'.
-- Una fila por quiz completado.
--
-- OJO: el quiz se responde ANTES de registrarse, así que la app guarda la
-- respuesta en local y la sube en cuanto hay sesión (flushPendingQuiz).
--
-- Si ya creaste la versión anterior de esta tabla, ejecuta primero:
--   drop table if exists public.quiz_responses;
-- (las columnas cambiaron por completo)
-- ═══════════════════════════════════════════════════

create table if not exists public.quiz_responses (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null references public.usuarios (id) on delete cascade,
  fecha          timestamptz not null default now(),
  idioma         text,
  version        integer not null default 3,

  -- Segmentación y cualificación calculadas por la app
  bucket         text not null,          -- competidor | fitness | coach | gimnasio | principiante
  lead_score     integer,                -- 0-100

  -- P1: pregunta abierta (SMIQ). El texto en bruto es lo más valioso del
  -- funnel: de aquí salen los ángulos de copy.
  smiq_texto     text,

  -- P2-P9: respuestas cerradas (se guarda el id de la opción, no el texto,
  -- para poder agrupar sin importar el idioma)
  q2_situacion   text,
  q3_experiencia text,
  q4_frecuencia  text,
  q5_objetivo    text,
  q6_pain_point  text,
  q7_inversion   text,
  q8_edad        text,
  q9_pais        text,

  -- P10: captura de lead
  q10_nombre     text,
  q10_email      text,
  q10_gdpr       boolean not null default false,

  created_at     timestamptz not null default now()
);

-- Un quiz por usuario
create unique index if not exists quiz_responses_usuario_uniq
  on public.quiz_responses (usuario_id);

create index if not exists quiz_responses_bucket_idx     on public.quiz_responses (bucket);
create index if not exists quiz_responses_lead_score_idx on public.quiz_responses (lead_score desc);
create index if not exists quiz_responses_email_idx      on public.quiz_responses (q10_email);

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

-- ═══════════════════════════════════════════════════
-- CONSULTAS ÚTILES PARA EL FUNNEL
-- ═══════════════════════════════════════════════════

-- Reparto de perfiles
-- select bucket, count(*) as usuarios,
--        round(avg(lead_score), 1) as score_medio
-- from public.quiz_responses
-- group by bucket order by usuarios desc;

-- Leads calientes: los que más invierten y más entrenan
-- select q10_nombre, q10_email, bucket, lead_score, q7_inversion, q9_pais
-- from public.quiz_responses
-- where lead_score >= 60 and q10_gdpr
-- order by lead_score desc;

-- Las respuestas abiertas de un segmento: el copy sale de aquí
-- select smiq_texto, lead_score
-- from public.quiz_responses
-- where bucket = 'competidor' and length(smiq_texto) > 40
-- order by lead_score desc;

-- Dolor principal por perfil
-- select bucket, q6_pain_point, count(*)
-- from public.quiz_responses
-- group by bucket, q6_pain_point order by bucket, count(*) desc;
