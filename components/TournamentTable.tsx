import { StandingRow } from '../types';

type Props = {
  standings: StandingRow[];
  /** compact=true skryje legendu a zmenší padding — pro GroupCard */
  compact?: boolean;
};

export function TournamentTable({ standings, compact = false }: Props) {
  if (standings.length === 0) {
    return (
      <p className={`text-sm text-gray-500 ${compact ? 'px-5 py-4' : ''}`}>
        Tabulka se zobrazí po zadání výsledků.
      </p>
    );
  }

  const cell = compact ? 'px-3 py-2' : 'px-3 py-3';

  return (
    <div className={compact ? '' : 'overflow-x-auto rounded-xl border border-gray-800'}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-800/60 text-gray-400 text-xs uppercase tracking-wide">
            <th className={`${cell} text-left w-7`}>#</th>
            <th className={`${cell} text-left`}>Tým</th>
            <th className={`${cell} text-center`} title="Odehrané zápasy">Z</th>
            <th className={`${cell} text-center`} title="Výhry">V</th>
            <th className={`${cell} text-center`} title="Remízy">R</th>
            <th className={`${cell} text-center`} title="Prohry">P</th>
            <th className={`${cell} text-center hidden sm:table-cell`} title="Skóre pro:proti">Skóre</th>
            <th className={`${cell} text-center`} title="Rozdíl skóre">+/-</th>
            <th className={`${cell} text-center font-bold`} title="Body">B</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr
              key={row.teamId}
              className={`border-t border-gray-800 transition-colors hover:bg-gray-800/40 ${
                i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/60'
              }`}
            >
              <td className={`${cell} text-gray-500 font-medium`}>{i + 1}</td>
              <td className={`${cell} font-semibold text-white max-w-[120px] truncate`}>{row.teamName}</td>
              <td className={`${cell} text-center text-gray-300`}>{row.played}</td>
              <td className={`${cell} text-center text-green-400 font-medium`}>{row.won}</td>
              <td className={`${cell} text-center text-amber-400`}>{row.drawn}</td>
              <td className={`${cell} text-center text-red-400`}>{row.lost}</td>
              <td className={`${cell} text-center tabular-nums text-gray-300 hidden sm:table-cell`}>
                {row.goalsFor}:{row.goalsAgainst}
              </td>
              <td className={`${cell} text-center tabular-nums`}>
                <span className={
                  row.goalDifference > 0 ? 'text-green-400' :
                  row.goalDifference < 0 ? 'text-red-400' : 'text-gray-500'
                }>
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </span>
              </td>
              <td className={`${cell} text-center font-bold tabular-nums text-white`}>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!compact && (
        <p className="text-xs text-gray-600 px-3 py-2.5 bg-gray-900 border-t border-gray-800">
          Z = zápasy · V = výhry · R = remízy · P = prohry · B = body (V×3, R×1)
        </p>
      )}
    </div>
  );
}
