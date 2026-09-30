-- WOW Admin Platform: settings, ads and SEO pages
-- Extends the existing dashboard foundation without replacing existing tables.

alter table public.app_settings
  add column if not exists google_analytics_id text,
  add column if not exists theme_config jsonb not null default '{
    "primary":"#16a34a",
    "secondary":"#2563eb",
    "background":"#f8fafc",
    "surface":"#ffffff",
    "font":"Tajawal",
    "radius":"16px"
  }'::jsonb;

create table if not exists public.ads_management (
  id uuid primary key default gen_random_uuid(),
  placement text not null check (placement in ('header','body_top','body_bottom','interstitial')),
  ad_code text not null,
  is_active boolean not null default true,
  target_platform text not null check (target_platform in ('web','android','both')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pages_and_seo (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null default '',
  meta_title text,
  meta_description text,
  meta_keywords text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ads_management enable row level security;
alter table public.pages_and_seo enable row level security;

-- Public clients may read active ads and published SEO pages.
drop policy if exists "Public can read active ads" on public.ads_management;
create policy "Public can read active ads"
on public.ads_management
for select
using (is_active = true);

drop policy if exists "Admins can manage ads" on public.ads_management;
create policy "Admins can manage ads"
on public.ads_management
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "Public can read published SEO pages" on public.pages_and_seo;
create policy "Public can read published SEO pages"
on public.pages_and_seo
for select
using (is_published = true);

drop policy if exists "Admins can manage SEO pages" on public.pages_and_seo;
create policy "Admins can manage SEO pages"
on public.pages_and_seo
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

-- The existing app_settings table was admin-only. Replace that policy with
-- public read + admin write so the website and Android app can consume it.
drop policy if exists "Admins can read settings" on public.app_settings;
create policy "Public can read settings"
on public.app_settings
for select
using (true);

drop policy if exists "Admins can update settings" on public.app_settings;
create policy "Admins can update settings"
on public.app_settings
for update to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop trigger if exists ads_management_set_updated_at on public.ads_management;
create trigger ads_management_set_updated_at
before update on public.ads_management
for each row execute function public.set_updated_at();

drop trigger if exists pages_and_seo_set_updated_at on public.pages_and_seo;
create trigger pages_and_seo_set_updated_at
before update on public.pages_and_seo
for each row execute function public.set_updated_at();

create index if not exists ads_management_platform_idx
  on public.ads_management(target_platform, is_active);

create index if not exists ads_management_placement_idx
  on public.ads_management(placement);

create index if not exists pages_and_seo_published_idx
  on public.pages_and_seo(is_published);

create index if not exists pages_and_seo_slug_idx
  on public.pages_and_seo(slug);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'app_settings'
    ) then
      alter publication supabase_realtime add table public.app_settings;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'ads_management'
    ) then
      alter publication supabase_realtime add table public.ads_management;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'pages_and_seo'
    ) then
      alter publication supabase_realtime add table public.pages_and_seo;
    end if;
  end if;
end
$$;
