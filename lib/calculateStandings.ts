import { Match, StandingRow, Team } from '../types';

export function calculateStandings(teams: Team[], matches: Match[]): StandingRow[] {
  const map: Record<string, StandingRow> = {};

  for (const team of teams) {
    map[team.id] = {
      teamId: team.id,
      teamName: team.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  }

  for (const match of matches) {
    if (!match.played || match.homeScore === null || match.awayScore === null) continue;

    const home = map[match.homeTeamId];
    const away = map[match.awayTeamId];
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won++;   home.points += 3;
      away.lost++;
    } else if (match.homeScore < match.awayScore) {
      away.won++;   away.points += 3;
      home.lost++;
    } else {
      home.drawn++; home.points += 1;
      away.drawn++; away.points += 1;
    }
  }

  for (const row of Object.values(map)) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }

  // Řazení: body → rozdíl skóre → skóre pro → název týmu
  return Object.values(map).sort((a, b) => {
    if (b.points !== a.points)          return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor)      return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName, 'cs');
  });
}
