-- Schéma de base reconstitué et reproductible (tables + RLS).
-- À appliquer une seule fois : Supabase → SQL Editor, ou `supabase db push`.
-- Les tables existent déjà dans le projet en ligne : `if not exists` ne casse rien,
-- et les policies sont recréées proprement.

create extension if not exists "pgcrypto";

-- 1. Projets
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- 2. Pages
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  url text not null,
  title text,
  favicon_url text,
  og_image_url text,
  theme_color text,
  kind text not null default 'normal',
  reason text,
  group_id uuid references public.groups (id) on delete set null,
  visit_count integer not null default 1,
  pinned boolean not null default false,
  interesting boolean not null default false,
  last_visited_at timestamptz,
  expires_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists pages_user_last_visited_idx
  on public.pages (user_id, last_visited_at desc);
create index if not exists pages_user_group_idx on public.pages (user_id, group_id);

-- 3. RLS : chaque utilisateur ne voit que ses lignes.
alter table public.groups enable row level security;
alter table public.pages enable row level security;

drop policy if exists groups_own_rows on public.groups;
create policy groups_own_rows on public.groups
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists pages_own_rows on public.pages;
create policy pages_own_rows on public.pages
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 4. Vérification rapide (à exécuter après application) :
--    select count(*) from public.pages;            -- doit renvoyer 0 en anon
--    select policyname from pg_policies where tablename in ('pages','groups');
