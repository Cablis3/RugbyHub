'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Match, Team, Tournament } from '../../../types';
import {
  getMatchesForTournament,
  getTeamsForTournament,
  getTournamentById,
  saveMatches,
  saveTeams,
  updateMatch,
} from '../../../lib/storage';
import { generateRoundRobin } from '../../../lib/generateRoundRobin';
import { calculateStandings } from '../../../lib/calculateStandings';
import { TournamentTable } from '../../../components/TournamentTable';
import { MatchList } from '../../../components/MatchList';
import { TeamSelector } from '../../../components/TeamSelector';

type Tab = 'table' | 'matches' | 'teams';

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams,   setTeams]   = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tab, setTab]         = useState<Tab>('table');
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    setTournament(getTournamentById(id) ?? null);
    setTeams(getTeamsForTournament(id));
    setMatches(getMatchesForTournament(id));
    setLoaded(true);
  }, [id]);

  const handleTeamsSave = (newTeams: Team[]) => {
    saveTeams(newTeams);
    setTeams(newTeams);
    saveMatches([]);
    setMatches([]);
  };

  const handleGenerateMatches = () => {
    if (teams.length < 2) return;
    const generated = generateRoundRobin(id, teams.map(t => t.id));
    saveMatches(generated);
    setMatches(generated);
  };

  const handleResultSubmit = (matchId: string, homeScore: number, awayScore: number) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    const updated: Match = { ...match, homeScore, awayScore, played: true };
    updateMatch(updated);
    setMatches(prev => prev.map(m => m.id === matchId ? updated : m));
  };

  if (!loaded) return null;

  if (!tournament) {
    return (
      <main className="min-h-screen bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <a href="/" className="text-sm text-green-400 hover:text-green-300 transition-colors">
            ← Zpět
          </a>
          <p className="mt-4 text-gray-500">Turnaj nenalezen.</p>
        </div>
      </main>
    );
  }

  const standings = calculateStandings(teams, matches);
  const totalMatches  = matches.length;
  const playedMatches = matches.filter(m => m.played).length;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'table',   label: 'Tabulka' },
    { key: 'matches', label: `Zápasy${totalMatches > 0 ? ` (${playedMatches}/${totalMatches})` : ''}` },
    { key: 'teams',   label: `Týmy (${teams.length})` },
  ];

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <a href="/" className="inline-flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 transition-colors mb-5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Zpět na turnaje
        </a>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{tournament.name}</h1>
          <p className="text-gray-500 text-sm mt-1.5">{tournament.date}&nbsp;·&nbsp;{tournament.location}</p>
        </div>

        {/* Tab navigace */}
        <div className="flex gap-0 border-b border-gray-800 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tabulka */}
        {tab === 'table' && (
          teams.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nejprve přidej týmy v záložce „Týmy", pak vygeneruj zápasy a zadávej výsledky.
            </p>
          ) : (
            <TournamentTable standings={standings} />
          )
        )}

        {/* Zápasy */}
        {tab === 'matches' && (
          <div>
            {matches.length === 0 ? (
              teams.length < 2 ? (
                <p className="text-sm text-gray-500">Přidej alespoň 2 týmy v záložce „Týmy".</p>
              ) : (
                <div className="text-center py-10 bg-gray-900 border border-gray-800 rounded-xl">
                  <p className="text-white font-semibold mb-1">
                    {teams.length} týmů → {(teams.length * (teams.length - 1)) / 2} zápasů
                  </p>
                  <p className="text-sm text-gray-500 mb-5">
                    Systém každý s každým,&nbsp;
                    {teams.length % 2 === 0 ? teams.length - 1 : teams.length} kol
                  </p>
                  <button
                    onClick={handleGenerateMatches}
                    className="bg-green-600 hover:bg-green-500 active:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors min-h-[44px]"
                  >
                    Vygenerovat rozpis zápasů
                  </button>
                </div>
              )
            ) : (
              <MatchList matches={matches} teams={teams} onResultSubmit={handleResultSubmit} />
            )}
          </div>
        )}

        {/* Týmy */}
        {tab === 'teams' && (
          <TeamSelector
            tournamentId={id}
            currentTeams={teams}
            onSave={handleTeamsSave}
          />
        )}
      </div>
    </main>
  );
}
