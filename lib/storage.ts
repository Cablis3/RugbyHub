import { Match, Team, Tournament } from '../types';

const KEYS = {
  tournaments: 'mt-tournaments',
  teams:       'mt-teams',
  matches:     'mt-matches',
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Tournaments ──────────────────────────────────────────

export function getTournaments(): Tournament[] {
  return load<Tournament[]>(KEYS.tournaments, []);
}

export function getTournamentById(id: string): Tournament | undefined {
  return getTournaments().find(t => t.id === id);
}

export function saveTournament(tournament: Tournament): void {
  const all = getTournaments();
  const idx = all.findIndex(t => t.id === tournament.id);
  if (idx >= 0) all[idx] = tournament; else all.push(tournament);
  save(KEYS.tournaments, all);
}

// ── Teams ─────────────────────────────────────────────────

export function getTeamsForTournament(tournamentId: string): Team[] {
  return load<Team[]>(KEYS.teams, []).filter(t => t.tournamentId === tournamentId);
}

export function saveTeams(teams: Team[]): void {
  if (teams.length === 0) return;
  const tournamentId = teams[0].tournamentId;
  const others = load<Team[]>(KEYS.teams, []).filter(t => t.tournamentId !== tournamentId);
  save(KEYS.teams, [...others, ...teams]);
}

// ── Matches ───────────────────────────────────────────────

export function getMatchesForTournament(tournamentId: string): Match[] {
  return load<Match[]>(KEYS.matches, []).filter(m => m.tournamentId === tournamentId);
}

export function saveMatches(matches: Match[]): void {
  if (matches.length === 0) return;
  const tournamentId = matches[0].tournamentId;
  const others = load<Match[]>(KEYS.matches, []).filter(m => m.tournamentId !== tournamentId);
  save(KEYS.matches, [...others, ...matches]);
}

export function updateMatch(match: Match): void {
  const all = load<Match[]>(KEYS.matches, []);
  const idx = all.findIndex(m => m.id === match.id);
  if (idx >= 0) {
    all[idx] = match;
    save(KEYS.matches, all);
  }
}

// ── Utils ─────────────────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
