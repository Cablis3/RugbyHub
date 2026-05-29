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

  const winner = (match: Match): 'home' | 'away' | 'draw' | null => {
    if (!match.played || match.homeScore === null || match.awayScore === null) return null;
    if (match.homeScore > match.awayScore) return 'home';
    if (match.awayScore > match.homeScore) return 'away';
    return 'draw';
  };

  if (matches.length === 0) {
    return <p className="text-sm text-secondary">Žádné zápasy.</p>;
  }

  return (
    <div className="space-y-6">
      {rounds.map(round => (
        <div key={round}>
          <h3 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-2">
            Kolo {round}
          </h3>
          <div className="space-y-2">
            {matches.filter(m => m.round === round).map(match => {
              const w = winner(match);
              return (
                <div
                  key={match.id}
                  className="flex items-center gap-2 px-4 py-3 bg-panel rounded-xl border border-divider hover:border-gold-border transition-colors shadow-sm"
                >
                  {/* Domácí */}
                  <span className={`flex-1 text-right text-sm font-medium truncate ${
                    w === 'home' ? 'text-ink font-semibold' : 'text-secondary'
                  }`}>
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
                          className="w-10 text-center bg-canvas border border-divider rounded-lg px-1 py-0.5 text-sm text-ink focus:outline-none focus:border-gold"
                          placeholder="0"
                          inputMode="numeric"
                        />
                        <span className="text-muted">:</span>
                        <input
                          value={awayInput}
                          onChange={e => setAwayInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && submitResult(match.id)}
                          className="w-10 text-center bg-canvas border border-divider rounded-lg px-1 py-0.5 text-sm text-ink focus:outline-none focus:border-gold"
                          placeholder="0"
                          inputMode="numeric"
                        />
                        <button
                          onClick={() => submitResult(match.id)}
                          className="bg-gold hover:bg-gold-dark text-ink text-xs px-2 py-1 rounded-lg font-semibold transition-colors"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-muted hover:text-secondary text-xs px-1 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ) : match.played ? (
                      <button
                        onClick={() => startEdit(match)}
                        title="Klikni pro úpravu"
                        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                      >
                        {/* Domácí skóre */}
                        <span className={`text-sm font-bold tabular-nums px-1.5 py-0.5 rounded-md ${
                          w === 'home' ? 'bg-gold text-ink' : 'bg-[#F2F2F2] text-secondary'
                        }`}>
                          {match.homeScore}
                        </span>
                        <span className="text-muted text-xs">:</span>
                        {/* Hostující skóre */}
                        <span className={`text-sm font-bold tabular-nums px-1.5 py-0.5 rounded-md ${
                          w === 'away' ? 'bg-gold text-ink' : 'bg-[#F2F2F2] text-secondary'
                        }`}>
                          {match.awayScore}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(match)}
                        className="text-xs text-muted border border-dashed border-divider rounded-lg px-3 py-1 hover:border-gold hover:text-gold-dark transition-colors"
                      >
                        Zadat výsledek
                      </button>
                    )}
                  </div>

                  {/* Hosté */}
                  <span className={`flex-1 text-left text-sm font-medium truncate ${
                    w === 'away' ? 'text-ink font-semibold' : 'text-secondary'
                  }`}>
                    {teamName(match.awayTeamId)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
