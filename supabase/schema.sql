-- 120 Card Math v2 Supabase schema
-- Run this once in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 40)
);

create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id text not null,
  target integer not null,
  status text not null default 'tried',
  score integer not null default 0,
  expression text,
  token_length integer,
  best_length integer,
  symbols integer,
  cards integer,
  attempts integer not null default 0,
  hint_level integer not null default 0,
  revealed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, set_id, target),
  constraint progress_target_range check (target between 1 and 120),
  constraint progress_status_valid check (status in ('tried', 'correct', 'best', 'revealed')),
  constraint progress_score_range check (score between 0 and 100),
  constraint progress_attempts_range check (attempts >= 0),
  constraint progress_hint_level_range check (hint_level between 0 and 4),
  constraint progress_token_length_range check (token_length is null or token_length > 0),
  constraint progress_best_length_range check (best_length is null or best_length > 0),
  constraint progress_symbols_range check (symbols is null or symbols >= 0),
  constraint progress_cards_range check (cards is null or cards >= 0)
);

create index if not exists progress_set_score_idx
  on public.progress (set_id, score desc, updated_at asc);

create index if not exists progress_user_updated_idx
  on public.progress (user_id, updated_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists progress_touch_updated_at on public.progress;
create trigger progress_touch_updated_at
before update on public.progress
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  fallback_name text;
begin
  fallback_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    split_part(new.email, '@', 1),
    'Player'
  );

  insert into public.profiles (id, display_name)
  values (new.id, left(fallback_name, 40))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.progress enable row level security;

drop policy if exists "Profiles are readable by everyone" on public.profiles;
create policy "Profiles are readable by everyone"
on public.profiles
for select
using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can read their own progress" on public.progress;
create policy "Users can read their own progress"
on public.progress
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own progress" on public.progress;
create policy "Users can insert their own progress"
on public.progress
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own progress" on public.progress;
create policy "Users can update their own progress"
on public.progress
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own progress" on public.progress;
create policy "Users can delete their own progress"
on public.progress
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.get_leaderboard(
  p_set_id text,
  p_limit integer default 20
)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  total_score bigint,
  solved_count bigint,
  best_count bigint,
  last_played_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with totals as (
    select
      p.user_id,
      coalesce(pr.display_name, 'Player') as display_name,
      sum(p.score)::bigint as total_score,
      count(*) filter (where p.status in ('correct', 'best'))::bigint as solved_count,
      count(*) filter (where p.status = 'best')::bigint as best_count,
      max(p.updated_at) as last_played_at
    from public.progress p
    left join public.profiles pr on pr.id = p.user_id
    where p.set_id = p_set_id
      and p.score > 0
    group by p.user_id, pr.display_name
  )
  select
    dense_rank() over (
      order by total_score desc, best_count desc, solved_count desc, last_played_at asc
    ) as rank,
    totals.user_id,
    totals.display_name,
    totals.total_score,
    totals.solved_count,
    totals.best_count,
    totals.last_played_at
  from totals
  order by total_score desc, best_count desc, solved_count desc, last_played_at asc
  limit least(greatest(p_limit, 1), 100);
$$;

grant execute on function public.get_leaderboard(text, integer) to anon, authenticated;

create or replace function public.get_global_leaderboard(
  p_limit integer default 20
)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  total_score bigint,
  solved_count bigint,
  best_count bigint,
  set_count bigint,
  last_played_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with totals as (
    select
      p.user_id,
      coalesce(pr.display_name, 'Player') as display_name,
      sum(p.score)::bigint as total_score,
      count(*) filter (where p.status in ('correct', 'best'))::bigint as solved_count,
      count(*) filter (where p.status = 'best')::bigint as best_count,
      count(distinct p.set_id)::bigint as set_count,
      max(p.updated_at) as last_played_at
    from public.progress p
    left join public.profiles pr on pr.id = p.user_id
    where p.score > 0
    group by p.user_id, pr.display_name
  )
  select
    dense_rank() over (
      order by total_score desc, best_count desc, solved_count desc, set_count desc, last_played_at asc
    ) as rank,
    totals.user_id,
    totals.display_name,
    totals.total_score,
    totals.solved_count,
    totals.best_count,
    totals.set_count,
    totals.last_played_at
  from totals
  order by total_score desc, best_count desc, solved_count desc, set_count desc, last_played_at asc
  limit least(greatest(p_limit, 1), 100);
$$;

grant execute on function public.get_global_leaderboard(integer) to anon, authenticated;
