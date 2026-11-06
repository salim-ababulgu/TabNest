-- Page d'administration : statistiques agrégées, réservées à l'éditeur.
-- Aucun secret ici. La protection repose sur l'e-mail de l'administrateur :
-- seule la personne connectée avec cet e-mail peut appeler les fonctions.
--
-- À appliquer une seule fois (Supabase → SQL Editor, ou `supabase db push`).

-- 1. Fonction interne : l'utilisateur connecté est-il l'administrateur ?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and lower(u.email) = 'salimababulgu@gmail.com'
  )
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

-- 2. Statistiques agrégées (JSON).
create or replace function public.admin_stats()
returns json
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Accès réservé à l''administrateur';
  end if;

  return (
    select json_build_object(
      'usersTotal',    (select count(*) from auth.users),
      'usersLast7d',   (select count(*) from auth.users where created_at > now() - interval '7 days'),
      'pagesTotal',    (select count(*) from public.pages where deleted_at is null),
      'pagesLast7d',   (select count(*) from public.pages where deleted_at is null and created_at > now() - interval '7 days'),
      'pagesLast24h',  (select count(*) from public.pages where deleted_at is null and created_at > now() - interval '24 hours'),
      'pagesExpired',  (select count(*) from public.pages where deleted_at is null and expires_at < now()),
      'groupsTotal',   (select count(*) from public.groups)
    )
  );
end;
$$;

revoke all on function public.admin_stats() from public;
revoke all on function public.admin_stats() from anon;
grant execute on function public.admin_stats() to authenticated;

-- 3. Derniers comptes créés (pour le suivi, administrateur uniquement).
create or replace function public.admin_recent_users()
returns table (email text, created_at timestamptz)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Accès réservé à l''administrateur';
  end if;

  return query
    select u.email::text, u.created_at
    from auth.users u
    order by u.created_at desc
    limit 10;
end;
$$;

revoke all on function public.admin_recent_users() from public;
revoke all on function public.admin_recent_users() from anon;
grant execute on function public.admin_recent_users() to authenticated;
