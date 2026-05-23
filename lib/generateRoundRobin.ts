import { Match } from '../types';

/**
 * Algoritmus rotace: fixuje první tým, rotuje ostatní.
 * Pro n týmů generuje n*(n-1)/2 zápasů ve správných kolech.
 * Lichý počet týmů → přidá "bye" slot, zápasy s bye se přeskočí.
 */
export function generateRoundRobin(tournamentId: string, teamIds: string[]): Match[] {
  const matches: Match[] = [];
  const teams = [...teamIds];

  if (teams.length % 2 === 1) {
    teams.push('__bye__');
  }

  const total = teams.length;
  const rounds = total - 1;
  const perRound = total / 2;
  let matchIndex = 0;

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < perRound; i++) {
      const home = teams[i];
      const away = teams[total - 1 - i];

      if (home !== '__bye__' && away !== '__bye__') {
        matches.push({
          id: `${tournamentId}-m${matchIndex++}`,
          tournamentId,
          homeTeamId: home,
          awayTeamId: away,
          homeScore: null,
          awayScore: null,
          round: round + 1,
          played: false,
        });
      }
    }

    // Rotace: první tým zůstává, ostatní se posunou o 1
    const last = teams.splice(total - 1, 1)[0];
    teams.splice(1, 0, last);
  }

  return matches;
}
