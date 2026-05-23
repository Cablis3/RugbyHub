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

export type Match = {
  id: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  round: number;
  played: boolean;
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
