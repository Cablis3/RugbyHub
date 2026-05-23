'use client';

import { useState } from 'react';
import { Match, Team } from '../types';

type Props = {
  matches: Match[];
  teams: Team[];
  onResultSubmit?: (matchId: string, homeScore: number, awayScore: number) => void;
};

export function MatchList({ matches, teams, onResultSubmit }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [homeInput, setHomeInput] = useState('');
  const [awayInput, setAwayInput] = useState('');

  const teamName = (id: string) => teams.find(t => t.id === id)?.name ?? '—';
  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);

  const startEdit = (match: Match) => {
    setEditingId(match.id);
    setHomeInput(match.homeScore !== null ? String(match.homeScore) : '');
    setAwayInput(match.awayScore !== null ? String(match.awayScore) : '');
  };

  const submitResult = (matchId: string) => {
    const h = parseInt(homeInput, 10);
    const a = parseInt(awayInput, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    onResultSubmit?.(matchId, h, a);
    setEditingId(null);
  };

  if (matches.length === 0) {
    return <p className="text-sm text-gray-500">Žádné zápasy.</p>;
  }

  return (
    <div className="space-y-6">
      {rounds.map(round => (
        <div key={round}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Kolo {round}
          </h3>
          <div className="space-y-2">
            {matches.filter(m => m.round === round).map(match => (
              <div
                key={match.id}
                className="flex items-center gap-2 px-4 py-3 bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <span className="flex-1 text-right text-sm font-medium text-white truncate">
                  {teamName(match.homeTeamId)}
                </span>

                <div className="w-36 flex-shrink-0 flex justify-center">
                  {editingId === match.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        value={homeInput}
                        onChange={e => setHomeInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submitResult(match.id)}
                        className="w-10 text-center bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-sm text-white focus:outline-none focus:border-green-500"
                        placeholder="0"
                        inputMode="numeric"
                      />
                      <span className="text-gray-500">:</span>
                      <input
                        value={awayInput}
                        onChange={e => setAwayInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submitResult(match.id)}
                        className="w-10 text-center bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-sm text-white focus:outline-none focus:border-green-500"
                        placeholder="0"
                        inputMode="numeric"
                      />
                      <button
                        onClick={() => submitResult(match.id)}
                        className="bg-green-600 hover:bg-green-500 text-white text-xs px-2 py-1 rounded transition-colors"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-500 hover:text-gray-300 text-xs px-1 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ) : match.played ? (
                    <button
                      onClick={() => startEdit(match)}
                      className="text-lg font-bold tabular-nums text-white hover:text-green-400 transition-colors"
                      title="Klikni pro úpravu"
                    >
                      {match.homeScore} : {match.awayScore}
                    </button>
                  ) : (
                    <button
                      onClick={() => startEdit(match)}
                      className="text-xs text-gray-500 border border-dashed border-gray-700 rounded px-3 py-1 hover:border-green-600 hover:text-green-400 transition-colors"
                    >
                      Zadat výsledek
                    </button>
                  )}
                </div>

                <span className="flex-1 text-left text-sm font-medium text-white truncate">
                  {teamName(match.awayTeamId)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
