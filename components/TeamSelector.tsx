'use client';

import { useState } from 'react';
import { czechRugbyClubs } from '../data/clubs';
import { Team } from '../types';
import { generateId } from '../lib/storage';

type Props = {
  tournamentId: string;
  currentTeams: Team[];
  onSave: (teams: Team[]) => void;
};

export function TeamSelector({ tournamentId, currentTeams, onSave }: Props) {
  const [teams, setTeams] = useState<Team[]>(currentTeams);
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');

  const filteredClubs = czechRugbyClubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  const isSelected = (clubId: string) => teams.some(t => t.clubId === clubId);

  const toggleClub = (clubId: string, clubName: string) => {
    if (isSelected(clubId)) {
      setTeams(prev => prev.filter(t => t.clubId !== clubId));
    } else {
      setTeams(prev => [...prev, { id: generateId(), tournamentId, name: clubName, clubId }]);
    }
  };

  const addCustomTeam = () => {
    const name = customName.trim();
    if (!name) return;
    setTeams(prev => [...prev, { id: generateId(), tournamentId, name }]);
    setCustomName('');
  };

  const removeTeam = (teamId: string) => setTeams(prev => prev.filter(t => t.id !== teamId));

  return (
    <div className="space-y-6">
      {/* Vybrané týmy */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">
            Vybrané týmy <span className="text-white/50 font-normal">({teams.length})</span>
          </h3>
          <button
            onClick={() => onSave(teams)}
            className="bg-gold hover:bg-gold-dark active:bg-gold-dark text-ink px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors min-h-[36px] shadow-sm"
          >
            Uložit
          </button>
        </div>

        {teams.length === 0 ? (
          <p className="text-sm text-white/50">Vyber týmy ze seznamu klubů níže nebo přidej vlastní.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {teams.map(t => (
              <span key={t.id} className="flex items-center gap-1 bg-white/10 border border-white/20 text-white text-sm px-3 py-1 rounded-full">
                {t.name}
                <button
                  onClick={() => removeTeam(t.id)}
                  className="ml-1 text-white/40 hover:text-white transition-colors text-base leading-none"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/10" />

      {/* Vlastní tým */}
      <div>
        <h3 className="font-semibold text-white mb-2">Přidat vlastní tým</h3>
        <div className="flex gap-2">
          <input
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomTeam()}
            placeholder="Název týmu..."
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-base text-white placeholder-white/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all"
          />
          <button
            onClick={addCustomTeam}
            className="bg-white/10 border border-white/20 hover:border-gold hover:text-gold text-white/70 rounded-xl px-4 py-2 text-sm transition-colors min-h-[44px]"
          >
            Přidat
          </button>
        </div>
      </div>

      <div className="border-t border-white/10" />

      {/* Kluby ČRU */}
      <div>
        <h3 className="font-semibold text-white mb-2">Kluby ČRU</h3>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Hledat klub nebo město..."
          className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-base text-white placeholder-white/30 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all mb-2"
        />
        <div className="space-y-0 max-h-64 overflow-y-auto rounded-xl border border-white/10">
          {filteredClubs.map((club) => (
            <label
              key={club.id}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors border-b border-white/10 last:border-0 ${
                isSelected(club.id)
                  ? 'bg-gold/15 border-l-2 border-l-gold'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected(club.id)}
                onChange={() => toggleClub(club.id, club.name)}
                className="rounded accent-gold"
              />
              <span className="text-sm font-medium text-white flex-1">{club.name}</span>
              <span className="text-xs text-white/40">{club.city}</span>
            </label>
          ))}
          {filteredClubs.length === 0 && (
            <p className="text-sm text-white/40 px-3 py-4 text-center bg-white/5">Žádný klub nenalezen.</p>
          )}
        </div>
      </div>
    </div>
  );
}
