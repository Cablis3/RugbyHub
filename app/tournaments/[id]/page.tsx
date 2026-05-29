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
import { useRole } from '../../../components/AppShell';

// ─────────────────────────────────────────────────────────────

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useRole();

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
      <main className="min-h-screen bg-canvas">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="h-4 w-28 bg-divider rounded animate-pulse mb-6" />
          <div className="h-8 w-64 bg-divider rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-divider rounded animate-pulse mb-8" />
          <div className="flex gap-3 mb-6">
            {[1, 2, 3].map(i => <div key={i} className="h-8 w-24 bg-divider rounded-full animate-pulse" />)}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2].map(i => <div key={i} className="h-48 bg-panel border border-divider rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </main>
    );
  }

  if (loadErr || !tournament) {
    return (
      <main className="min-h-screen bg-canvas">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <a href="/" className="inline-flex items-center gap-1.5 text-sm text-gold-dark hover:text-gold transition-colors mb-5">
            <BackIcon /> Zpět
          </a>
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 mt-4">
            <p className="text-red-700 font-medium text-sm">
              {loadErr ? 'Chyba načítání' : 'Turnaj nenalezen'}
            </p>
            {loadErr && <p className="text-red-500 text-xs mt-0.5">{loadErr}</p>}
          </div>
        </div>
      </main>
    );
  }

  const selectedPhase = phases.find(p => p.id === selectedPhaseId);

  return (
    <main className="min-h-screen bg-canvas">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Zpět */}
        <a href="/" className="inline-flex items-center gap-1.5 text-sm text-gold-dark hover:text-gold transition-colors mb-5">
          <BackIcon /> Zpět na turnaje
        </a>

        {/* Hlavička turnaje */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">{tournament.name}</h1>
            <p className="text-secondary text-sm mt-1.5">{tournament.date}&nbsp;·&nbsp;{tournament.location}</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setShowAdmin(v => !v); setShowTeamMgr(false); }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border shadow-sm ${
                showAdmin
                  ? 'bg-gold text-ink border-gold-dark'
                  : 'bg-ink text-white border-ink hover:border-gold hover:text-gold'
              }`}
            >
              <GearIcon active={showAdmin} />
              Správa
            </button>
          )}
        </div>

        {/* Action error */}
        {actionErr && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
            <span className="text-red-500 shrink-0">⚠</span>
            <p className="text-red-700 text-sm flex-1">{actionErr}</p>
            <button onClick={() => setActionErr('')} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
          </div>
        )}

        {/* ── ADMIN PANEL ─────────────────────────────────────── */}
        {showAdmin && isAdmin && (
          <div className="bg-ink border border-ink-light/30 rounded-2xl p-5 mb-6 space-y-6 shadow-lg">

            {/* Admin panel header */}
            <h2 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
              <div className="w-1 h-4 bg-gold rounded-full" />
              Správa turnaje
            </h2>

            {/* Týmy turnaje */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Týmy turnaje</p>
                <button
                  onClick={() => setShowTeamMgr(v => !v)}
                  className="text-xs text-gold hover:text-gold-dark transition-colors"
                >
                  {showTeamMgr ? 'Zavřít' : `Spravovat (${teams.length})`}
                </button>
              </div>
              {!showTeamMgr && teams.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {teams.map(t => (
                    <span key={t.id} className="text-xs bg-white/10 border border-white/15 text-white/80 px-2 py-1 rounded-full">
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
              {!showTeamMgr && teams.length === 0 && (
                <p className="text-sm text-white/40">Žádné týmy — přidej je pomocí „Spravovat".</p>
              )}
              {showTeamMgr && (
                <div className="mt-3 bg-white/5 rounded-xl p-4 border border-white/10">
                  <TeamSelector
                    tournamentId={id}
                    currentTeams={teams}
                    onSave={handleSaveTeams}
                  />
                </div>
              )}
            </div>

            <div className="border-t border-white/10" />

            {/* Fáze a skupiny */}
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Fáze a skupiny</p>

              {phases.length === 0 && (
                <p className="text-sm text-white/40 mb-3">Žádné fáze — vytvoř první fázi.</p>
              )}

              {phases.map(phase => (
                <div key={phase.id} className="mb-4 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  {/* Hlavička fáze */}
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-white/5">
                    <div className="w-1 h-4 bg-gold/60 rounded-full" />
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
                        <div key={group.id} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white flex-1">{group.name}</span>
                            <span className="text-xs text-white/40">{gTeams.length} týmů · {gMatches.length} zápasů</span>
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
                                  <label key={t.id} className="flex items-center gap-1.5 text-xs text-white/70 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={groupTeamDraft.includes(t.id)}
                                      onChange={e => {
                                        if (e.target.checked) setGroupTeamDraft(p => [...p, t.id]);
                                        else setGroupTeamDraft(p => p.filter(x => x !== t.id));
                                      }}
                                      className="accent-gold"
                                    />
                                    <span className="truncate">{t.name}</span>
                                  </label>
                                ))}
                              </div>
                              {teams.length === 0 && (
                                <p className="text-xs text-white/40">Nejprve přidej týmy do turnaje.</p>
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveGroupTeams}
                                  className="text-xs bg-gold hover:bg-gold-dark text-ink px-3 py-1.5 rounded-lg font-semibold transition-colors"
                                >
                                  Uložit přiřazení
                                </button>
                                <button
                                  onClick={() => setAssigningGroupId(null)}
                                  className="text-xs text-white/50 hover:text-white px-2 py-1.5 transition-colors"
                                >
                                  Zrušit
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => openAssignTeams(group.id)}
                                className="text-xs text-gold hover:text-gold-dark transition-colors"
                              >
                                {gTeams.length === 0
                                  ? '+ Přiřadit týmy'
                                  : `Upravit týmy (${gTeams.map(t => t.name).join(', ').slice(0, 40)}…)`}
                              </button>
                              {gTeamIds.length >= 2 && gMatches.length === 0 && (
                                <button
                                  onClick={() => handleGenerateGroupMatches(group.id)}
                                  disabled={generatingGroupId === group.id}
                                  className="text-xs bg-white/10 border border-white/15 hover:border-gold/50 text-white/70 hover:text-gold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40"
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
                        className="flex-1 bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold transition-colors"
                      />
                      <button
                        onClick={() => handleCreateGroup(phase.id)}
                        disabled={!(newGroupNames[phase.id] ?? '').trim()}
                        className="text-xs bg-gold hover:bg-gold-dark disabled:opacity-40 text-ink px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0"
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
                  className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold transition-colors"
                />
                <button
                  onClick={handleCreatePhase}
                  disabled={!newPhaseName.trim()}
                  className="text-sm bg-gold hover:bg-gold-dark disabled:opacity-40 text-ink px-4 py-2 rounded-xl font-semibold transition-colors shrink-0 shadow-sm"
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-panel border border-divider mb-5 shadow-sm">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="6" width="24" height="16" rx="3" stroke="#D4AF37" strokeWidth="2"/>
                <line x1="2" y1="12" x2="26" y2="12" stroke="#D4AF37" strokeWidth="1.5"/>
                <line x1="9" y1="12" x2="9" y2="22" stroke="#D4AF37" strokeWidth="1.5"/>
              </svg>
            </div>
            <p className="text-ink font-bold text-lg">Žádné fáze ani skupiny</p>
            <p className="text-secondary text-sm mt-1.5 max-w-xs mx-auto">
              {isAdmin
                ? <>Klikni na <span className="text-ink font-medium">Správa</span>, vytvoř fázi a skupiny, přiřaď týmy a vygeneruj zápasy.</>
                : 'Turnaj bude brzy nastaven administrátorem.'}
            </p>
          </div>
        )}

        {/* ── VIEW: fáze + skupiny ────────────────────────────── */}
        {phases.length > 0 && (
          <>
            {/* Phase tabs */}
            <div className="flex gap-0 border-b border-divider mb-6 overflow-x-auto">
              {phases.map(phase => (
                <button
                  key={phase.id}
                  onClick={() => setSelectedPhaseId(phase.id)}
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                    selectedPhaseId === phase.id
                      ? 'border-gold text-gold-dark'
                      : 'border-transparent text-muted hover:text-secondary hover:border-divider'
                  }`}
                >
                  {phase.name}
                  <span className={`ml-1.5 text-xs font-normal ${
                    selectedPhaseId === phase.id ? 'text-gold-dark/70' : 'text-muted'
                  }`}>
                    ({groupsForPhase(phase.id).length})
                  </span>
                </button>
              ))}
            </div>

            {/* Skupiny vybrané fáze */}
            {selectedPhase && (
              <>
                {groupsForPhase(selectedPhase.id).length === 0 ? (
                  <div className="text-center py-12 text-secondary text-sm">
                    V této fázi nejsou žádné skupiny.{' '}
                    {isAdmin && <span className="text-ink font-medium">Přidej je v sekci Správa.</span>}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {groupsForPhase(selectedPhase.id).map(group => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        teams={teamsForGroup(group.id)}
                        matches={matchesForGroup(group.id)}
                        isAdmin={isAdmin}
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

// ── Ikony ─────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function GearIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="2.5" stroke={active ? '#111111' : 'currentColor'} strokeWidth="1.5"/>
      <path
        d="M7 1v2M7 11v2M1 7h2M11 7h2M2.9 2.9l1.4 1.4M9.7 9.7l1.4 1.4M2.9 11.1l1.4-1.4M9.7 4.3l1.4-1.4"
        stroke={active ? '#111111' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round"
      />
    </svg>
  );
}
