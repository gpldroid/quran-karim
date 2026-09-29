-- WOW Dashboard foundation: roles, categories and app settings
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'editor' check (role in ('admin','editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    case when not exists (select 1 from public.profiles) then 'admin' else 'editor' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_items
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists featured boolean not null default false;

create table if not exists public.app_settings (
  id boolean primary key default true check (id),
  site_name text not null default 'WOW',
  site_description text not null default 'منصة واحدة للويب ولوحة التحكم والتطبيق',
  logo_url text,
  primary_color text not null default '#2563eb',
  maintenance_mode boolean not null default false,
  contact_email text,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id)
values (true)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories for select
using (true);

drop policy if exists "Editors can manage categories" on public.categories;
create policy "Editors can manage categories"
on public.categories for all to authenticated
using (public.current_user_role() in ('admin','editor'))
with check (public.current_user_role() in ('admin','editor'));

drop policy if exists "Admins can read settings" on public.app_settings;
create policy "Admins can read settings"
on public.app_settings for select to authenticated
using (public.current_user_role() = 'admin');

drop policy if exists "Admins can update settings" on public.app_settings;
create policy "Admins can update settings"
on public.app_settings for update to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Authenticated users can manage content" on public.content_items;
drop policy if exists "Editors can manage content" on public.content_items;
create policy "Editors can manage content"
on public.content_items for all to authenticated
using (public.current_user_role() in ('admin','editor'))
with check (public.current_user_role() in ('admin','editor'));

create index if not exists content_items_category_idx on public.content_items(category_id);
create index if not exists content_items_featured_idx on public.content_items(featured);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at before update on public.app_settings
for each row execute function public.set_updated_at();
