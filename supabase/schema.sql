-- ============================================================
-- RugbyHub — Supabase schema (verze 2 + migrace skupin)
-- Spusť v: Supabase Dashboard → SQL Editor
-- ============================================================
-- Část A: Základní tabulky (původní schema)
-- Část B: Migrace — přidání phases, groups, group_teams
-- ============================================================

-- ── A. ZÁKLADNÍ TABULKY ──────────────────────────────────────

create table if not exists tournaments (
  id          text primary key,
  name        text not null,
  date        text not null,
  location    text not null,
  status      text not null default 'draft'
                check (status in ('draft', 'active', 'finished')),
  created_at  text not null
);

create table if not exists teams (
  id             text primary key,
  tournament_id  text not null references tournaments(id) on delete cascade,
  name           text not null,
  club_id        text
);

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

-- ── B. MIGRACE: SKUPINOVÁ STRUKTURA ─────────────────────────
-- Bezpečné spuštění i na existující databázi.

-- Fáze turnaje (Group Phase, Cup, Plate, …)
create table if not exists phases (
  id             text primary key,
  tournament_id  text not null references tournaments(id) on delete cascade,
  name           text not null,
  order_index    integer not null default 0
);

-- Skupiny uvnitř fáze (Skupina A, Cup SF1, …)
-- Tabulka pojmenována tournament_groups (groups je rezervované klíčové slovo v PostgreSQL)
create table if not exists tournament_groups (
  id             text primary key,
  tournament_id  text not null references tournaments(id) on delete cascade,
  phase_id       text not null references phases(id) on delete cascade,
  name           text not null,
  order_index    integer not null default 0
);

-- Přiřazení týmů do skupin (vazební tabulka — tým může být ve více skupinách napříč fázemi)
create table if not exists group_teams (
  id         text primary key,
  group_id   text not null references tournament_groups(id) on delete cascade,
  team_id    text not null references teams(id) on delete cascade,
  unique(group_id, team_id)
);

-- Rozšíření tabulky matches o phase_id a group_id (nullable — zachová existující data)
alter table matches add column if not exists phase_id text references phases(id) on delete set null;
alter table matches add column if not exists group_id text references tournament_groups(id) on delete set null;

-- ── INDEXY ───────────────────────────────────────────────────
create index if not exists idx_teams_tournament      on teams(tournament_id);
create index if not exists idx_matches_tournament    on matches(tournament_id);
create index if not exists idx_phases_tournament     on phases(tournament_id);
create index if not exists idx_groups_phase          on tournament_groups(phase_id);
create index if not exists idx_groups_tournament     on tournament_groups(tournament_id);
create index if not exists idx_group_teams_group     on group_teams(group_id);
create index if not exists idx_group_teams_team      on group_teams(team_id);
create index if not exists idx_matches_group         on matches(group_id);
create index if not exists idx_matches_phase         on matches(phase_id);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
-- Veřejný přístup bez přihlášení (MVP)

alter table tournaments      enable row level security;
alter table teams            enable row level security;
alter table matches          enable row level security;
alter table phases           enable row level security;
alter table tournament_groups enable row level security;
alter table group_teams      enable row level security;

-- tournaments
create policy "public_select_tournaments"  on tournaments for select  using (true);
create policy "public_insert_tournaments"  on tournaments for insert  with check (true);
create policy "public_update_tournaments"  on tournaments for update  using (true);

-- teams
create policy "public_select_teams"        on teams for select  using (true);
create policy "public_insert_teams"        on teams for insert  with check (true);
create policy "public_delete_teams"        on teams for delete  using (true);

-- matches
create policy "public_select_matches"      on matches for select  using (true);
create policy "public_insert_matches"      on matches for insert  with check (true);
create policy "public_update_matches"      on matches for update  using (true);
create policy "public_delete_matches"      on matches for delete  using (true);

-- phases
create policy "public_select_phases"       on phases for select  using (true);
create policy "public_insert_phases"       on phases for insert  with check (true);
create policy "public_update_phases"       on phases for update  using (true);
create policy "public_delete_phases"       on phases for delete  using (true);

-- tournament_groups
create policy "public_select_groups"       on tournament_groups for select  using (true);
create policy "public_insert_groups"       on tournament_groups for insert  with check (true);
create policy "public_update_groups"       on tournament_groups for update  using (true);
create policy "public_delete_groups"       on tournament_groups for delete  using (true);

-- group_teams
create policy "public_select_group_teams"  on group_teams for select  using (true);
create policy "public_insert_group_teams"  on group_teams for insert  with check (true);
create policy "public_delete_group_teams"  on group_teams for delete  using (true);
