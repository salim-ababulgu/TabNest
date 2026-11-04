-- TabNest : liaison de l'extension par code à usage unique.
-- Aucun secret dans ce fichier. Les codes et jetons sont stockés hachés.

-- 1. Tables ------------------------------------------------------------------

create table if not exists public.extension_pairing_codes (
  code_hash   text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists public.extension_links (
  token_hash  text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz
);

alter table public.extension_pairing_codes enable row level security;
alter table public.extension_links enable row level security;

-- Le site voit et peut révoquer ses propres liaisons.
-- Personne ne lit directement les codes : seules les fonctions ci-dessous les utilisent.
create policy "extension_links_select_own" on public.extension_links
  for select to authenticated
  using (user_id = auth.uid());

create policy "extension_links_update_own" on public.extension_links
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 2. Durée de vie d'une page (même règle que l'extension) ---------------------

create or replace function public.page_lifetime_hours(p_kind text, p_reason text, p_visits int)
returns numeric
language sql
immutable
as $$
  select (
    case
      when p_reason = 'decide' then 72
      when p_reason = 'finish' then 168
      when p_reason = 'explore' then 336
      when p_reason = 'remember' then 2160
      when p_kind = 'documentation' then 720
      when p_kind = 'ephemeral' then 168
      else 72
    end
  ) * (1 + greatest(0, p_visits) * 0.5)
$$;

-- 3. Le site crée un code (utilisateur connecté) ----------------------------

create or replace function public.create_extension_code()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_raw text := '';
  i int;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  v_bytes := extensions.gen_random_bytes(8);
  for i in 0..7 loop
    v_raw := v_raw || substr(v_alphabet, (get_byte(v_bytes, i) % 32) + 1, 1);
  end loop;

  -- On annule les anciens codes non utilisés de cet utilisateur.
  delete from public.extension_pairing_codes
   where user_id = v_uid and used_at is null;

  insert into public.extension_pairing_codes (code_hash, user_id, expires_at)
  values (
    encode(extensions.digest(v_raw, 'sha256'), 'hex'),
    v_uid,
    now() + interval '5 minutes'
  );

  return substr(v_raw, 1, 4) || '-' || substr(v_raw, 5, 4);
end;
$$;

-- 4. L'extension échange le code contre un jeton de liaison -------------------

create or replace function public.redeem_extension_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text := encode(
    extensions.digest(
      upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')),
      'sha256'
    ),
    'hex'
  );
  v_uid uuid;
  v_token text;
begin
  update public.extension_pairing_codes
     set used_at = now()
   where code_hash = v_hash
     and used_at is null
     and expires_at > now()
  returning user_id into v_uid;

  if v_uid is null then
    raise exception 'invalid_or_expired_code' using errcode = 'P0001';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.extension_links (token_hash, user_id)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'), v_uid);

  return json_build_object('token', v_token, 'user_id', v_uid);
end;
$$;

-- 5. L'extension enregistre une page avec son jeton --------------------------

create or replace function public.capture_page_with_link(
  p_token text,
  p_url text,
  p_title text,
  p_favicon_url text,
  p_og_image_url text,
  p_theme_color text,
  p_increment boolean
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid;
  v_page public.pages%rowtype;
  v_visits int;
begin
  select l.user_id into v_uid
    from public.extension_links l
   where l.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
     and l.revoked_at is null;

  if v_uid is null then
    raise exception 'invalid_link' using errcode = '42501';
  end if;

  select * into v_page
    from public.pages
   where user_id = v_uid and url = p_url
   order by created_at desc
   limit 1;

  if found then
    v_visits := coalesce(v_page.visit_count, 0) + case when p_increment then 1 else 0 end;

    update public.pages
       set visit_count = v_visits,
           last_visited_at = case when p_increment then now() else last_visited_at end,
           expires_at = case
             when p_increment then
               now() + public.page_lifetime_hours(v_page.kind, v_page.reason, v_visits)::double precision * interval '1 hour'
             else expires_at
           end,
           title = coalesce(nullif(p_title, ''), title),
           favicon_url = coalesce(nullif(p_favicon_url, ''), favicon_url),
           og_image_url = coalesce(nullif(p_og_image_url, ''), og_image_url),
           theme_color = coalesce(nullif(p_theme_color, ''), theme_color)
     where id = v_page.id;
  else
    insert into public.pages (
      user_id, url, title, favicon_url, og_image_url, theme_color,
      kind, visit_count, last_visited_at, expires_at
    )
    values (
      v_uid, p_url, nullif(p_title, ''), nullif(p_favicon_url, ''),
      nullif(p_og_image_url, ''), nullif(p_theme_color, ''),
      'normal', 1, now(),
      now() + public.page_lifetime_hours('normal', null, 0)::double precision * interval '1 hour'
    );
  end if;
end;
$$;

-- 6. Droits d'appel -------------------------------------------------------------

revoke all on function public.page_lifetime_hours(text, text, int) from public, anon;
revoke all on function public.create_extension_code() from public, anon;
grant execute on function public.create_extension_code() to authenticated;

revoke all on function public.redeem_extension_code(text) from public;
grant execute on function public.redeem_extension_code(text) to anon, authenticated;

revoke all on function public.capture_page_with_link(text, text, text, text, text, text, boolean) from public;
grant execute on function public.capture_page_with_link(text, text, text, text, text, text, boolean) to anon, authenticated;
