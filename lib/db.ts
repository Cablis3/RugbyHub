/**
 * lib/db.ts — Supabase CRUD vrstva
 * Všechny funkce jsou async a throwují Error při selhání.
 */

import { supabase } from './supabaseClient';
import { Group, GroupTeam, Match, Phase, Team, Tournament, TournamentStatus } from '../types';

// ── Mapovací helpery ─────────────────────────────────────────

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

function dbToPhase(row: Record<string, unknown>): Phase {
  return {
    id:           row.id as string,
    tournamentId: row.tournament_id as string,
    name:         row.name as string,
    orderIndex:   row.order_index as number,
  };
}

function phaseToDb(p: Phase) {
  return {
    id:            p.id,
    tournament_id: p.tournamentId,
    name:          p.name,
    order_index:   p.orderIndex,
  };
}

function dbToGroup(row: Record<string, unknown>): Group {
  return {
    id:           row.id as string,
    tournamentId: row.tournament_id as string,
    phaseId:      row.phase_id as string,
    name:         row.name as string,
    orderIndex:   row.order_index as number,
  };
}

function groupToDb(g: Group) {
  return {
    id:            g.id,
    tournament_id: g.tournamentId,
    phase_id:      g.phaseId,
    name:          g.name,
    order_index:   g.orderIndex,
  };
}

function dbToGroupTeam(row: Record<string, unknown>): GroupTeam {
  return {
    id:      row.id as string,
    groupId: row.group_id as string,
    teamId:  row.team_id as string,
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
    phaseId:      (row.phase_id as string | null) ?? undefined,
    groupId:      (row.group_id as string | null) ?? undefined,
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
    phase_id:      m.phaseId ?? null,
    group_id:      m.groupId ?? null,
  };
}

// ── Tournaments ───────────────────────────────────────────────

export async function getTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToTournament);
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? dbToTournament(data) : null;
}

export async function saveTournament(t: Tournament): Promise<void> {
  const { error } = await supabase.from('tournaments').upsert(tournamentToDb(t));
  if (error) throw new Error(error.message);
}

// ── Teams ─────────────────────────────────────────────────────

export async function getTeamsForTournament(tournamentId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', tournamentId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToTeam);
}

export async function replaceTeams(tournamentId: string, teams: Team[]): Promise<void> {
  const { error: delErr } = await supabase
    .from('teams').delete().eq('tournament_id', tournamentId);
  if (delErr) throw new Error(delErr.message);
  if (teams.length === 0) return;
  const { error: insErr } = await supabase.from('teams').insert(teams.map(teamToDb));
  if (insErr) throw new Error(insErr.message);
}

// ── Phases ────────────────────────────────────────────────────

export async function getPhasesForTournament(tournamentId: string): Promise<Phase[]> {
  const { data, error } = await supabase
    .from('phases')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('order_index', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToPhase);
}

export async function savePhase(phase: Phase): Promise<void> {
  const { error } = await supabase.from('phases').upsert(phaseToDb(phase));
  if (error) throw new Error(error.message);
}

export async function deletePhase(id: string): Promise<void> {
  const { error } = await supabase.from('phases').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Groups ────────────────────────────────────────────────────

export async function getGroupsForTournament(tournamentId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from('tournament_groups')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('order_index', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToGroup);
}

export async function saveGroup(group: Group): Promise<void> {
  const { error } = await supabase.from('tournament_groups').upsert(groupToDb(group));
  if (error) throw new Error(error.message);
}

export async function deleteGroup(id: string): Promise<void> {
  const { error } = await supabase.from('tournament_groups').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── GroupTeams ────────────────────────────────────────────────

export async function getGroupTeamsForTournament(tournamentId: string): Promise<GroupTeam[]> {
  // Nejprve získej ID všech skupin turnaje
  const { data: groupRows, error: gErr } = await supabase
    .from('tournament_groups')
    .select('id')
    .eq('tournament_id', tournamentId);
  if (gErr) throw new Error(gErr.message);
  if (!groupRows || groupRows.length === 0) return [];

  const groupIds = groupRows.map((g: Record<string, unknown>) => g.id as string);

  const { data, error } = await supabase
    .from('group_teams')
    .select('*')
    .in('group_id', groupIds);
  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToGroupTeam);
}

/** Nahradí všechny týmy ve skupině (delete + insert). */
export async function replaceGroupTeams(groupId: string, teamIds: string[]): Promise<GroupTeam[]> {
  const { error: delErr } = await supabase
    .from('group_teams').delete().eq('group_id', groupId);
  if (delErr) throw new Error(delErr.message);
  if (teamIds.length === 0) return [];

  const records = teamIds.map(teamId => ({
    id:       `${groupId}__${teamId}`,
    group_id: groupId,
    team_id:  teamId,
  }));

  const { data, error } = await supabase.from('group_teams').insert(records).select();
  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToGroupTeam);
}

// ── Matches ───────────────────────────────────────────────────

export async function getMatchesForTournament(tournamentId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('round', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToMatch);
}

/** Nahradí všechny zápasy skupiny (delete + insert). */
export async function replaceMatchesForGroup(groupId: string, matches: Match[]): Promise<void> {
  const { error: delErr } = await supabase
    .from('matches').delete().eq('group_id', groupId);
  if (delErr) throw new Error(delErr.message);
  if (matches.length === 0) return;
  const { error: insErr } = await supabase.from('matches').insert(matches.map(matchToDb));
  if (insErr) throw new Error(insErr.message);
}

/** Nahradí všechny zápasy turnaje bez skupiny (legacy). */
export async function replaceMatches(tournamentId: string, matches: Match[]): Promise<void> {
  const { error: delErr } = await supabase
    .from('matches').delete().eq('tournament_id', tournamentId);
  if (delErr) throw new Error(delErr.message);
  if (matches.length === 0) return;
  const { error: insErr } = await supabase.from('matches').insert(matches.map(matchToDb));
  if (insErr) throw new Error(insErr.message);
}

export async function updateMatch(match: Match): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({ home_score: match.homeScore, away_score: match.awayScore, played: match.played })
    .eq('id', match.id);
  if (error) throw new Error(error.message);
}
