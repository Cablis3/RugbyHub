import { StandingRow } from '../types';

type Props = {
  standings: StandingRow[];
  /** compact=true skryje legendu a zmenší padding — pro GroupCard */
  compact?: boolean;
};

export function TournamentTable({ standings, compact = false }: Props) {
  if (standings.length === 0) {
    return (
      <p className={`text-sm text-secondary ${compact ? 'px-5 py-4' : ''}`}>
        Tabulka se zobrazí po zadání výsledků.
      </p>
    );
  }

  const cell = compact ? 'px-3 py-2' : 'px-3 py-3';

  return (
    <div className={compact ? '' : 'overflow-x-auto rounded-xl border border-divider shadow-sm'}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-ink text-white/70 text-xs uppercase tracking-wide">
            <th className={`${cell} text-left w-7`}>#</th>
            <th className={`${cell} text-left`}>Tým</th>
            <th className={`${cell} text-center`} title="Odehrané zápasy">Z</th>
            <th className={`${cell} text-center`} title="Výhry">V</th>
            <th className={`${cell} text-center`} title="Remízy">R</th>
            <th className={`${cell} text-center`} title="Prohry">P</th>
            <th className={`${cell} text-center hidden sm:table-cell`} title="Skóre pro:proti">Skóre</th>
            <th className={`${cell} text-center`} title="Rozdíl skóre">+/-</th>
            <th className={`${cell} text-center`} title="Body">
              <span className="text-gold font-bold">B</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => (
            <tr
              key={row.teamId}
              className={`border-t border-divider transition-colors hover:bg-gold-light/40 ${
                i === 0 ? 'bg-gold-light/30' : i % 2 === 0 ? 'bg-panel' : 'bg-canvas/60'
              }`}
            >
              <td className={`${cell} text-muted font-medium`}>{i + 1}</td>
              <td className={`${cell} font-semibold text-ink max-w-[120px] truncate`}>{row.teamName}</td>
              <td className={`${cell} text-center text-secondary`}>{row.played}</td>
              <td className={`${cell} text-center font-semibold`}>
                <span className={row.won > 0 ? 'text-gold-dark' : 'text-secondary'}>
                  {row.won}
                </span>
              </td>
              <td className={`${cell} text-center text-secondary`}>{row.drawn}</td>
              <td className={`${cell} text-center text-secondary`}>{row.lost}</td>
              <td className={`${cell} text-center tabular-nums text-secondary hidden sm:table-cell`}>
                {row.goalsFor}:{row.goalsAgainst}
              </td>
              <td className={`${cell} text-center tabular-nums`}>
                <span className={
                  row.goalDifference > 0 ? 'text-green-700 font-medium' :
                  row.goalDifference < 0 ? 'text-secondary' : 'text-muted'
                }>
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </span>
              </td>
              <td className={`${cell} text-center tabular-nums`}>
                <span className={`font-bold ${i === 0 ? 'text-gold-dark' : 'text-ink'}`}>
                  {row.points}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!compact && (
        <p className="text-xs text-muted px-3 py-2.5 bg-canvas/60 border-t border-divider">
          Z = zápasy · V = výhry · R = remízy · P = prohry · B = body (V×3, R×1)
        </p>
      )}
    </div>
  );
}
