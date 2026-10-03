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

-- Role-based access control and audit trail.
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('Super Admin','Content Manager','Release Manager')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated by default as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  table_name text not null,
  operation text not null check (operation in ('INSERT','UPDATE','DELETE')),
  record_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.user_roles from anon;
grant select on public.user_roles to authenticated;
revoke all on public.audit_logs from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('Super Admin','Content Manager','Release Manager')
  ) or exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists user_roles_self_read on public.user_roles;
create policy user_roles_self_read on public.user_roles
for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists user_roles_admin_write on public.user_roles;
drop policy if exists user_roles_admin_insert on public.user_roles;
drop policy if exists user_roles_admin_update on public.user_roles;
drop policy if exists user_roles_admin_delete on public.user_roles;
create policy user_roles_admin_insert on public.user_roles
for insert to authenticated
with check ((select public.is_admin()));
create policy user_roles_admin_update on public.user_roles
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy user_roles_admin_delete on public.user_roles
for delete to authenticated
using ((select public.is_admin()));

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare rid text;
begin
  if tg_op = 'DELETE' then
    rid := coalesce(to_jsonb(old)->>'id', to_jsonb(old)->>'key');
    insert into public.audit_logs(actor_user_id, table_name, operation, record_id, old_data)
    values (auth.uid(), tg_table_name, tg_op, rid, to_jsonb(old));
    return old;
  elsif tg_op = 'UPDATE' then
    rid := coalesce(to_jsonb(new)->>'id', to_jsonb(new)->>'key');
    insert into public.audit_logs(actor_user_id, table_name, operation, record_id, old_data, new_data)
    values (auth.uid(), tg_table_name, tg_op, rid, to_jsonb(old), to_jsonb(new));
    return new;
  else
    rid := coalesce(to_jsonb(new)->>'id', to_jsonb(new)->>'key');
    insert into public.audit_logs(actor_user_id, table_name, operation, record_id, new_data)
    values (auth.uid(), tg_table_name, tg_op, rid, to_jsonb(new));
    return new;
  end if;
end;
$$;

drop trigger if exists quran_settings_audit on public.quran_settings;
create trigger quran_settings_audit after insert or update or delete on public.quran_settings
for each row execute function public.audit_row_change();

drop trigger if exists site_config_audit on public.site_config;
create trigger site_config_audit after insert or update or delete on public.site_config
for each row execute function public.audit_row_change();

drop trigger if exists app_releases_audit on public.app_releases;
create trigger app_releases_audit after insert or update or delete on public.app_releases
for each row execute function public.audit_row_change();

revoke all on function public.audit_row_change() from public, anon, authenticated;

create or replace function public.keep_latest_app_releases()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.app_releases
  where id in (
    select id from public.app_releases
    order by created_at desc, id desc
    offset 5
  );
  return null;
end;
$$;

drop trigger if exists app_releases_keep_latest_5 on public.app_releases;
revoke all on function public.keep_latest_app_releases() from public, anon, authenticated;
create trigger app_releases_keep_latest_5
after insert or update on public.app_releases
for each statement execute function public.keep_latest_app_releases();

drop trigger if exists user_roles_touch on public.user_roles;
create trigger user_roles_touch before update on public.user_roles
for each row execute function public.touch_updated_at();

create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_table_record_idx on public.audit_logs(table_name, record_id);
