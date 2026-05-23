-- ============================================================
-- Mini Tournify — Supabase schema (verze 2)
-- Spusť v: Supabase Dashboard → SQL Editor
-- ============================================================
-- ID generuje aplikace (text), ne databáze.

-- ── tournaments ───────────────────────────────────────────────
create table if not exists tournaments (
  id          text primary key,
  name        text not null,
  date        text not null,
  location    text not null,
  status      text not null default 'draft'
                check (status in ('draft', 'active', 'finished')),
  created_at  text not null
);

-- ── teams ─────────────────────────────────────────────────────
create table if not exists teams (
  id             text primary key,
  tournament_id  text not null references tournaments(id) on delete cascade,
  name           text not null,
  club_id        text
);

-- ── matches ───────────────────────────────────────────────────
create table if not exists matches (
  id             text primary key,
  tournament_id  text    not null references tournaments(id) on delete cascade,
  home_team_id   text    not null,
  away_team_id   text    not null,
  home_score     integer,
  away_score     integer,
  round          integer not null,
  played         boolean not null default false,
  constraint no_self_match check (home_team_id <> away_team_id)
);

-- Indexy pro rychlé dotazy per turnaj
create index if not exists idx_teams_tournament   on teams(tournament_id);
create index if not exists idx_matches_tournament on matches(tournament_id);

-- ============================================================
-- ROW LEVEL SECURITY — veřejný přístup (MVP bez přihlášení)
-- ============================================================

alter table tournaments enable row level security;
alter table teams       enable row level security;
alter table matches     enable row level security;

-- Tournaments
create policy "public_select_tournaments" on tournaments for select using (true);
create policy "public_insert_tournaments" on tournaments for insert with check (true);
create policy "public_update_tournaments" on tournaments for update using (true);

-- Teams
create policy "public_select_teams" on teams for select using (true);
create policy "public_insert_teams" on teams for insert with check (true);
create policy "public_delete_teams" on teams for delete using (true);

-- Matches
create policy "public_select_matches" on matches for select using (true);
create policy "public_insert_matches" on matches for insert with check (true);
create policy "public_update_matches" on matches for update using (true);
create policy "public_delete_matches" on matches for delete using (true);
