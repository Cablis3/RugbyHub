import { Match } from '../types';

interface RoundRobinOptions {
  phaseId?: string;
  groupId?: string;
}

/**
 * Generuje zápasy systémem každý s každým.
 * Algoritmus rotace: první tým je fixní, ostatní se rotují.
 * Lichý počet týmů → přidá "__bye__" slot (zápasy s ním se přeskočí).
 *
 * @param tournamentId  ID turnaje
 * @param teamIds       ID týmů ve skupině / turnaji
 * @param options       Volitelné phaseId a groupId pro skupinové turnaje
 */
export function generateRoundRobin(
  tournamentId: string,
  teamIds: string[],
  options: RoundRobinOptions = {},
): Match[] {
  const { phaseId, groupId } = options;
  const matches: Match[] = [];
  const teams = [...teamIds];

  if (teams.length % 2 === 1) {
    teams.push('__bye__');
  }

  const total    = teams.length;
  const rounds   = total - 1;
  const perRound = total / 2;
  // Prefix pro unikátní ID — skupinové turnaje používají groupId
  const prefix   = groupId ?? tournamentId;
  let matchIndex = 0;

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < perRound; i++) {
      const home = teams[i];
      const away = teams[total - 1 - i];

      if (home !== '__bye__' && away !== '__bye__') {
        matches.push({
          id:           `${prefix}-m${matchIndex++}`,
          tournamentId,
          homeTeamId:   home,
          awayTeamId:   away,
          homeScore:    null,
          awayScore:    null,
          round:        round + 1,
          played:       false,
          phaseId,
          groupId,
        });
      }
    }

    // Rotace: první tým zůstává, ostatní se posunou o 1
    const last = teams.splice(total - 1, 1)[0];
    teams.splice(1, 0, last);
  }

  return matches;
}
