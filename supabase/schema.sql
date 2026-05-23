-- ============================================================
-- Mini Tournify — Supabase Schema
-- Spustit v: Supabase Dashboard > SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── clubs ────────────────────────────────────────────────────
-- Seed data z rugbyunion.cz (viz data/clubs.ts)
create table if not exists clubs (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  city             text not null,
  website          text,
  rugby_union_url  text,
  created_at       timestamptz default now()
);

-- ── tournaments ───────────────────────────────────────────────
create table if not exists tournaments (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  date        date not null,
  location    text not null,
  status      text not null default 'draft'
                check (status in ('draft', 'active', 'finished')),
  created_at  timestamptz default now()
);

-- ── teams ─────────────────────────────────────────────────────
-- Tým = klub účastnící se konkrétního turnaje.
-- club_id je volitelné (lze přidat tým bez záznamu v clubs).
create table if not exists teams (
  id             uuid primary key default uuid_generate_v4(),
  tournament_id  uuid not null references tournaments(id) on delete cascade,
  name           text not null,
  club_id        uuid references clubs(id),
  created_at     timestamptz default now()
);

-- ── matches ───────────────────────────────────────────────────
create table if not exists matches (
  id             uuid primary key default uuid_generate_v4(),
  tournament_id  uuid not null references tournaments(id) on delete cascade,
  home_team_id   uuid not null references teams(id),
  away_team_id   uuid not null references teams(id),
  home_score     integer,
  away_score     integer,
  round          integer not null,
  played         boolean not null default false,
  created_at     timestamptz default now(),
  constraint no_self_match check (home_team_id <> away_team_id)
);

-- Indexy pro rychlé dotazy per turnaj
create index if not exists idx_teams_tournament   on teams(tournament_id);
create index if not exists idx_matches_tournament on matches(tournament_id);

-- ── standings view ────────────────────────────────────────────
-- Pohled pro přímý SQL dotaz (volitelné — app si počítá sama).
create or replace view standings as
select
  t.id              as team_id,
  t.tournament_id,
  t.name            as team_name,

  count(*) filter (where m.played)                                                                              as played,

  count(*) filter (where m.played and (
    (m.home_team_id = t.id and m.home_score > m.away_score) or
    (m.away_team_id = t.id and m.away_score > m.home_score)
  ))                                                                                                            as won,

  count(*) filter (where m.played and m.home_score = m.away_score and
    (m.home_team_id = t.id or m.away_team_id = t.id))                                                          as drawn,

  count(*) filter (where m.played and (
    (m.home_team_id = t.id and m.home_score < m.away_score) or
    (m.away_team_id = t.id and m.away_score < m.home_score)
  ))                                                                                                            as lost,

  coalesce(sum(case when m.home_team_id = t.id then m.home_score
                    else m.away_score end) filter (where m.played), 0)                                         as goals_for,

  coalesce(sum(case when m.home_team_id = t.id then m.away_score
                    else m.home_score end) filter (where m.played), 0)                                         as goals_against,

  coalesce(
    3 * count(*) filter (where m.played and (
      (m.home_team_id = t.id and m.home_score > m.away_score) or
      (m.away_team_id = t.id and m.away_score > m.home_score)
    )) +
    count(*) filter (where m.played and m.home_score = m.away_score and
      (m.home_team_id = t.id or m.away_team_id = t.id)),
    0
  )                                                                                                             as points

from teams t
left join matches m
  on (m.home_team_id = t.id or m.away_team_id = t.id)
  and m.tournament_id = t.tournament_id
group by t.id, t.tournament_id, t.name
order by points desc, (goals_for - goals_against) desc, goals_for desc, team_name;

-- ── RLS (pro Phase 2 — přidání autentizace) ──────────────────
-- alter table tournaments  enable row level security;
-- alter table teams        enable row level security;
-- alter table matches      enable row level security;
-- create policy "public read" on tournaments for select using (true);
-- create policy "public read" on teams     for select using (true);
-- create policy "public read" on matches   for select using (true);
