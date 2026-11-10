-- 안부: 군인가족이 추천하는 지역 카페 (Supabase SQL Editor에서 실행)
create table if not exists public.cafe_tips (
  id bigint generated always as identity primary key,
  region text not null check (char_length(region) between 1 and 30),
  name text not null check (char_length(name) between 1 and 60),
  url text not null check (url ~ '^https://(m\.)?cafe\.naver\.com/' and char_length(url) <= 200),
  note text check (char_length(note) <= 120),
  created_at timestamptz not null default now()
);
alter table public.cafe_tips enable row level security;
drop policy if exists "누구나 읽기" on public.cafe_tips;
create policy "누구나 읽기" on public.cafe_tips for select to anon, authenticated using (true);
drop policy if exists "누구나 추천 등록" on public.cafe_tips;
create policy "누구나 추천 등록" on public.cafe_tips for insert to anon, authenticated with check (true);
create index if not exists cafe_tips_region_idx on public.cafe_tips (region, created_at desc);
