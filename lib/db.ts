/**
 * lib/db.ts — Supabase CRUD vrstva
 * Všechny funkce jsou async a throwují Error při selhání.
 * Stránky si samy obalí try/catch a zobrazí chybový stav.
 */

import { supabase } from './supabaseClient';
import { Match, Team, Tournament, TournamentStatus } from '../types';

// ── Mapovací helpery (DB snake_case ↔ TS camelCase) ──────────

function dbToTournament(row: Record<string, unknown>): Tournament {
  return {
    id:        row.id as string,
    name:      row.name as string,
    date:      row.date as string,
    location:  row.location as string,
    status:    row.status as TournamentStatus,
    createdAt: row.created_at as string,
  };
}

function tournamentToDb(t: Tournament) {
  return {
    id:         t.id,
    name:       t.name,
    date:       t.date,
    location:   t.location,
    status:     t.status,
    created_at: t.createdAt,
  };
}

function dbToTeam(row: Record<string, unknown>): Team {
  return {
    id:           row.id as string,
    tournamentId: row.tournament_id as string,
    name:         row.name as string,
    clubId:       (row.club_id as string | null) ?? undefined,
  };
}

function teamToDb(t: Team) {
  return {
    id:            t.id,
    tournament_id: t.tournamentId,
    name:          t.name,
    club_id:       t.clubId ?? null,
  };
}

function dbToMatch(row: Record<string, unknown>): Match {
  return {
    id:           row.id as string,
    tournamentId: row.tournament_id as string,
    homeTeamId:   row.home_team_id as string,
    awayTeamId:   row.away_team_id as string,
    homeScore:    row.home_score as number | null,
    awayScore:    row.away_score as number | null,
    round:        row.round as number,
    played:       row.played as boolean,
  };
}

function matchToDb(m: Match) {
  return {
    id:            m.id,
    tournament_id: m.tournamentId,
    home_team_id:  m.homeTeamId,
    away_team_id:  m.awayTeamId,
    home_score:    m.homeScore,
    away_score:    m.awayScore,
    round:         m.round,
    played:        m.played,
  };
}

// ── Tournaments ───────────────────────────────────────────────

/** Vrátí všechny turnaje seřazené od nejnovějšího. */
export async function getTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToTournament);
}

/** Vrátí jeden turnaj podle ID, nebo null pokud neexistuje. */
export async function getTournamentById(id: string): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? dbToTournament(data) : null;
}

/** Vytvoří nebo aktualizuje turnaj (upsert). */
export async function saveTournament(t: Tournament): Promise<void> {
  const { error } = await supabase
    .from('tournaments')
    .upsert(tournamentToDb(t));

  if (error) throw new Error(error.message);
}

// ── Teams ─────────────────────────────────────────────────────

/** Vrátí všechny týmy daného turnaje. */
export async function getTeamsForTournament(tournamentId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', tournamentId);

  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToTeam);
}

/**
 * Nahradí všechny týmy turnaje (delete + insert).
 * Volat vždy s `tournamentId` — umožňuje i vymazání všech týmů (prázdné pole).
 */
export async function replaceTeams(tournamentId: string, teams: Team[]): Promise<void> {
  const { error: delErr } = await supabase
    .from('teams')
    .delete()
    .eq('tournament_id', tournamentId);
  if (delErr) throw new Error(delErr.message);

  if (teams.length === 0) return;

  const { error: insErr } = await supabase
    .from('teams')
    .insert(teams.map(teamToDb));
  if (insErr) throw new Error(insErr.message);
}

// ── Matches ───────────────────────────────────────────────────

/** Vrátí všechny zápasy daného turnaje seřazené podle kola. */
export async function getMatchesForTournament(tournamentId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('round', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToMatch);
}

/**
 * Nahradí všechny zápasy turnaje (delete + insert).
 * Volat s prázdným polem pro smazání celého rozpisu.
 */
export async function replaceMatches(tournamentId: string, matches: Match[]): Promise<void> {
  const { error: delErr } = await supabase
    .from('matches')
    .delete()
    .eq('tournament_id', tournamentId);
  if (delErr) throw new Error(delErr.message);

  if (matches.length === 0) return;

  const { error: insErr } = await supabase
    .from('matches')
    .insert(matches.map(matchToDb));
  if (insErr) throw new Error(insErr.message);
}

/** Aktualizuje výsledek jednoho zápasu. */
export async function updateMatch(match: Match): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({
      home_score: match.homeScore,
      away_score: match.awayScore,
      played:     match.played,
    })
    .eq('id', match.id);

  if (error) throw new Error(error.message);
}
