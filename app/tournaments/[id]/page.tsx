'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Group, GroupTeam, Match, Phase, Team, Tournament } from '../../../types';
import {
  getTournamentById,
  getTeamsForTournament,
  getMatchesForTournament,
  getPhasesForTournament,
  getGroupsForTournament,
  getGroupTeamsForTournament,
  replaceTeams,
  replaceMatchesForGroup,
  replaceGroupTeams,
  savePhase,
  deletePhase,
  saveGroup,
  deleteGroup,
  updateMatch,
} from '../../../lib/db';
import { generateRoundRobin } from '../../../lib/generateRoundRobin';
import { generateId } from '../../../lib/storage';
import { GroupCard } from '../../../components/GroupCard';
import { TeamSelector } from '../../../components/TeamSelector';

// ─────────────────────────────────────────────────────────────

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();

  // ── Data ─────────────────────────────────────────────────────
  const [tournament, setTournament]   = useState<Tournament | null>(null);
  const [phases,     setPhases]       = useState<Phase[]>([]);
  const [groups,     setGroups]       = useState<Group[]>([]);
  const [groupTeams, setGroupTeams]   = useState<GroupTeam[]>([]);
  const [teams,      setTeams]        = useState<Team[]>([]);
  const [matches,    setMatches]      = useState<Match[]>([]);

  // ── UI ───────────────────────────────────────────────────────
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [showAdmin,       setShowAdmin]        = useState(false);
  const [showTeamMgr,     setShowTeamMgr]      = useState(false);

  // ── Stavy načítání ───────────────────────────────────────────
  const [loading,   setLoading]   = useState(true);
  const [loadErr,   setLoadErr]   = useState('');
  const [actionErr, setActionErr] = useState('');

  // ── Admin form state ─────────────────────────────────────────
  const [newPhaseName,      setNewPhaseName]      = useState('');
  const [newGroupNames,     setNewGroupNames]      = useState<Record<string, string>>({});
  const [generatingGroupId, setGeneratingGroupId] = useState<string | null>(null);
  const [assigningGroupId,  setAssigningGroupId]  = useState<string | null>(null);
  const [groupTeamDraft,    setGroupTeamDraft]     = useState<string[]>([]);

  // ── Mount: načti vše ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadErr('');

    Promise.all([
      getTournamentById(id),
      getTeamsForTournament(id),
      getMatchesForTournament(id),
      getPhasesForTournament(id),
      getGroupsForTournament(id),
      getGroupTeamsForTournament(id),
    ])
      .then(([t, te, ma, ph, gr, gt]) => {
        if (cancelled) return;
        setTournament(t);
        setTeams(te);
        setMatches(ma);
        setPhases(ph);
        setGroups(gr);
        setGroupTeams(gt);
        if (ph.length > 0) setSelectedPhaseId(ph[0].id);
      })
      .catch(err => { if (!cancelled) setLoadErr(err.message ?? 'Chyba načítání.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id]);

  // ── Helper: action wrapper ───────────────────────────────────
  const act = async (fn: () => Promise<void>) => {
    setActionErr('');
    try { await fn(); }
    catch (err: unknown) {
      setActionErr(err instanceof Error ? err.message : 'Akce selhala.');
    }
  };

  // ── Admin operace ────────────────────────────────────────────

  const handleSaveTeams = async (newTeams: Team[]) => act(async () => {
    await replaceTeams(id, newTeams);
    setTeams(newTeams);
    setShowTeamMgr(false);
  });

  const handleCreatePhase = async () => {
    const name = newPhaseName.trim();
    if (!name) return;
    await act(async () => {
      const phase: Phase = {
        id: generateId(),
        tournamentId: id,
        name,
        orderIndex: phases.length,
      };
      await savePhase(phase);
      setPhases(prev => [...prev, phase]);
      if (phases.length === 0) setSelectedPhaseId(phase.id);
      setNewPhaseName('');
    });
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm('Smazat fázi i s celým obsahem?')) return;
    await act(async () => {
      await deletePhase(phaseId);
      const newPhases = phases.filter(p => p.id !== phaseId);
      const deletedGroups = groups.filter(g => g.phaseId === phaseId).map(g => g.id);
      setPhases(newPhases);
      setGroups(prev => prev.filter(g => g.phaseId !== phaseId));
      setGroupTeams(prev => prev.filter(gt => !deletedGroups.includes(gt.groupId)));
      setMatches(prev => prev.filter(m => m.phaseId !== phaseId));
      if (selectedPhaseId === phaseId) {
        setSelectedPhaseId(newPhases.length > 0 ? newPhases[0].id : null);
      }
    });
  };

  const handleCreateGroup = async (phaseId: string) => {
    const name = (newGroupNames[phaseId] ?? '').trim();
    if (!name) return;
    await act(async () => {
      const group: Group = {
        id: generateId(),
        tournamentId: id,
        phaseId,
        name,
        orderIndex: groups.filter(g => g.phaseId === phaseId).length,
      };
      await saveGroup(group);
      setGroups(prev => [...prev, group]);
      setNewGroupNames(prev => ({ ...prev, [phaseId]: '' }));
    });
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Smazat skupinu i s jejími zápasy?')) return;
    await act(async () => {
      await deleteGroup(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setGroupTeams(prev => prev.filter(gt => gt.groupId !== groupId));
      setMatches(prev => prev.filter(m => m.groupId !== groupId));
    });
  };

  const openAssignTeams = (groupId: string) => {
    const current = groupTeams.filter(gt => gt.groupId === groupId).map(gt => gt.teamId);
    setGroupTeamDraft(current);
    setAssigningGroupId(groupId);
  };

  const handleSaveGroupTeams = async () => {
    if (!assigningGroupId) return;
    const gid = assigningGroupId;
    await act(async () => {
      const result = await replaceGroupTeams(gid, groupTeamDraft);
      setGroupTeams(prev => [...prev.filter(gt => gt.groupId !== gid), ...result]);
      // Smazat zápasy skupiny — týmy se změnily
      await replaceMatchesForGroup(gid, []);
      setMatches(prev => prev.filter(m => m.groupId !== gid));
      setAssigningGroupId(null);
    });
  };

  const handleGenerateGroupMatches = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const teamIds = groupTeams.filter(gt => gt.groupId === groupId).map(gt => gt.teamId);
    if (teamIds.length < 2) return;

    setGeneratingGroupId(groupId);
    await act(async () => {
      const generated = generateRoundRobin(id, teamIds, {
        phaseId: group.phaseId,
        groupId,
      });
      await replaceMatchesForGroup(groupId, generated);
      setMatches(prev => [...prev.filter(m => m.groupId !== groupId), ...generated]);
    });
    setGeneratingGroupId(null);
  };

  const handleClearGroupMatches = async (groupId: string) => {
    if (!confirm('Smazat všechny zápasy skupiny?')) return;
    await act(async () => {
      await replaceMatchesForGroup(groupId, []);
      setMatches(prev => prev.filter(m => m.groupId !== groupId));
    });
  };

  const handleResultSubmit = async (matchId: string, homeScore: number, awayScore: number) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    const updated: Match = { ...match, homeScore, awayScore, played: true };
    setMatches(prev => prev.map(m => m.id === matchId ? updated : m));
    try {
      await updateMatch(updated);
    } catch (err: unknown) {
      setMatches(prev => prev.map(m => m.id === matchId ? match : m));
      setActionErr(err instanceof Error ? err.message : 'Nepodařilo se uložit výsledek.');
    }
  };

  // ── Helpers pro view ─────────────────────────────────────────
  const groupsForPhase = (phaseId: string) =>
    groups.filter(g => g.phaseId === phaseId).sort((a, b) => a.orderIndex - b.orderIndex);

  const teamsForGroup = (groupId: string): Team[] => {
    const ids = groupTeams.filter(gt => gt.groupId === groupId).map(gt => gt.teamId);
    return teams.filter(t => ids.includes(t.id));
  };

  const matchesForGroup = (groupId: string): Match[] =>
    matches.filter(m => m.groupId === groupId);

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-4 w-28 bg-gray-800 rounded animate-pulse mb-6" />
          <div className="h-8 w-64 bg-gray-800 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-gray-800 rounded animate-pulse mb-8" />
          <div className="flex gap-3 mb-6">
            {[1, 2, 3].map(i => <div key={i} className="h-8 w-24 bg-gray-800 rounded-full animate-pulse" />)}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2].map(i => <div key={i} className="h-48 bg-gray-900 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </main>
    );
  }

  if (loadErr || !tournament) {
    return (
      <main className="min-h-screen bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <a href="/" className="inline-flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 mb-5">
            <BackIcon /> Zpět
          </a>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3.5 mt-4">
            <p className="text-red-400 font-medium text-sm">
              {loadErr ? 'Chyba načítání' : 'Turnaj nenalezen'}
            </p>
            {loadErr && <p className="text-red-400/70 text-xs mt-0.5">{loadErr}</p>}
          </div>
        </div>
      </main>
    );
  }

  const selectedPhase = phases.find(p => p.id === selectedPhaseId);

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Zpět */}
        <a href="/" className="inline-flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 transition-colors mb-5">
          <BackIcon /> Zpět na turnaje
        </a>

        {/* Hlavička turnaje */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{tournament.name}</h1>
            <p className="text-gray-500 text-sm mt-1.5">{tournament.date}&nbsp;·&nbsp;{tournament.location}</p>
          </div>
          <button
            onClick={() => { setShowAdmin(v => !v); setShowTeamMgr(false); }}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              showAdmin
                ? 'bg-green-600/20 border-green-600/40 text-green-400'
                : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.9 2.9l1.4 1.4M9.7 9.7l1.4 1.4M2.9 11.1l1.4-1.4M9.7 4.3l1.4-1.4"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Správa
          </button>
        </div>

        {/* Action error */}
        {actionErr && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
            <span className="text-red-400 shrink-0">⚠</span>
            <p className="text-red-400 text-sm flex-1">{actionErr}</p>
            <button onClick={() => setActionErr('')} className="text-red-400/60 hover:text-red-400 text-lg leading-none">×</button>
          </div>
        )}

        {/* ── ADMIN PANEL ─────────────────────────────────────── */}
        {showAdmin && (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 mb-6 space-y-6">
            <h2 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
              <div className="w-1 h-4 bg-green-500 rounded-full" /> Správa turnaje
            </h2>

            {/* Týmy turnaje */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Týmy turnaje</p>
                <button
                  onClick={() => setShowTeamMgr(v => !v)}
                  className="text-xs text-green-400 hover:text-green-300 transition-colors"
                >
                  {showTeamMgr ? 'Zavřít' : `Spravovat (${teams.length})`}
                </button>
              </div>
              {!showTeamMgr && teams.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {teams.map(t => (
                    <span key={t.id} className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-2 py-1 rounded-full">
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
              {!showTeamMgr && teams.length === 0 && (
                <p className="text-sm text-gray-500">Žádné týmy — přidej je pomocí „Spravovat".</p>
              )}
              {showTeamMgr && (
                <div className="mt-3 bg-gray-950 rounded-xl p-4 border border-gray-800">
                  <TeamSelector
                    tournamentId={id}
                    currentTeams={teams}
                    onSave={handleSaveTeams}
                  />
                </div>
              )}
            </div>

            <div className="border-t border-gray-800" />

            {/* Fáze a skupiny */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Fáze a skupiny</p>

              {phases.length === 0 && (
                <p className="text-sm text-gray-500 mb-3">Žádné fáze — vytvoř první fázi.</p>
              )}

              {phases.map(phase => (
                <div key={phase.id} className="mb-4 bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
                  {/* Hlavička fáze */}
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800 bg-gray-800/30">
                    <div className="w-1 h-4 bg-green-500/60 rounded-full" />
                    <span className="font-semibold text-white text-sm flex-1">{phase.name}</span>
                    <button
                      onClick={() => handleDeletePhase(phase.id)}
                      className="text-xs text-red-400/60 hover:text-red-400 px-1.5 py-0.5 transition-colors"
                    >
                      Smazat
                    </button>
                  </div>

                  {/* Skupiny fáze */}
                  <div className="px-4 py-3 space-y-2">
                    {groupsForPhase(phase.id).map(group => {
                      const gTeamIds = groupTeams.filter(gt => gt.groupId === group.id).map(gt => gt.teamId);
                      const gTeams   = teams.filter(t => gTeamIds.includes(t.id));
                      const gMatches = matches.filter(m => m.groupId === group.id);
                      return (
                        <div key={group.id} className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white flex-1">{group.name}</span>
                            <span className="text-xs text-gray-500">{gTeams.length} týmů · {gMatches.length} zápasů</span>
                            <button
                              onClick={() => handleDeleteGroup(group.id)}
                              className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                            >
                              Smazat
                            </button>
                          </div>

                          {/* Přiřazení týmů */}
                          {assigningGroupId === group.id ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                                {teams.map(t => (
                                  <label key={t.id} className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={groupTeamDraft.includes(t.id)}
                                      onChange={e => {
                                        if (e.target.checked) setGroupTeamDraft(p => [...p, t.id]);
                                        else setGroupTeamDraft(p => p.filter(x => x !== t.id));
                                      }}
                                      className="accent-green-500"
                                    />
                                    <span className="truncate">{t.name}</span>
                                  </label>
                                ))}
                              </div>
                              {teams.length === 0 && (
                                <p className="text-xs text-gray-500">Nejprve přidej týmy do turnaje.</p>
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveGroupTeams}
                                  className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                                >
                                  Uložit přiřazení
                                </button>
                                <button
                                  onClick={() => setAssigningGroupId(null)}
                                  className="text-xs text-gray-400 hover:text-white px-2 py-1.5 transition-colors"
                                >
                                  Zrušit
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => openAssignTeams(group.id)}
                                className="text-xs text-green-400 hover:text-green-300 transition-colors"
                              >
                                {gTeams.length === 0 ? '+ Přiřadit týmy' : `Upravit týmy (${gTeams.map(t => t.name).join(', ').slice(0, 40)}…)`}
                              </button>
                              {gTeamIds.length >= 2 && gMatches.length === 0 && (
                                <button
                                  onClick={() => handleGenerateGroupMatches(group.id)}
                                  disabled={generatingGroupId === group.id}
                                  className="text-xs bg-gray-800 border border-gray-700 hover:border-green-600 text-gray-300 hover:text-green-400 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40"
                                >
                                  {generatingGroupId === group.id ? 'Generuji…' : '↻ Generovat zápasy'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Přidat skupinu */}
                    <div className="flex gap-2 pt-1">
                      <input
                        value={newGroupNames[phase.id] ?? ''}
                        onChange={e => setNewGroupNames(p => ({ ...p, [phase.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleCreateGroup(phase.id)}
                        placeholder="Název skupiny (např. Skupina A)"
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors"
                      />
                      <button
                        onClick={() => handleCreateGroup(phase.id)}
                        disabled={!(newGroupNames[phase.id] ?? '').trim()}
                        className="text-xs bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0"
                      >
                        + Skupina
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Přidat fázi */}
              <div className="flex gap-2 mt-2">
                <input
                  value={newPhaseName}
                  onChange={e => setNewPhaseName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreatePhase()}
                  placeholder="Název fáze (např. Group Phase)"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors"
                />
                <button
                  onClick={handleCreatePhase}
                  disabled={!newPhaseName.trim()}
                  className="text-sm bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg font-semibold transition-colors shrink-0"
                >
                  + Fáze
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW: prázdný stav ──────────────────────────────── */}
        {phases.length === 0 && !showAdmin && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 mb-5">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="6" width="24" height="16" rx="3" stroke="#4b5563" strokeWidth="2"/>
                <line x1="2" y1="12" x2="26" y2="12" stroke="#4b5563" strokeWidth="1.5"/>
                <line x1="9" y1="12" x2="9" y2="22" stroke="#4b5563" strokeWidth="1.5"/>
              </svg>
            </div>
            <p className="text-white font-bold text-lg">Žádné fáze ani skupiny</p>
            <p className="text-gray-500 text-sm mt-1.5 max-w-xs mx-auto">
              Otevři <span className="text-gray-300">Správu</span>, vytvoř fázi a skupiny, přiřaď týmy a vygeneruj zápasy.
            </p>
          </div>
        )}

        {/* ── VIEW: fáze + skupiny ────────────────────────────── */}
        {phases.length > 0 && (
          <>
            {/* Phase tabs */}
            <div className="flex gap-0 border-b border-gray-800 mb-6 overflow-x-auto">
              {phases.map(phase => (
                <button
                  key={phase.id}
                  onClick={() => setSelectedPhaseId(phase.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    selectedPhaseId === phase.id
                      ? 'border-green-500 text-green-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {phase.name}
                  <span className="ml-1.5 text-xs opacity-60">
                    ({groupsForPhase(phase.id).length})
                  </span>
                </button>
              ))}
            </div>

            {/* Skupiny vybrané fáze */}
            {selectedPhase && (
              <>
                {groupsForPhase(selectedPhase.id).length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    V této fázi nejsou žádné skupiny. Přidej je v sekci <span className="text-gray-300">Správa</span>.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {groupsForPhase(selectedPhase.id).map(group => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        teams={teamsForGroup(group.id)}
                        matches={matchesForGroup(group.id)}
                        onResultSubmit={handleResultSubmit}
                        onGenerateMatches={handleGenerateGroupMatches}
                        onClearMatches={handleClearGroupMatches}
                        isGenerating={generatingGroupId === group.id}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

      </div>
    </main>
  );
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
