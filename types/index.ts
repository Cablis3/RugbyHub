export type Club = {
  id: string;
  name: string;
  city: string;
  website?: string;
  rugbyUnionUrl?: string;
};

export type TournamentStatus = 'draft' | 'active' | 'finished';

export type Tournament = {
  id: string;
  name: string;
  date: string;
  location: string;
  status: TournamentStatus;
  createdAt: string;
};

export type Team = {
  id: string;
  tournamentId: string;
  name: string;
  clubId?: string;
};

/** Fáze turnaje — Group Phase, Cup, Plate, Playoff … */
export type Phase = {
  id: string;
  tournamentId: string;
  name: string;
  orderIndex: number;
};

/** Skupina v rámci fáze — Skupina A, Cup SF1 … */
export type Group = {
  id: string;
  tournamentId: string;
  phaseId: string;
  name: string;
  orderIndex: number;
};

/** Vazba tým ↔ skupina (tým může být v různých skupinách různých fází) */
export type GroupTeam = {
  id: string;
  groupId: string;
  teamId: string;
};

export type Match = {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  round: number;
  played: boolean;
  /** ID fáze — null pro turnaje bez skupinové struktury */
  phaseId?: string;
  /** ID skupiny — null pro turnaje bez skupinové struktury */
  groupId?: string;
};

export type StandingRow = {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};
