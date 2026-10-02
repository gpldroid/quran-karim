create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

create table if not exists public.quran_settings (
  id integer primary key default 1 check (id = 1),
  default_reader_id text,
  default_reader_name text,
  favorite_surahs integer[] not null default '{}',
  tafsir_type text not null default 'default',
  default_surah integer not null default 1 check (default_surah between 1 and 114),
  autoplay boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.quran_settings(id) values (1)
on conflict (id) do nothing;

create table if not exists public.app_releases (
  id uuid primary key default gen_random_uuid(),
  version_code integer not null unique,
  version_name text not null,
  release_tag text,
  release_url text,
  download_url text,
  artifact_url text,
  storage_path text,
  changelog text,
  status text not null default 'published'
    check (status in ('draft','building','published','failed')),
  github_run_id bigint,
  github_release_id bigint,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.site_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_config(key,value)
values (
  'general',
  '{"site_name":"Quran Karim","description":"Quran control center","locale":"ar","theme":"dark"}'::jsonb
)
on conflict (key) do nothing;

create table if not exists public.islamway_cache (
  cache_key text primary key,
  payload jsonb not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.quran_settings enable row level security;
alter table public.app_releases enable row level security;
alter table public.site_config enable row level security;
alter table public.islamway_cache enable row level security;

drop policy if exists admin_self_read on public.admin_users;
drop policy if exists admin_read on public.admin_users;
create policy admin_read
on public.admin_users
for select to authenticated
using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists admin_manage_admins on public.admin_users;
drop policy if exists admin_manage_admins_iud on public.admin_users;
create policy admin_insert
on public.admin_users for insert to authenticated
with check ((select public.is_admin()));
create policy admin_update
on public.admin_users for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy admin_delete
on public.admin_users for delete to authenticated
using ((select public.is_admin()));

drop policy if exists quran_public_read on public.quran_settings;
drop policy if exists quran_read on public.quran_settings;
create policy quran_read
on public.quran_settings
for select to anon, authenticated
using (true);

drop policy if exists quran_admin_write on public.quran_settings;
create policy quran_admin_insert
on public.quran_settings for insert to authenticated
with check ((select public.is_admin()));
create policy quran_admin_update
on public.quran_settings for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy quran_admin_delete
on public.quran_settings for delete to authenticated
using ((select public.is_admin()));

drop policy if exists releases_public_read on public.app_releases;
drop policy if exists releases_read on public.app_releases;
create policy releases_read
on public.app_releases
for select to anon, authenticated
using (true);

drop policy if exists releases_admin_write on public.app_releases;
create policy releases_admin_insert
on public.app_releases for insert to authenticated
with check ((select public.is_admin()));
create policy releases_admin_update
on public.app_releases for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy releases_admin_delete
on public.app_releases for delete to authenticated
using ((select public.is_admin()));

drop policy if exists config_public_read on public.site_config;
drop policy if exists config_read on public.site_config;
create policy config_read
on public.site_config
for select to anon, authenticated
using (true);

drop policy if exists config_admin_write on public.site_config;
create policy config_admin_insert
on public.site_config for insert to authenticated
with check ((select public.is_admin()));
create policy config_admin_update
on public.site_config for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy config_admin_delete
on public.site_config for delete to authenticated
using ((select public.is_admin()));

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quran_settings_touch on public.quran_settings;
create trigger quran_settings_touch
before update on public.quran_settings
for each row execute function public.touch_updated_at();

drop trigger if exists site_config_touch on public.site_config;
create trigger site_config_touch
before update on public.site_config
for each row execute function public.touch_updated_at();

insert into storage.buckets (
  id,name,public,file_size_limit,allowed_mime_types
)
values (
  'apk','apk',true,52428800,
  array['application/vnd.android.package-archive','application/octet-stream']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists apk_public_read on storage.objects;
create policy apk_public_read
on storage.objects for select to public
using (bucket_id = 'apk');

drop policy if exists apk_admin_insert on storage.objects;
create policy apk_admin_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'apk' and (select public.is_admin()));

drop policy if exists apk_admin_update on storage.objects;
create policy apk_admin_update
on storage.objects for update to authenticated
using (bucket_id = 'apk' and (select public.is_admin()))
with check (bucket_id = 'apk' and (select public.is_admin()));

drop policy if exists apk_admin_delete on storage.objects;
create policy apk_admin_delete
on storage.objects for delete to authenticated
using (bucket_id = 'apk' and (select public.is_admin()));

revoke all on public.admin_users from anon;
grant select,insert,update,delete on public.admin_users to authenticated;

revoke all on public.quran_settings from public;
grant select on public.quran_settings to anon,authenticated;
grant insert,update,delete on public.quran_settings to authenticated;

revoke all on public.app_releases from public;
grant select on public.app_releases to anon,authenticated;
grant insert,update,delete on public.app_releases to authenticated;

revoke all on public.site_config from public;
grant select on public.site_config to anon,authenticated;
grant insert,update,delete on public.site_config to authenticated;

revoke all on public.islamway_cache from public,anon,authenticated;

revoke all on function public.rls_auto_enable() from public;
revoke all on function public.rls_auto_enable() from anon;
revoke all on function public.rls_auto_enable() from authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='quran_settings'
  ) then
    alter publication supabase_realtime add table public.quran_settings;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='app_releases'
  ) then
    alter publication supabase_realtime add table public.app_releases;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='site_config'
  ) then
    alter publication supabase_realtime add table public.site_config;
  end if;
end $$;