'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tournament } from '../types';
import { getTournaments, saveTournament } from '../lib/db';
import { generateId } from '../lib/storage';

const STATUS_LABEL: Record<Tournament['status'], string> = {
  draft:    'Příprava',
  active:   'Aktivní',
  finished: 'Ukončen',
};

const STATUS_CLASS: Record<Tournament['status'], string> = {
  draft:    'text-amber-400 bg-amber-400/10 border border-amber-400/20',
  active:   'text-green-400 bg-green-400/10 border border-green-400/20',
  finished: 'text-gray-400 bg-gray-400/10 border border-gray-400/20',
};

export default function HomePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadErr, setLoadErr]   = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName]         = useState('');
  const [date, setDate]         = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving]     = useState(false);
  const [formErr, setFormErr]   = useState('');

  // ── načtení turnajů ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadErr('');

    getTournaments()
      .then(data => { if (!cancelled) setTournaments(data); })
      .catch(err  => { if (!cancelled) setLoadErr(err.message ?? 'Chyba načítání.'); })
      .finally(()  => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  // ── vytvoření turnaje ─────────────────────────────────────────
  const handleCreate = async () => {
    if (!name.trim() || !date || !location.trim()) {
      setFormErr('Vyplň prosím všechna pole.');
      return;
    }
    setSaving(true);
    setFormErr('');

    const t: Tournament = {
      id:        generateId(),
      name:      name.trim(),
      date,
      location:  location.trim(),
      status:    'draft',
      createdAt: new Date().toISOString(),
    };

    try {
      await saveTournament(t);
      setTournaments(prev => [t, ...prev]);
      setName(''); setDate(''); setLocation('');
      setShowForm(false);
    } catch (err: unknown) {
      setFormErr(err instanceof Error ? err.message : 'Nepodařilo se uložit turnaj.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Hero */}
        <div className="flex items-start justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none">
              Turnaje
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Rugby · ČR · Systém každý s každým
            </p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="shrink-0 flex items-center gap-1.5 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors min-h-[44px]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Nový turnaj
          </button>
        </div>

        {/* Formulář nového turnaje */}
        {showForm && (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 sm:p-6 mb-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 bg-green-500 rounded-full" />
              <h2 className="font-bold text-base text-white">Nový turnaj</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Název turnaje</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="např. Pražský pohár 2025"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-3 text-base text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Datum</label>
                <input
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  type="date"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-3 text-base text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Místo konání</label>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="např. Praha – Petrovice"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-3 text-base text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-colors"
                />
              </div>
              {formErr && (
                <p className="text-red-400 text-sm flex items-center gap-1.5">
                  <span aria-hidden>⚠</span> {formErr}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-5">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3 rounded-lg text-sm font-semibold transition-colors min-h-[44px]"
              >
                {saving ? 'Ukládám…' : 'Vytvořit turnaj'}
              </button>
              <button
                onClick={() => { setShowForm(false); setFormErr(''); }}
                disabled={saving}
                className="flex-1 sm:flex-none px-5 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors min-h-[44px]"
              >
                Zrušit
              </button>
            </div>
          </div>
        )}

        {/* Stavy načítání / chyba */}
        {loading && (
          <div className="space-y-2.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[72px] bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && loadErr && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3.5">
            <span className="text-red-400 mt-0.5" aria-hidden>⚠</span>
            <div>
              <p className="text-red-400 font-medium text-sm">Nepodařilo se načíst turnaje</p>
              <p className="text-red-400/70 text-xs mt-0.5">{loadErr}</p>
            </div>
          </div>
        )}

        {/* Seznam turnajů */}
        {!loading && !loadErr && tournaments.length === 0 && (
          <div className="text-center py-20 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 mb-5">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="14" cy="14" rx="8" ry="13" stroke="#4b5563" strokeWidth="2"/>
                <line x1="1" y1="14" x2="27" y2="14" stroke="#4b5563" strokeWidth="2"/>
                <line x1="4" y1="8" x2="24" y2="8" stroke="#4b5563" strokeWidth="1.5"/>
                <line x1="4" y1="20" x2="24" y2="20" stroke="#4b5563" strokeWidth="1.5"/>
              </svg>
            </div>
            <p className="text-white font-bold text-lg">Žádné turnaje</p>
            <p className="text-gray-500 text-sm mt-1.5 max-w-xs mx-auto">
              Klikni na „+ Nový turnaj" a založ první turnaj.
            </p>
          </div>
        )}

        {!loading && !loadErr && tournaments.length > 0 && (
          <div className="space-y-2.5">
            {tournaments.map(t => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="group flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 hover:border-green-600/60 transition-all duration-150 min-h-[72px]"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <p className="font-bold text-white group-hover:text-green-400 transition-colors leading-snug truncate">
                    {t.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">
                    {t.date}&nbsp;·&nbsp;{t.location}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_CLASS[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                  <svg
                    className="text-gray-600 group-hover:text-green-500 transition-colors"
                    width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
