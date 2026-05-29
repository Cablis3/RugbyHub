'use client';

import { useState } from 'react';
import { Group, Match, Team } from '../types';
import { calculateStandings } from '../lib/calculateStandings';
import { TournamentTable } from './TournamentTable';

interface Props {
  group: Group;
  teams: Team[];
  matches: Match[];
  isAdmin: boolean;
  onResultSubmit: (matchId: string, homeScore: number, awayScore: number) => Promise<void>;
  onGenerateMatches: (groupId: string) => Promise<void>;
  onClearMatches: (groupId: string) => Promise<void>;
  isGenerating?: boolean;
}

export function GroupCard({
  group,
  teams,
  matches,
  isAdmin,
  onResultSubmit,
  onGenerateMatches,
  onClearMatches,
  isGenerating,
}: Props) {
  const [matchesOpen, setMatchesOpen] = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [homeInput,   setHomeInput]   = useState('');
  const [awayInput,   setAwayInput]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const teamName = (id: string) => teams.find(t => t.id === id)?.name ?? '—';
  const standings = calculateStandings(teams, matches);
  const played    = matches.filter(m => m.played).length;
  const total     = matches.length;

  const startEdit = (m: Match) => {
    if (!isAdmin) return;
    setEditingId(m.id);
    setHomeInput(m.homeScore !== null ? String(m.homeScore) : '');
    setAwayInput(m.awayScore !== null ? String(m.awayScore) : '');
  };

  const submitResult = async (matchId: string) => {
    const h = parseInt(homeInput, 10);
    const a = parseInt(awayInput, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    setSubmitting(true);
    try {
      await onResultSubmit(matchId, h, a);
      setEditingId(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Determine winner for a played match
  const winner = (match: Match): 'home' | 'away' | 'draw' | null => {
    if (!match.played || match.homeScore === null || match.awayScore === null) return null;
    if (match.homeScore > match.awayScore) return 'home';
    if (match.awayScore > match.homeScore) return 'away';
    return 'draw';
  };

  return (
    <div className="bg-panel border border-divider rounded-2xl overflow-hidden shadow-sm">
      {/* Hlavička skupiny */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-divider bg-canvas/50">
        <div className="w-1 h-5 bg-gold rounded-full shrink-0" />
        <h3 className="font-bold text-ink text-base">{group.name}</h3>
        {total > 0 && (
          <span className="ml-auto text-xs text-muted bg-canvas border border-divider px-2 py-0.5 rounded-full">
            {played}/{total} zápasů
          </span>
        )}
      </div>

      {/* Standings */}
      {teams.length === 0 ? (
        <div className="px-5 py-6 text-center text-secondary text-sm">
          {isAdmin
            ? <>Přiřaď týmy do skupiny v sekci <span className="text-ink font-medium">Správa</span>.</>
            : 'Týmy budou přiřazeny administrátorem.'}
        </div>
      ) : (
        <TournamentTable standings={standings} compact />
      )}

      {/* Sekce zápasů */}
      {teams.length > 0 && (
        <>
          <div className="border-t border-divider">
            {total === 0 ? (
              /* Žádné zápasy */
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-secondary">
                  {isAdmin ? 'Vygeneruj rozpis zápasů.' : 'Zápasy budou vygenerovány administrátorem.'}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => onGenerateMatches(group.id)}
                    disabled={isGenerating || teams.length < 2}
                    className="text-xs bg-gold hover:bg-gold-dark disabled:opacity-40 text-ink px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ml-3 shadow-sm"
                  >
                    {isGenerating ? 'Generuji…' : `Generovat (${teams.length})`}
                  </button>
                )}
              </div>
            ) : (
              /* Toggle zápasů */
              <button
                onClick={() => setMatchesOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-sm text-secondary hover:text-ink hover:bg-canvas/60 transition-colors"
              >
                <span className="font-medium">
                  Zápasy skupiny
                  <span className="ml-1.5 text-xs bg-canvas border border-divider text-muted px-1.5 py-0.5 rounded-full">
                    {played}/{total}
                  </span>
                </span>
                <svg className={`transition-transform ${matchesOpen ? 'rotate-180' : ''}`}
                  width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.75"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* Rozbalené zápasy */}
          {matchesOpen && total > 0 && (
            <div className="border-t border-divider px-4 py-3 space-y-4 bg-canvas/30">
              {[...new Set(matches.map(m => m.round))].sort((a, b) => a - b).map(round => (
                <div key={round}>
                  <p className="text-xs font-semibold text-secondary uppercase tracking-widest mb-1.5">
                    Kolo {round}
                  </p>
                  <div className="space-y-1.5">
                    {matches.filter(m => m.round === round).map(match => {
                      const w = winner(match);
                      return (
                        <div
                          key={match.id}
                          className="flex items-center gap-2 bg-panel rounded-xl px-3 py-2 border border-divider"
                        >
                          {/* Domácí */}
                          <span className={`flex-1 text-right text-sm font-medium truncate ${
                            w === 'home' ? 'text-ink font-semibold' : 'text-secondary'
                          }`}>
                            {teamName(match.homeTeamId)}
                          </span>

                          {/* Střed — výsledek nebo akce */}
                          <div className="w-32 flex-shrink-0 flex justify-center">
                            {isAdmin && editingId === match.id ? (
                              /* Admin — editace */
                              <div className="flex items-center gap-1">
                                <input
                                  autoFocus
                                  value={homeInput}
                                  onChange={e => setHomeInput(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && submitResult(match.id)}
                                  className="w-9 text-center bg-canvas border border-divider rounded-lg px-1 py-0.5 text-sm text-ink focus:outline-none focus:border-gold"
                                  placeholder="0" inputMode="numeric"
                                />
                                <span className="text-muted text-xs">:</span>
                                <input
                                  value={awayInput}
                                  onChange={e => setAwayInput(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && submitResult(match.id)}
                                  className="w-9 text-center bg-canvas border border-divider rounded-lg px-1 py-0.5 text-sm text-ink focus:outline-none focus:border-gold"
                                  placeholder="0" inputMode="numeric"
                                />
                                <button
                                  onClick={() => submitResult(match.id)}
                                  disabled={submitting}
                                  className="bg-gold hover:bg-gold-dark disabled:opacity-50 text-ink text-xs px-1.5 py-0.5 rounded-lg font-semibold transition-colors"
                                >OK</button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-muted hover:text-secondary text-sm px-0.5"
                                >×</button>
                              </div>
                            ) : match.played ? (
                              /* Výsledek */
                              isAdmin ? (
                                <button
                                  onClick={() => startEdit(match)}
                                  className={`text-sm font-bold tabular-nums transition-colors hover:opacity-80 px-2 py-0.5 rounded-md ${
                                    w !== 'draw'
                                      ? 'bg-gold text-ink'
                                      : 'text-secondary'
                                  }`}
                                  title="Klikni pro úpravu"
                                >
                                  {match.homeScore} : {match.awayScore}
                                </button>
                              ) : (
                                <span className={`text-sm font-bold tabular-nums px-2 py-0.5 rounded-md ${
                                  w !== 'draw'
                                    ? 'bg-gold text-ink'
                                    : 'text-secondary'
                                }`}>
                                  {match.homeScore} : {match.awayScore}
                                </span>
                              )
                            ) : (
                              /* Nezadáno */
                              isAdmin ? (
                                <button
                                  onClick={() => startEdit(match)}
                                  className="text-xs text-muted border border-dashed border-divider rounded-lg px-2 py-1 hover:border-gold hover:text-gold-dark transition-colors"
                                >
                                  Zadat
                                </button>
                              ) : (
                                <span className="text-muted text-sm">—</span>
                              )
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

              {/* Smazat zápasy — jen admin */}
              {isAdmin && (
                <div className="pt-1 border-t border-divider flex justify-end">
                  <button
                    onClick={() => onClearMatches(group.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors py-1"
                  >
                    Smazat všechny zápasy skupiny
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
