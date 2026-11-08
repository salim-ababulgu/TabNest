-- Suppression du compte par l'utilisateur lui-même (droit à l'effacement).
-- À appliquer une seule fois (Supabase → SQL Editor, ou `supabase db push`).
--
-- La fonction s'exécute avec les droits du propriétaire (security definer) mais
-- n'agit QUE sur les données de l'utilisateur connecté (auth.uid()).

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Utilisateur non connecté';
  end if;

  -- Liaison avec l'extension (si la table existe dans ce projet).
  if to_regclass('public.extension_links') is not null then
    delete from public.extension_links where user_id = auth.uid();
  end if;

  -- Pages et projets.
  delete from public.pages where user_id = auth.uid();
  delete from public.groups where user_id = auth.uid();

  -- Compte d'authentification (les éventuelles dépendances en cascade suivent).
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;
