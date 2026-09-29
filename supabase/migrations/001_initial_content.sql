create extension if not exists "pgcrypto";

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('article','product','page')),
  title text not null,
  slug text not null unique,
  excerpt text,
  body text,
  image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists content_items_set_updated_at on public.content_items;
create trigger content_items_set_updated_at
before update on public.content_items
for each row execute function public.set_updated_at();

alter table public.content_items enable row level security;

drop policy if exists "Public can read published content" on public.content_items;
create policy "Public can read published content"
on public.content_items
for select
using (published = true);

drop policy if exists "Authenticated users can manage content" on public.content_items;
create policy "Authenticated users can manage content"
on public.content_items
for all
to authenticated
using (true)
with check (true);

create index if not exists content_items_type_idx on public.content_items(type);
create index if not exists content_items_published_idx on public.content_items(published);
create index if not exists content_items_created_at_idx on public.content_items(created_at desc);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'content_items'
     ) then
    alter publication supabase_realtime add table public.content_items;
  end if;
end
$$;