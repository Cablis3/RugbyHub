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

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Hlavička skupiny */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-800">
        <div className="w-1 h-5 bg-green-500 rounded-full shrink-0" />
        <h3 className="font-bold text-white text-base">{group.name}</h3>
        {total > 0 && (
          <span className="ml-auto text-xs text-gray-500">{played}/{total} zápasů</span>
        )}
      </div>

      {/* Standings */}
      {teams.length === 0 ? (
        <div className="px-5 py-6 text-center text-gray-500 text-sm">
          {isAdmin
            ? <>Přiřaď týmy do skupiny v sekci <span className="text-gray-400">Správa</span>.</>
            : 'Týmy budou přiřazeny administrátorem.'}
        </div>
      ) : (
        <TournamentTable standings={standings} compact />
      )}

      {/* Sekce zápasů */}
      {teams.length > 0 && (
        <>
          <div className="border-t border-gray-800">
            {total === 0 ? (
              /* Žádné zápasy */
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-gray-500">
                  {isAdmin ? 'Vygeneruj rozpis zápasů.' : 'Zápasy budou vygenerovány administrátorem.'}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => onGenerateMatches(group.id)}
                    disabled={isGenerating || teams.length < 2}
                    className="text-xs bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ml-3"
                  >
                    {isGenerating ? 'Generuji…' : `Generovat (${teams.length})`}
                  </button>
                )}
              </div>
            ) : (
              /* Toggle zápasů */
              <button
                onClick={() => setMatchesOpen(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
              >
                <span className="font-medium">
                  Zápasy skupiny
                  <span className="ml-1.5 text-xs bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded-full">
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
            <div className="border-t border-gray-800 px-4 py-3 space-y-4">
              {[...new Set(matches.map(m => m.round))].sort((a, b) => a - b).map(round => (
                <div key={round}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                    Kolo {round}
                  </p>
                  <div className="space-y-1.5">
                    {matches.filter(m => m.round === round).map(match => (
                      <div
                        key={match.id}
                        className="flex items-center gap-2 bg-gray-950 rounded-lg px-3 py-2 border border-gray-800"
                      >
                        {/* Domácí */}
                        <span className="flex-1 text-right text-sm font-medium text-white truncate">
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
                                className="w-9 text-center bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-sm text-white focus:outline-none focus:border-green-500"
                                placeholder="0" inputMode="numeric"
                              />
                              <span className="text-gray-500 text-xs">:</span>
                              <input
                                value={awayInput}
                                onChange={e => setAwayInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && submitResult(match.id)}
                                className="w-9 text-center bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-sm text-white focus:outline-none focus:border-green-500"
                                placeholder="0" inputMode="numeric"
                              />
                              <button
                                onClick={() => submitResult(match.id)}
                                disabled={submitting}
                                className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs px-1.5 py-0.5 rounded transition-colors"
                              >OK</button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-gray-500 hover:text-gray-300 text-sm px-0.5"
                              >×</button>
                            </div>
                          ) : match.played ? (
                            /* Výsledek — admin může kliknout a editovat, viewer vidí jen text */
                            isAdmin ? (
                              <button
                                onClick={() => startEdit(match)}
                                className="text-sm font-bold tabular-nums text-white hover:text-green-400 transition-colors"
                                title="Klikni pro úpravu"
                              >
                                {match.homeScore} : {match.awayScore}
                              </button>
                            ) : (
                              <span className="text-sm font-bold tabular-nums text-white">
                                {match.homeScore} : {match.awayScore}
                              </span>
                            )
                          ) : (
                            /* Nezadáno */
                            isAdmin ? (
                              <button
                                onClick={() => startEdit(match)}
                                className="text-xs text-gray-500 border border-dashed border-gray-700 rounded px-2 py-1 hover:border-green-600 hover:text-green-400 transition-colors"
                              >
                                Zadat
                              </button>
                            ) : (
                              <span className="text-gray-600 text-sm">—</span>
                            )
                          )}
                        </div>

                        {/* Hosté */}
                        <span className="flex-1 text-left text-sm font-medium text-white truncate">
                          {teamName(match.awayTeamId)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Smazat zápasy — jen admin */}
              {isAdmin && (
                <div className="pt-1 border-t border-gray-800 flex justify-end">
                  <button
                    onClick={() => onClearMatches(group.id)}
                    className="text-xs text-red-400/70 hover:text-red-400 transition-colors py-1"
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
