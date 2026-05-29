'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tournament } from '../types';
import { getTournaments, saveTournament } from '../lib/db';
import { generateId } from '../lib/storage';
import { useRole } from '../components/AppShell';

const STATUS_LABEL: Record<Tournament['status'], string> = {
  draft:    'Příprava',
  active:   'Aktivní',
  finished: 'Ukončen',
};

const STATUS_CLASS: Record<Tournament['status'], string> = {
  draft:    'text-amber-700 bg-amber-50 border border-amber-200',
  active:   'text-green-700 bg-green-50 border border-green-200',
  finished: 'text-secondary bg-canvas border border-divider',
};

export default function HomePage() {
  const { isAdmin } = useRole();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [loadErr,   setLoadErr]   = useState('');
  const [showForm,  setShowForm]  = useState(false);
  const [name,      setName]      = useState('');
  const [date,      setDate]      = useState('');
  const [location,  setLocation]  = useState('');
  const [saving,    setSaving]    = useState(false);
  const [formErr,   setFormErr]   = useState('');

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
    <main className="min-h-screen bg-canvas">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Hero */}
        <div className="flex items-start justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight leading-none">
              Turnaje
            </h1>
            <p className="text-secondary text-sm mt-2">Rugby · ČR · Systém každý s každým</p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowForm(v => !v)}
              className="shrink-0 flex items-center gap-1.5 bg-ink hover:bg-ink-light active:bg-ink text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors min-h-[44px] shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Nový turnaj
            </button>
          )}
        </div>

        {/* Formulář — jen pro admina */}
        {isAdmin && showForm && (
          <div className="bg-panel border border-divider rounded-2xl p-5 sm:p-6 mb-6 shadow-md">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 bg-gold rounded-full" />
              <h2 className="font-bold text-base text-ink">Nový turnaj</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5 uppercase tracking-wide">Název turnaje</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="např. Pražský pohár 2025"
                  className="w-full bg-canvas border border-divider rounded-xl px-3.5 py-3 text-base text-ink placeholder-muted focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5 uppercase tracking-wide">Datum</label>
                <input
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  type="date"
                  className="w-full bg-canvas border border-divider rounded-xl px-3.5 py-3 text-base text-ink focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5 uppercase tracking-wide">Místo konání</label>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="např. Praha – Petrovice"
                  className="w-full bg-canvas border border-divider rounded-xl px-3.5 py-3 text-base text-ink placeholder-muted focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                />
              </div>
              {formErr && (
                <p className="text-red-600 text-sm flex items-center gap-1.5">
                  <span aria-hidden>⚠</span> {formErr}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-5">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 sm:flex-none bg-gold hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed text-ink px-5 py-3 rounded-xl text-sm font-semibold transition-colors min-h-[44px] shadow-sm"
              >
                {saving ? 'Ukládám…' : 'Vytvořit turnaj'}
              </button>
              <button
                onClick={() => { setShowForm(false); setFormErr(''); }}
                disabled={saving}
                className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm text-secondary hover:text-ink hover:bg-canvas border border-divider transition-colors min-h-[44px]"
              >
                Zrušit
              </button>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[72px] bg-panel border border-divider rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Chyba načítání */}
        {!loading && loadErr && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3.5">
            <span className="text-red-500 mt-0.5" aria-hidden>⚠</span>
            <div>
              <p className="text-red-700 font-medium text-sm">Nepodařilo se načíst turnaje</p>
              <p className="text-red-500 text-xs mt-0.5">{loadErr}</p>
            </div>
          </div>
        )}

        {/* Prázdný stav */}
        {!loading && !loadErr && tournaments.length === 0 && (
          <div className="text-center py-20 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-panel border border-divider mb-5 shadow-sm">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <ellipse cx="14" cy="14" rx="8" ry="13" stroke="#D4AF37" strokeWidth="2"/>
                <line x1="1" y1="14" x2="27" y2="14" stroke="#D4AF37" strokeWidth="2"/>
                <line x1="4" y1="8" x2="24" y2="8" stroke="#D4AF37" strokeWidth="1.5"/>
                <line x1="4" y1="20" x2="24" y2="20" stroke="#D4AF37" strokeWidth="1.5"/>
              </svg>
            </div>
            <p className="text-ink font-bold text-lg">Žádné turnaje</p>
            <p className="text-secondary text-sm mt-1.5 max-w-xs mx-auto">
              {isAdmin
                ? 'Klikni na „+ Nový turnaj" a založ první turnaj.'
                : 'Zatím nebyly vytvořeny žádné turnaje.'}
            </p>
          </div>
        )}

        {/* Seznam turnajů */}
        {!loading && !loadErr && tournaments.length > 0 && (
          <div className="space-y-2.5">
            {tournaments.map(t => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="group flex items-center justify-between bg-panel border border-divider rounded-2xl px-5 py-4 hover:border-gold hover:shadow-md transition-all duration-150 min-h-[72px] shadow-sm"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <p className="font-bold text-ink group-hover:text-gold-dark transition-colors leading-snug truncate">
                    {t.name}
                  </p>
                  <p className="text-sm text-secondary mt-0.5 truncate">
                    {t.date}&nbsp;·&nbsp;{t.location}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_CLASS[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                  <svg className="text-muted group-hover:text-gold transition-colors"
                    width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.75"
                      strokeLinecap="round" strokeLinejoin="round"/>
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
